import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface PlantingTree {
  id: string;
  treeType: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

export interface PlantLocation {
  latitude: number;
  longitude: number;
}

export const PLANTING_BOUNDS = L.latLngBounds(
  [12.165, 107.145],
  [12.193, 107.175],
);

const PLANTING_CENTER: L.LatLngExpression = [12.178981, 107.158138];
const MINIMUM_TREE_DISTANCE_METERS = 40;
let plantingMap: L.Map | null = null;
let previewMarker: L.Marker | null = null;
let existingMarkers: L.Marker[] = [];
let resultMap: L.Map | null = null;
let resultMarkers: L.Marker[] = [];

const iconFor = (treeType: string, preview = false): L.DivIcon => {
  const icon = treeType === 'fruit' ? '🌿' : treeType === 'canopy' ? '🌱' : '🌳';
  return L.divIcon({
    className: preview ? 'user-tree-preview' : 'planting-tree-marker',
    html: `<span aria-hidden="true">${icon}</span>`,
    iconSize: preview ? [34, 40] : [25, 30],
    iconAnchor: preview ? [17, 35] : [12, 27],
  });
};

const hasValidLocation = (tree: PlantingTree): tree is PlantingTree & { latitude: number; longitude: number } =>
  typeof tree.latitude === 'number'
  && Number.isFinite(tree.latitude)
  && typeof tree.longitude === 'number'
  && Number.isFinite(tree.longitude)
  && PLANTING_BOUNDS.contains([tree.latitude, tree.longitude]);

const validTreeLocation = (tree: PlantingTree): tree is PlantingTree & { latitude: number; longitude: number } =>
  tree.status === 'CONFIRMED' && hasValidLocation(tree);

export const initPlantingMap = (
  onLocationSelected: (location: PlantLocation | null, message?: string) => void,
): L.Map | null => {
  const element = document.querySelector<HTMLElement>('#plant-location-map');
  if (!element) return null;
  if (plantingMap) {
    plantingMap.invalidateSize();
    return plantingMap;
  }

  plantingMap = L.map(element, {
    center: PLANTING_CENTER,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    attributionControl: true,
    maxBounds: PLANTING_BOUNDS,
    maxBoundsViscosity: 1,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(plantingMap);
  plantingMap.fitBounds(PLANTING_BOUNDS);
  plantingMap.on('click', (event) => {
    const nearby = existingMarkers.some((marker) =>
      plantingMap && plantingMap.distance(event.latlng, marker.getLatLng()) < MINIMUM_TREE_DISTANCE_METERS);
    if (nearby) {
      onLocationSelected(null, 'Vị trí này đã có một mầm xanh. Hãy chọn một vị trí khác.');
      return;
    }
    onLocationSelected({ latitude: event.latlng.lat, longitude: event.latlng.lng });
  });
  element.classList.add('plant-location-map');
  window.setTimeout(() => plantingMap?.invalidateSize(), 0);
  return plantingMap;
};

export const renderPlantingTrees = (trees: PlantingTree[]): void => {
  if (!plantingMap) return;
  existingMarkers.forEach((marker) => marker.remove());
  existingMarkers = [];
  trees.filter(validTreeLocation).forEach((tree) => {
    const marker = L.marker([tree.latitude, tree.longitude], {
      icon: iconFor(tree.treeType),
      interactive: false,
      title: 'Mầm xanh đã được gieo',
    }).addTo(plantingMap as L.Map);
    existingMarkers.push(marker);
  });
};

export const setPlantingPreview = (location: PlantLocation, treeType: string): void => {
  if (!plantingMap) return;
  previewMarker?.remove();
  previewMarker = L.marker([location.latitude, location.longitude], {
    icon: iconFor(treeType, true),
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(plantingMap);
};

export const clearPlantingPreview = (): void => {
  previewMarker?.remove();
  previewMarker = null;
};

export const renderPlantingResultMap = (trees: PlantingTree[], selectedTreeId: string): void => {
  const element = document.querySelector<HTMLElement>('#plant-result-map');
  if (!element) return;
  if (!resultMap) {
    resultMap = L.map(element, {
      center: PLANTING_CENTER,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true,
      maxBounds: PLANTING_BOUNDS,
      maxBoundsViscosity: 1,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      noWrap: true,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(resultMap);
    resultMap.fitBounds(PLANTING_BOUNDS);
  }
  resultMarkers.forEach((marker) => marker.remove());
  resultMarkers = [];
  trees.filter((tree) => hasValidLocation(tree)).forEach((tree) => {
    const marker = L.marker([tree.latitude, tree.longitude], {
      icon: iconFor(tree.treeType, tree.id === selectedTreeId),
      interactive: false,
    }).addTo(resultMap as L.Map);
    resultMarkers.push(marker);
  });
  window.setTimeout(() => resultMap?.invalidateSize(), 0);
};
