import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Company } from '@/data/companies';
import { useTheme, type Theme } from '@/hooks/useTheme';
import {
  createFallbackImage,
  PIN_BORDER_RADIUS,
  PIN_BORDER_WIDTH,
  PIN_INNER_RADIUS,
  PIN_PADDING,
  PIN_SCALE,
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
const ACTIVE_LAYER_ID = 'company-pins-active';
const LABEL_LAYER_ID = 'company-labels';
const NO_ACTIVE_PIN: maplibregl.FilterSpecification = ['==', ['get', 'id'], '__none__'];

/** Pin and label colours per theme, matching the interface tokens. */
const PIN_COLORS: Record<Theme, { border: string; activeBorder: string; plate: string }> = {
  light: { border: '#FFFFFF', activeBorder: '#12618A', plate: '#FFFFFF' },
  dark: { border: '#404040', activeBorder: '#5DB7E5', plate: '#F5F5F5' },
};

const LABEL_COLORS: Record<Theme, { text: string; halo: string }> = {
  light: { text: '#171717', halo: '#FFFFFF' },
  dark: { text: '#FAFAFA', halo: '#171717' },
};

const BASEMAP_LABEL_COLORS: Record<Theme, { text: string; halo: string }> = {
  light: { text: '#303030', halo: '#F7F7F5' },
  dark: { text: '#F2F2F2', halo: '#242424' },
};

const drawPin = (
  source: CanvasImageSource,
  borderColor: string,
  plateColor: string,
): ImageData | null => {
  const canvas = document.createElement('canvas');
  canvas.width = PIN_SIZE * PIN_SCALE;
  canvas.height = PIN_SIZE * PIN_SCALE;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(PIN_SCALE, PIN_SCALE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

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
  context.fillStyle = plateColor;
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

  return context.getImageData(0, 0, PIN_SIZE * PIN_SCALE, PIN_SIZE * PIN_SCALE);
};

/** Replaces any existing image (such as the transparent placeholder) with the final pin. */
const setImage = (map: maplibregl.Map, id: string, data: ImageData) => {
  if (map.hasImage(id)) map.removeImage(id);
  map.addImage(id, data, { pixelRatio: PIN_SCALE });
};

const ORIGINAL_PAINT = new WeakMap<maplibregl.Map, Map<string, unknown>>();
const THEMEABLE_PAINT = ['background-color', 'fill-color', 'line-color', 'fill-extrusion-color'] as const;

const toNeutralDarkColor = (value: string): string => {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return value;
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const parsed = probe.fillStyle as string;
  const match = /^#([0-9a-f]{6})$/i.exec(parsed);
  if (!match) return value;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const lightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Keep geographic hierarchy while removing hue from non-interactive map surfaces.
  const neutral = Math.round(30 + (1 - lightness) * 35);
  const channel = neutral.toString(16).padStart(2, '0');
  return `#${channel}${channel}${channel}`;
};

/** Recolours the basemap so it matches the light or dark interface. */
const applyBasemapTheme = (map: maplibregl.Map, theme: Theme) => {
  const style = map.getStyle();
  if (!style?.layers) return;
  let originals = ORIGINAL_PAINT.get(map);
  if (!originals) {
    originals = new Map();
    ORIGINAL_PAINT.set(map, originals);
  }

  style.layers.forEach((layer) => {
    if (layer.id.startsWith('company-')) return;
    THEMEABLE_PAINT.forEach((property) => {
      const paint = (layer as { paint?: Record<string, unknown> }).paint;
      if (!paint || !(property in paint)) return;
      const key = `${layer.id}::${property}`;
      if (!originals.has(key)) originals.set(key, paint[property]);
      const original = originals!.get(key);
      if (typeof original !== 'string') return;
      map.setPaintProperty(layer.id, property, theme === 'dark' ? toNeutralDarkColor(original) : original);
    });

    if (layer.type === 'symbol') {
      const key = `${layer.id}::text-color`;
      const paint = (layer as { paint?: Record<string, unknown> }).paint;
       if (!paint || !('text-color' in paint)) return;
       const haloKey = `${layer.id}::text-halo-color`;
       if (!originals.has(key)) originals.set(key, paint['text-color']);
       if (!originals.has(haloKey)) originals.set(haloKey, paint['text-halo-color']);
       const labelPalette = BASEMAP_LABEL_COLORS[theme];
       map.setPaintProperty(layer.id, 'text-color', labelPalette.text);
       if ('text-halo-color' in paint) map.setPaintProperty(layer.id, 'text-halo-color', labelPalette.halo);
    }
  });
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
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const activePinUpdaterRef = useRef<(() => void) | null>(null);
  const loadedLogosRef = useRef(new Set<string>());
  const logoImageCacheRef = useRef(new Map<string, HTMLImageElement>());
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

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

  const registerLogo = async (company: Company, map: maplibregl.Map) => {
    const imageId = `logo-${company.id}`;
    // The logo URL and theme are part of the key so edited logos and theme switches redraw the pin.
    const cacheKey = `${imageId}::${company.logoUrl ?? ''}::${themeRef.current}`;
    if (loadedLogosRef.current.has(cacheKey)) return;
    loadedLogosRef.current.add(cacheKey);

    const sourceKey = `${imageId}::${company.logoUrl ?? ''}`;
    let image: HTMLImageElement | null = logoImageCacheRef.current.get(sourceKey) ?? null;
    if (!image) {
      try {
        image = await loadImage(company.logoUrl || createFallbackImage(company.name));
      } catch {
        image = await loadImage(createFallbackImage(company.name)).catch(() => null);
      }
      if (image) logoImageCacheRef.current.set(sourceKey, image);
    }
    if (!image) {
      loadedLogosRef.current.delete(cacheKey);
      return;
    }

    if (!mapRef.current) return;
    const palette = PIN_COLORS[themeRef.current];
    const normal = drawPin(image, palette.border, palette.plate);
    const hover = drawPin(image, palette.activeBorder, palette.plate);
    if (normal) setImage(map, imageId, normal);
    if (hover) setImage(map, `${imageId}-hover`, hover);
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
          'icon-image': ['get', 'imageId'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.4, 8, 0.6, 14, 0.8],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });
      // Hovered/selected pin renders on top with the darker border and a slight scale-up.
      map.addLayer({
        id: ACTIVE_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: NO_ACTIVE_PIN,
        layout: {
          'icon-image': ['get', 'hoverImageId'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.46, 8, 0.69, 14, 0.92],
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
          'text-color': LABEL_COLORS[themeRef.current].text,
          'text-halo-color': LABEL_COLORS[themeRef.current].halo,
          'text-halo-width': 1,
        },
      });
      applyBasemapTheme(map, themeRef.current);
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

    const applyActivePin = () => {
      const activeId = hoveredIdRef.current ?? selectedIdRef.current;
      if (!map.getLayer(ACTIVE_LAYER_ID)) return;
      map.setFilter(ACTIVE_LAYER_ID, activeId ? ['==', ['get', 'id'], activeId] : NO_ACTIVE_PIN);
    };
    activePinUpdaterRef.current = applyActivePin;

    const setHoveredFeature = (event: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      hoveredIdRef.current = (event.features?.[0]?.properties?.id as string) ?? null;
      applyActivePin();
    };

    const clearHoveredFeature = () => {
      map.getCanvas().style.cursor = '';
      hoveredIdRef.current = null;
      applyActivePin();
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
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildFeatureCollection(companies));
    void Promise.all(companies.map((company) => registerLogo(company, map)));
  }, [companies, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    selectedIdRef.current = selectedCompany?.id ?? null;
    activePinUpdaterRef.current?.();

    if (selectedCompany) {
      map.flyTo({ center: [selectedCompany.longitude, selectedCompany.latitude], zoom: 14, duration: 1200 });
    }
  }, [selectedCompany, isLoaded]);

  // Re-skins the basemap, labels and pins whenever the interface theme changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    applyBasemapTheme(map, theme);
    if (map.getLayer(LABEL_LAYER_ID)) {
      map.setPaintProperty(LABEL_LAYER_ID, 'text-color', LABEL_COLORS[theme].text);
      map.setPaintProperty(LABEL_LAYER_ID, 'text-halo-color', LABEL_COLORS[theme].halo);
    }
    void Promise.all(companiesRef.current.map((company) => registerLogo(company, map)));
  }, [theme, isLoaded]);

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