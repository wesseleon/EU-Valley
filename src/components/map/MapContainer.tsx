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

// Generate fallback image as data URL
const createFallbackImage = (name: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  const hue = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
  ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
  ctx.beginPath();
  ctx.roundRect(4, 4, 56, 56, 8);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px TASA Orbiter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase(), 32, 32);
  
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
        // Create canvas for rounded square with border
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // White background with rounded corners
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, 5);
        ctx.fill();
        
        // Clip for logo
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(4, 4, size - 8, size - 8, 8);
        ctx.clip();
        
        // Draw logo
        ctx.drawImage(imgSrc, 4, 4, size - 8, size - 8);
        ctx.restore();
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(1.5, 1.5, size - 3, size - 3, 5);
        ctx.stroke();
        
        mapInstance.addImage(imageId, { width: size, height: size, data: ctx.getImageData(0, 0, size, size).data });
        
        // Refresh source to show new image
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
    });

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
          'text-offset': [0, 2.2],
          'text-anchor': 'top',
          'text-max-width': 10,
          'text-allow-overlap': false,
          'text-font': ['TASA Orbiter Regular', sans-serif],
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
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
