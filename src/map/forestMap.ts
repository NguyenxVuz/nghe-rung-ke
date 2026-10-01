import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ForestMapTree {
  id: string;
  name: string;
  treeType: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

export const FOREST_BOUNDS = L.latLngBounds(
  [12.155, 107.125],
  [12.205, 107.190],
);
const BÙ_GIA_MẬP_CENTER: L.LatLngExpression = [12.178981, 107.158138];
const DEFAULT_ZOOM = 14;
const markers = new Map<string, L.Marker>();
let forestMap: L.Map | null = null;
let treeLegend: L.Control | null = null;

const TREE_TYPES: Record<string, { label: string; icon: string }> = {
  oak: { label: 'Cây rừng', icon: '🌳' },
  fruit: { label: 'Cây ăn quả', icon: '🌿' },
  canopy: { label: 'Cây bản địa', icon: '🌱' },
};

const normalizeTreeType = (treeType: string): string => treeType.trim().toLowerCase();
const treeTypeDetails = (treeType: string): { label: string; icon: string } =>
  TREE_TYPES[normalizeTreeType(treeType)] ?? { label: treeType.trim() || 'Cây rừng', icon: '🌳' };

const escapeHtml = (value: string): string => {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
};

const treeIcon = (treeType: string, isCurrent: boolean): L.DivIcon => L.divIcon({
  className: `tree-marker${isCurrent ? ' tree-marker-current' : ''}`,
  html: `<span aria-hidden="true"><i>${treeTypeDetails(treeType).icon}</i></span>`,
  iconSize: [28, 34],
  iconAnchor: [14, 30],
  popupAnchor: [0, -28],
});

const isValidCoordinate = (tree: ForestMapTree): tree is ForestMapTree & { latitude: number; longitude: number } =>
  tree.status === 'CONFIRMED'
  && typeof tree.latitude === 'number'
  && Number.isFinite(tree.latitude)
  && typeof tree.longitude === 'number'
  && Number.isFinite(tree.longitude)
  && tree.latitude >= -90
  && tree.latitude <= 90
  && tree.longitude >= -180
  && tree.longitude <= 180
  && FOREST_BOUNDS.contains([tree.latitude, tree.longitude]);

const popupContent = (tree: ForestMapTree): string => {
  const date = new Date(tree.confirmedAt ?? tree.createdAt).toLocaleDateString('vi-VN');
  return `<strong>${escapeHtml(treeTypeDetails(tree.treeType).label)}</strong>
    <p>Được trồng bởi: ${escapeHtml(tree.name)}</p>
    <p>Ngày tham gia: ${date}</p>
    <span class="map-popup-status">💚 Đã đồng hành</span>`;
};

const addTreeLegend = (map: L.Map): void => {
  if (treeLegend) return;
  treeLegend = new L.Control({ position: 'topright' });
  treeLegend.onAdd = () => {
    const element = L.DomUtil.create('div', 'forest-map-legend');
    element.setAttribute('aria-label', 'Chú giải các loại mầm cây');
    element.innerHTML = `<strong>Các mầm xanh</strong>${Object.values(TREE_TYPES)
      .map(({ icon, label }) => `<span><i aria-hidden="true">${icon}</i>${label}</span>`)
      .join('')}`;
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
    return element;
  };
  treeLegend.addTo(map);
};

export const initForestMap = (): L.Map | null => {
  const element = document.querySelector<HTMLElement>('#forest-map');
  if (!element) return null;
  if (forestMap) {
    forestMap.invalidateSize();
    return forestMap;
  }

  forestMap = L.map(element, {
    center: BÙ_GIA_MẬP_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 13,
    maxZoom: 17,
    maxBounds: FOREST_BOUNDS,
    maxBoundsViscosity: 1.0,
    zoomControl: true,
    attributionControl: true,
  });
  addTreeLegend(forestMap);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(forestMap);
  forestMap.fitBounds(FOREST_BOUNDS, { maxZoom: DEFAULT_ZOOM });
  window.setTimeout(() => forestMap?.invalidateSize(), 0);
  return forestMap;
};

export const clearTreeMarkers = (): void => {
  markers.forEach((marker) => marker.remove());
  markers.clear();
};

export const renderTreeMarkers = (trees: ForestMapTree[], currentTreeId?: string | null): void => {
  const map = initForestMap();
  if (!map) return;
  clearTreeMarkers();
  trees.filter(isValidCoordinate).forEach((tree) => {
    const marker = L.marker([tree.latitude, tree.longitude], {
      icon: treeIcon(tree.treeType, tree.id === currentTreeId),
      title: tree.name,
      alt: `${treeTypeDetails(tree.treeType).label} của ${tree.name}`,
    }).bindPopup(popupContent(tree));
    marker.addTo(map);
    markers.set(tree.id, marker);
  });
};

export const focusTree = (treeId: string): void => {
  const marker = markers.get(treeId);
  if (!marker || !forestMap) return;
  forestMap.setView(marker.getLatLng(), Math.max(forestMap.getZoom(), 14));
  marker.openPopup();
};
