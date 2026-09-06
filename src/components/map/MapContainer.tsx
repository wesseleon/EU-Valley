import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Company } from '@/data/companies';
import {
  createFallbackImage,
  PIN_BORDER_RADIUS,
  PIN_BORDER_WIDTH,
  PIN_INNER_RADIUS,
  PIN_PADDING,
  PIN_SIZE,
} from '@/lib/createFallbackImage';

interface MapContainerProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company | null) => void;
  viewCenter: [number, number];
  viewZoom: number;
}

const SOURCE_ID = 'companies';
const PIN_LAYER_ID = 'company-pins';
const LABEL_LAYER_ID = 'company-labels';

const drawPin = (
  source: CanvasImageSource,
  borderColor: string,
): ImageData | null => {
  const canvas = document.createElement('canvas');
  canvas.width = PIN_SIZE;
  canvas.height = PIN_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = borderColor;
  context.beginPath();
  context.roundRect(0, 0, PIN_SIZE, PIN_SIZE, PIN_BORDER_RADIUS);
  context.fill();
  context.save();
  context.beginPath();
  context.roundRect(
    PIN_PADDING,
    PIN_PADDING,
    PIN_SIZE - PIN_PADDING * 2,
    PIN_SIZE - PIN_PADDING * 2,
    PIN_INNER_RADIUS,
  );
  context.clip();
  context.fillStyle = '#FFFFFF';
  context.fillRect(PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2);
  context.drawImage(source, PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2);
  context.restore();
  context.strokeStyle = borderColor;
  context.lineWidth = PIN_BORDER_WIDTH;
  context.beginPath();
  context.roundRect(
    PIN_BORDER_WIDTH / 2,
    PIN_BORDER_WIDTH / 2,
    PIN_SIZE - PIN_BORDER_WIDTH,
    PIN_SIZE - PIN_BORDER_WIDTH,
    PIN_BORDER_RADIUS,
  );
  context.stroke();

  return context.getImageData(0, 0, PIN_SIZE, PIN_SIZE);
};

const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = url;
});

export const MapContainer = ({
  companies,
  selectedCompany,
  onCompanySelect,
  viewCenter,
  viewZoom,
}: MapContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const companiesRef = useRef(companies);
  const selectionHandlerRef = useRef(onCompanySelect);
  const hoveredIdRef = useRef<string | number | null>(null);
  const selectedIdRef = useRef<string | number | null>(null);
  const loadedLogosRef = useRef(new Set<string>());
  const [isLoaded, setIsLoaded] = useState(false);

  companiesRef.current = companies;
  selectionHandlerRef.current = onCompanySelect;

  const featureIdsRef = useRef(new Map<string, number>());

  const buildFeatureCollection = (items: Company[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const ids = new Map<string, number>();
    items.forEach((company, index) => ids.set(company.id, index + 1));
    featureIdsRef.current = ids;
    return {
      type: 'FeatureCollection',
      features: items.map((company) => ({
        type: 'Feature',
        id: ids.get(company.id) as number,
        geometry: { type: 'Point', coordinates: [company.longitude, company.latitude] },
        properties: {
          id: company.id,
          name: company.name,
          imageId: `logo-${company.id}`,
          hoverImageId: `logo-${company.id}-hover`,
        },
      })),
    };
  };

  const geojsonData = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => ({
    type: 'FeatureCollection',
    features: companies.map((company, index) => ({
      type: 'Feature',
      id: index + 1,
      geometry: { type: 'Point', coordinates: [company.longitude, company.latitude] },
      properties: {
        id: company.id,
        name: company.name,
        imageId: `logo-${company.id}`,
        hoverImageId: `logo-${company.id}-hover`,
      },
    })),
  }), [companies]);

  const registerLogo = async (company: Company, map: maplibregl.Map) => {
    const imageId = `logo-${company.id}`;
    if (loadedLogosRef.current.has(imageId) || map.hasImage(imageId)) return;
    loadedLogosRef.current.add(imageId);

    let image: HTMLImageElement | null = null;
    try {
      image = await loadImage(company.logoUrl || createFallbackImage(company.name));
    } catch {
      image = await loadImage(createFallbackImage(company.name)).catch(() => null);
    }
    if (!image) {
      loadedLogosRef.current.delete(imageId);
      return;
    }

    if (!mapRef.current) return;
    const normal = drawPin(image, '#FFFFFF');
    const hover = drawPin(image, '#173F8A');
    if (normal && !map.hasImage(imageId)) map.addImage(imageId, normal);
    if (hover && !map.hasImage(`${imageId}-hover`)) map.addImage(`${imageId}-hover`, hover);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://api.maptiler.com/maps/019bf1f1-a9e6-76b9-a536-7aac425452ca/style.json?key=OXErs5ulKuJgqbESSXXz',
      center: viewCenter,
      zoom: viewZoom,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      map.addSource(SOURCE_ID, { type: 'geojson', data: buildFeatureCollection(companiesRef.current) });
      map.addLayer({
        id: PIN_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ['case', ['boolean', ['feature-state', 'active'], false], ['get', 'hoverImageId'], ['get', 'imageId']],
          'icon-size': [
            '*',
            ['interpolate', ['linear'], ['zoom'], 2, 0.4, 8, 0.6, 14, 0.8],
            ['case', ['boolean', ['feature-state', 'active'], false], 1.1, 1],
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
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
          'text-color': '#1A1A1A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 0.6,
        },
      });
      setIsLoaded(true);
      // Logos load in the background so pins appear immediately.
      void Promise.all(companiesRef.current.map((company) => registerLogo(company, map)));
    });

    // Keeps MapLibre quiet while a logo is still being prepared.
    map.on('styleimagemissing', (event) => {
      if (map.hasImage(event.id)) return;
      map.addImage(event.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });

    const selectFeature = (event: maplibregl.MapLayerMouseEvent) => {
      const companyId = event.features?.[0]?.properties?.id;
      const company = companiesRef.current.find((candidate) => candidate.id === companyId);
      if (company) selectionHandlerRef.current(company);
    };

    const setHoveredFeature = (event: maplibregl.MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.id;
      map.getCanvas().style.cursor = 'pointer';
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== selectedIdRef.current) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { active: false });
      }
      if (featureId !== undefined) {
        hoveredIdRef.current = featureId;
        map.setFeatureState({ source: SOURCE_ID, id: featureId }, { active: true });
      }
    };

    const clearHoveredFeature = () => {
      map.getCanvas().style.cursor = '';
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== selectedIdRef.current) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { active: false });
      }
      hoveredIdRef.current = null;
    };

    [PIN_LAYER_ID, LABEL_LAYER_ID].forEach((layerId) => map.on('click', layerId, selectFeature));
    map.on('mousemove', PIN_LAYER_ID, setHoveredFeature);
    map.on('mouseleave', PIN_LAYER_ID, clearHoveredFeature);

    return () => {
      map.remove();
      mapRef.current = null;
      loadedLogosRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    void Promise.all(companies.map((company) => registerLogo(company, map))).then(() => {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      source?.setData(buildFeatureCollection(companies));
    });
  }, [companies, geojsonData, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (selectedIdRef.current !== null) {
      map.setFeatureState({ source: SOURCE_ID, id: selectedIdRef.current }, { active: false });
    }
    selectedIdRef.current = selectedCompany ? featureIdsRef.current.get(selectedCompany.id) ?? null : null;

    if (selectedCompany) {
      const featureId = featureIdsRef.current.get(selectedCompany.id);
      if (featureId !== undefined) map.setFeatureState({ source: SOURCE_ID, id: featureId }, { active: true });
      map.flyTo({ center: [selectedCompany.longitude, selectedCompany.latitude], zoom: 14, duration: 1200 });
    }
  }, [selectedCompany, isLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded || selectedCompany) return;
    mapRef.current.flyTo({ center: viewCenter, zoom: viewZoom, duration: 900 });
  }, [viewCenter, viewZoom, selectedCompany, isLoaded]);

  return (
    <section className="relative h-full w-full" aria-label={`Interactive company map with ${companies.length} locations`}>
      <div ref={containerRef} className="h-full w-full" />
    </section>
  );
};