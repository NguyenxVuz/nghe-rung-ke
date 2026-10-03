import type { TreeParticipant } from '../types/tree';

export type PlantingDraftStep = 'PLANT' | 'SHARE' | 'VERIFY' | 'COMPLETE';

export type PlantingDraftTree = Pick<
  TreeParticipant,
  'id' | 'name' | 'tree_type' | 'latitude' | 'longitude' | 'status' | 'post_url' | 'created_at' | 'confirmed_at'
>;

export interface PlantingDraft {
  currentStep: PlantingDraftStep;
  name: string;
  seedType: string;
  consent: boolean;
  latitude: number | null;
  longitude: number | null;
  caption: string;
  plantedTree: PlantingDraftTree | null;
  proofUrl: string;
  proofConsent: boolean;
  certificateDownloaded: boolean;
  captionCopied: boolean;
  certificatePhotoPosition: { x: number; y: number };
  certificatePhotoZoom: number;
  certificatePhotoDataUrl: string | null;
  updatedAt: number;
}

const DRAFT_KEY = 'ngheRungKe_plantingDraft';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStep = (value: unknown): value is PlantingDraftStep =>
  value === 'PLANT' || value === 'SHARE' || value === 'VERIFY' || value === 'COMPLETE';

const isCoordinate = (value: unknown, min: number, max: number): value is number | null =>
  value === null
  || (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max);

const isDraftTree = (value: unknown): value is PlantingDraftTree => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.tree_type === 'string'
    && isCoordinate(value.latitude, -90, 90)
    && isCoordinate(value.longitude, -180, 180)
    && (value.status === 'PENDING' || value.status === 'CONFIRMED')
    && (typeof value.post_url === 'string' || value.post_url === null)
    && typeof value.created_at === 'string'
    && (typeof value.confirmed_at === 'string' || value.confirmed_at === null);
};

const isPlantingDraft = (value: unknown): value is PlantingDraft => {
  if (!isRecord(value) || !isRecord(value.certificatePhotoPosition)) return false;
  const photoDataUrl = value.certificatePhotoDataUrl;
  return isStep(value.currentStep)
    && typeof value.name === 'string'
    && ['oak', 'fruit', 'canopy'].includes(String(value.seedType))
    && typeof value.consent === 'boolean'
    && isCoordinate(value.latitude, -90, 90)
    && isCoordinate(value.longitude, -180, 180)
    && typeof value.caption === 'string'
    && (value.plantedTree === null || isDraftTree(value.plantedTree))
    && typeof value.proofUrl === 'string'
    && typeof value.proofConsent === 'boolean'
    && typeof value.certificateDownloaded === 'boolean'
    && typeof value.captionCopied === 'boolean'
    && typeof value.certificatePhotoPosition.x === 'number'
    && Number.isFinite(value.certificatePhotoPosition.x)
    && value.certificatePhotoPosition.x >= 0
    && value.certificatePhotoPosition.x <= 1
    && typeof value.certificatePhotoPosition.y === 'number'
    && Number.isFinite(value.certificatePhotoPosition.y)
    && value.certificatePhotoPosition.y >= 0
    && value.certificatePhotoPosition.y <= 1
    && typeof value.certificatePhotoZoom === 'number'
    && Number.isFinite(value.certificatePhotoZoom)
    && value.certificatePhotoZoom >= 1
    && value.certificatePhotoZoom <= 3
    && (photoDataUrl === null
      || (typeof photoDataUrl === 'string'
        && photoDataUrl.startsWith('data:image/jpeg;base64,')
        && photoDataUrl.length <= 4_000_000))
    && typeof value.updatedAt === 'number'
    && Number.isFinite(value.updatedAt);
};

export const isDraftExpired = (draft: Pick<PlantingDraft, 'updatedAt'>, now = Date.now()): boolean =>
  now - draft.updatedAt > DRAFT_MAX_AGE_MS || draft.updatedAt > now;

export const savePlantingDraft = (
  draft: Omit<PlantingDraft, 'updatedAt'>,
): boolean => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: Date.now() }));
    return true;
  } catch (error) {
    console.error('Could not save planting draft to localStorage:', error);
    return false;
  }
};

export const getPlantingDraft = (): PlantingDraft | null => {
  let serialized: string | null;
  try {
    serialized = localStorage.getItem(DRAFT_KEY);
  } catch (error) {
    console.error('Could not read planting draft from localStorage:', error);
    return null;
  }
  if (!serialized) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    console.error('Could not parse planting draft from localStorage:', error);
    clearPlantingDraft();
    return null;
  }
  if (!isPlantingDraft(parsed)) {
    console.error('Planting draft in localStorage has an invalid shape.');
    clearPlantingDraft();
    return null;
  }
  if (isDraftExpired(parsed)) {
    clearPlantingDraft();
    return null;
  }
  return parsed;
};

export const updatePlantingDraft = (
  updates: Partial<Omit<PlantingDraft, 'updatedAt'>>,
): boolean => {
  const current = getPlantingDraft();
  if (!current) return false;
  const { updatedAt: _updatedAt, ...draft } = current;
  return savePlantingDraft({ ...draft, ...updates });
};

export const clearPlantingDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Could not clear planting draft from localStorage:', error);
  }
};
