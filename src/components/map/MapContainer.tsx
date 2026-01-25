import { useEffect, useRef, useState, useMemo } from 'react';
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
  const popupRef = useRef<maplibregl.Popup | null>(null);

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
      },
    })),
  }), [companies]);

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

      // Add circle layer for pins
      map.current.addLayer({
        id: 'company-pins',
        type: 'circle',
        source: 'companies',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            2, 4,
            8, 8,
            14, 12
          ],
          'circle-color': 'hsl(220, 70%, 50%)',
          'circle-stroke-width': 2,
          'circle-stroke-color': 'hsl(220, 20%, 95%)',
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
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-max-width': 10,
        },
        paint: {
          'text-color': 'hsl(220, 10%, 90%)',
          'text-halo-color': 'hsl(220, 20%, 10%)',
          'text-halo-width': 1.5,
        },
      });

      setMapLoaded(true);
    });

    // Click handler
    map.current.on('click', 'company-pins', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const companyId = feature.properties?.id;
      const company = companies.find(c => c.id === companyId);
      if (company) {
        onCompanySelect(company);
      }
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
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update GeoJSON data when companies change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource('companies') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }
  }, [geojsonData, mapLoaded]);

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
