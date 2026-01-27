import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Company } from '@/data/companies';

interface MapContainerProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company | null) => void;
  viewCenter: [number, number];
  viewZoom: number;
}

// Pin sizing constants
const PIN_SIZE = 48; // 75% of original 64px
const PIN_BORDER_WIDTH = 1; // Quarter of original 4px
const PIN_BORDER_RADIUS = 6;
const PIN_INNER_RADIUS = 4;
const PIN_PADDING = 2;

// Generate fallback image as data URL
const createFallbackImage = (name: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = PIN_SIZE;
  canvas.height = PIN_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  const hue = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
  ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
  ctx.beginPath();
  ctx.roundRect(PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2, PIN_INNER_RADIUS);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = PIN_BORDER_WIDTH;
  ctx.stroke();
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = `500 18px "TASA Orbiter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase(), PIN_SIZE / 2, PIN_SIZE / 2);
  
  return canvas.toDataURL();
};

export const MapContainer = ({
  companies,
  selectedCompany,
  onCompanySelect,
  viewCenter,
  viewZoom,
}: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const loadedImages = useRef<Set<string>>(new Set());

  // Create GeoJSON from companies
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: companies.map((company) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [company.longitude, company.latitude],
      },
      properties: {
        id: company.id,
        name: company.name,
        category: company.category,
        logoUrl: company.logoUrl,
        city: company.city,
        country: company.country,
        imageId: `logo-${company.id}`,
      },
    })),
  }), [companies]);

  // Load a single company logo into the map
  const loadCompanyLogo = useCallback((company: Company, mapInstance: maplibregl.Map) => {
    const imageId = `logo-${company.id}`;
    if (loadedImages.current.has(imageId) || mapInstance.hasImage(imageId)) {
      return;
    }

    loadedImages.current.add(imageId);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const applyImage = (imgSrc: HTMLImageElement | HTMLCanvasElement) => {
      if (!mapInstance.hasImage(imageId)) {
        const canvas = document.createElement('canvas');
        canvas.width = PIN_SIZE;
        canvas.height = PIN_SIZE;
        const ctx = canvas.getContext('2d')!;
        
        // White background with rounded corners (outer)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(0, 0, PIN_SIZE, PIN_SIZE, PIN_BORDER_RADIUS);
        ctx.fill();
        
        // Clip for logo (inner, nested radius)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2, PIN_INNER_RADIUS);
        ctx.clip();
        
        // Draw logo
        ctx.drawImage(imgSrc, PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2);
        ctx.restore();
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = PIN_BORDER_WIDTH;
        ctx.beginPath();
        ctx.roundRect(PIN_BORDER_WIDTH / 2, PIN_BORDER_WIDTH / 2, PIN_SIZE - PIN_BORDER_WIDTH, PIN_SIZE - PIN_BORDER_WIDTH, PIN_BORDER_RADIUS);
        ctx.stroke();
        
        mapInstance.addImage(imageId, { width: PIN_SIZE, height: PIN_SIZE, data: ctx.getImageData(0, 0, PIN_SIZE, PIN_SIZE).data });
        
        // Refresh source
        const source = mapInstance.getSource('companies') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(geojsonData);
        }
      }
    };
    
    img.onload = () => applyImage(img);
    img.onerror = () => {
      // Use fallback
      const fallbackImg = new Image();
      fallbackImg.onload = () => applyImage(fallbackImg);
      fallbackImg.src = createFallbackImage(company.name);
    };
    
    img.src = company.logoUrl || createFallbackImage(company.name);
  }, [geojsonData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/019bf1f1-a9e6-76b9-a536-7aac425452ca/style.json?key=OXErs5ulKuJgqbESSXXz',
      center: viewCenter,
      zoom: viewZoom,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false, // Disable default attribution
    });

    // Add compact attribution control
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true, // This collapses the attribution by default
    }), 'bottom-right');

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add GeoJSON source
      map.current.addSource('companies', {
        type: 'geojson',
        data: geojsonData,
        cluster: false,
      });

      // Add symbol layer for logo pins
      map.current.addLayer({
        id: 'company-pins',
        type: 'symbol',
        source: 'companies',
        layout: {
          'icon-image': ['get', 'imageId'],
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            2, 0.4,
            8, 0.6,
            14, 0.8
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      // Add labels layer
      map.current.addLayer({
        id: 'company-labels',
        type: 'symbol',
        source: 'companies',
        minzoom: 8,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'text-max-width': 10,
          'text-allow-overlap': false,
          'text-font': ['Noto Sans Bold'],
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 0.8,
        },
      })

      // Load all company logos
      companies.forEach(company => {
        loadCompanyLogo(company, map.current!);
      });

      setMapLoaded(true);
    });

    // Click handler for both layers
    ['company-pins', 'company-labels'].forEach(layerId => {
      map.current!.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const companyId = feature.properties?.id;
        const company = companies.find(c => c.id === companyId);
        if (company) {
          onCompanySelect(company);
        }
      });
    });

    // Hover effects
    map.current.on('mouseenter', 'company-pins', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'company-pins', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      loadedImages.current.clear();
    };
  }, []);

  // Update GeoJSON data and load new logos when companies change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Load logos for any new companies
    companies.forEach(company => {
      loadCompanyLogo(company, map.current!);
    });

    const source = map.current.getSource('companies') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }
  }, [geojsonData, mapLoaded, companies, loadCompanyLogo]);

  // Fly to selected company
  useEffect(() => {
    if (!map.current || !selectedCompany) return;

    map.current.flyTo({
      center: [selectedCompany.longitude, selectedCompany.latitude],
      zoom: 14,
      duration: 1500,
    });
  }, [selectedCompany]);

  // Update view when center/zoom changes (not from selection)
  useEffect(() => {
    if (!map.current || selectedCompany) return;

    map.current.flyTo({
      center: viewCenter,
      zoom: viewZoom,
      duration: 1000,
    });
  }, [viewCenter, viewZoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
