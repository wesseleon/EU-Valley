import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { Company } from '@/data/companies';

interface MapContainerProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company | null) => void;
  viewCenter: [number, number];
  viewZoom: number;
}

const PROTOMAPS_API_KEY = '67aa953a46e93599';

export const MapContainer = ({
  companies,
  selectedCompany,
  onCompanySelect,
  viewCenter,
  viewZoom,
}: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

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
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when companies change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    companies.forEach((company) => {
      const el = document.createElement('div');
      el.className = 'company-marker';
      el.innerHTML = `
        <div class="marker-container">
          <div class="marker-logo">
            <img src="${company.logoUrl}" alt="${company.name}" onerror="this.src='https://via.placeholder.com/40?text=${company.name.charAt(0)}'" />
          </div>
          <span class="marker-label">${company.name}</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onCompanySelect(company);
      });

      el.addEventListener('mouseenter', () => {
        el.classList.add('hovered');
      });

      el.addEventListener('mouseleave', () => {
        el.classList.remove('hovered');
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([company.longitude, company.latitude])
        .addTo(map.current!);

      markersRef.current.set(company.id, marker);
    });
  }, [companies, mapLoaded, onCompanySelect]);

  // Fly to selected company
  useEffect(() => {
    if (!map.current || !selectedCompany) return;

    map.current.flyTo({
      center: [selectedCompany.longitude, selectedCompany.latitude],
      zoom: 14,
      duration: 1500,
    });

    // Highlight selected marker
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === selectedCompany.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }, [selectedCompany]);

  // Update view when center/zoom changes
  useEffect(() => {
    if (!map.current) return;

    map.current.flyTo({
      center: viewCenter,
      zoom: viewZoom,
      duration: 1000,
    });
  }, [viewCenter, viewZoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <style>{`
        .company-marker {
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .company-marker:hover,
        .company-marker.hovered {
          transform: scale(1.1);
          z-index: 100 !important;
        }
        
        .company-marker.selected {
          z-index: 100 !important;
        }
        
        .company-marker.selected .marker-logo {
          border-color: hsl(var(--primary)) !important;
          box-shadow: 0 0 20px hsl(var(--primary) / 0.5);
        }
        
        .marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .marker-logo {
          width: 40px;
          height: 40px;
          background: hsl(var(--card));
          border: 2px solid hsl(var(--border));
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .company-marker:hover .marker-logo,
        .company-marker.hovered .marker-logo {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 10px hsl(var(--primary) / 0.3);
        }
        
        .marker-logo img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        
        .marker-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--foreground));
          background: hsl(var(--card) / 0.9);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};
