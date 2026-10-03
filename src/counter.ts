import { createTree, confirmTree, getConfirmedTrees } from './services/treeService';
import {
  clearPlantingDraft,
  getPlantingDraft,
  savePlantingDraft,
  type PlantingDraft,
  type PlantingDraftTree,
} from './services/plantingDraft';
import type { TreeParticipant } from './types/tree';
import certificateBackgroundUrl from './assets/thank-you-template.png';
import certificateTemplateUrl from './assets/plant-certificate-template.png';
import { initForestMap, renderTreeMarkers } from './map/forestMap';
import {
  clearPlantingPreview,
  initPlantingMap,
  renderPlantingTrees,
  renderPlantingResultMap,
  setPlantingPreview,
  type PlantLocation,
} from './map/plantingMap';

export interface TreeRecord {
  id: string;
  supporter: string;
  proofUrl?: string;
  plantedAt: string;
  confirmedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  species: TreeSpecies;
  status: 'PENDING' | 'CONFIRMED';
}

type TreeSpecies = 'oak' | 'fruit' | 'canopy';
type PlantStep = 'PLANT' | 'SHARE' | 'VERIFY' | 'COMPLETE';

interface ForestState {
  trees: TreeRecord[];
  target: number;
}

const CURRENT_TREE_KEY = 'ngheRungKe_currentTreeId';
const TARGET_TREES = 200;

const createShareCaption = (): string => `🌳 CÙNG THẮP XANH BẢN ĐỒ BÙ GIA MẬP

Mời bạn cùng tham gia bằng 3 bước đơn giản:
1️⃣ Truy cập website: ${location.origin}
2️⃣ Trồng một cây ảo và ghi dấu mầm xanh trên bản đồ số Bù Gia Mập.
3️⃣ Chia sẻ dự án “Nghe Rừng Kể” lên Facebook hoặc TikTok cá nhân ở chế độ công khai.

🌱 Mỗi lượt chia sẻ là một lần câu chuyện về rừng được đi xa hơn.

📬 Kết nối:
Email: Ngherungke2026@gmail.com
TikTok: https://www.tiktok.com/@nghe.rng.k

#Ngherungke #laphoixanh #Vuonquocgia #BuGiaMap #chamsocrung`;

const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Continue to the browser-compatible fallback below.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Trình duyệt không cho phép sao chép tự động.');
};

const loadCertificateTemplate = (): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Không tải được mẫu chứng nhận.'));
  image.src = certificateTemplateUrl;
});

const loadCertificateBackground = (): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Không tải được ảnh nền chứng nhận mặc định.'));
  image.src = certificateBackgroundUrl;
});

interface CertificatePhotoPosition {
  x: number;
  y: number;
}

const CERTIFICATE_PHOTO_BOUNDS = { x: 30, y: 120, width: 708, height: 480 };

interface CertificatePhotoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

let certificateAssetsPromise: Promise<{ template: HTMLImageElement; background: HTMLImageElement }> | null = null;
let certificateTemplateImage: HTMLImageElement | null = null;

const loadCertificateAssets = (): Promise<{ template: HTMLImageElement; background: HTMLImageElement }> => {
  certificateAssetsPromise ??= Promise.all([
    loadCertificateTemplate(),
    loadCertificateBackground(),
  ]).then(([template, background]) => {
    certificateTemplateImage = template;
    return { template, background };
  });
  return certificateAssetsPromise;
};

const getCertificatePhotoBounds = (template: HTMLImageElement): CertificatePhotoBounds => {
  const scale = Math.min(1080 / template.naturalWidth, 1350 / template.naturalHeight);
  const templateWidth = template.naturalWidth * scale;
  const templateHeight = template.naturalHeight * scale;
  const scaleX = templateWidth / template.naturalWidth;
  const scaleY = templateHeight / template.naturalHeight;
  return {
    x: (1080 - templateWidth) / 2 + CERTIFICATE_PHOTO_BOUNDS.x * scaleX,
    y: (1350 - templateHeight) / 2 + CERTIFICATE_PHOTO_BOUNDS.y * scaleY,
    width: CERTIFICATE_PHOTO_BOUNDS.width * scaleX,
    height: CERTIFICATE_PHOTO_BOUNDS.height * scaleY,
  };
};

const loadCertificatePhoto = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Không thể đọc ảnh đã chọn.'));
  };
  image.src = objectUrl;
});

const createCertificateCanvas = async (
  tree: Pick<TreeParticipant, 'name'>,
  photo: HTMLImageElement | null,
  photoPosition: CertificatePhotoPosition,
  photoZoom: number,
): Promise<HTMLCanvasElement> => {
  const [{ template, background }] = await Promise.all([loadCertificateAssets(), document.fonts.ready]);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

  context.fillStyle = '#f8f2d9';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / template.naturalWidth, canvas.height / template.naturalHeight);
  const templateWidth = template.naturalWidth * scale;
  const templateHeight = template.naturalHeight * scale;
  const offsetX = (canvas.width - templateWidth) / 2;
  const offsetY = (canvas.height - templateHeight) / 2;

  const scaleX = templateWidth / template.naturalWidth;
  const scaleY = templateHeight / template.naturalHeight;
  context.drawImage(background, offsetX, offsetY, templateWidth, templateHeight);
  if (photo) {
    const photoBounds = getCertificatePhotoBounds(template);
    const { x: photoX, y: photoY, width: photoWidth, height: photoHeight } = photoBounds;
    const photoScale = Math.max(photoWidth / photo.naturalWidth, photoHeight / photo.naturalHeight) * photoZoom;
    const sourceWidth = photoWidth / photoScale;
    const sourceHeight = photoHeight / photoScale;
    const sourceX = (photo.naturalWidth - sourceWidth) * photoPosition.x;
    const sourceY = (photo.naturalHeight - sourceHeight) * photoPosition.y;
    context.drawImage(
      photo,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
    );
  }
  context.drawImage(template, offsetX, offsetY, templateWidth, templateHeight);

  context.fillStyle = '#f8f2d9';
  context.fillRect(
    offsetX + 25 * scaleX,
    offsetY + 624 * scaleY,
    718 * scaleX,
    76 * scaleY,
  );
  context.textAlign = 'center';
  let nameFontSize = 43;
  context.font = `800 ${nameFontSize}px "Be Vietnam Pro", sans-serif`;
  while (context.measureText(tree.name).width > 680 && nameFontSize > 24) {
    nameFontSize -= 2;
    context.font = `800 ${nameFontSize}px "Be Vietnam Pro", sans-serif`;
  }
  context.fillStyle = '#111';
  context.font = `800 ${nameFontSize * scaleX}px "Be Vietnam Pro", sans-serif`;
  context.fillText(tree.name.trim() || 'Người bạn của rừng', offsetX + 384 * scaleX, offsetY + 678 * scaleY);

  return canvas;
};

const toTreeRecord = (tree: PlantingDraftTree): TreeRecord => ({
    id: tree.id,
    supporter: tree.name,
    proofUrl: tree.post_url ?? undefined,
    plantedAt: tree.created_at,
    confirmedAt: tree.confirmed_at,
    latitude: tree.latitude,
    longitude: tree.longitude,
    species: tree.tree_type as TreeSpecies,
    status: tree.status,
});

const showToast = (message: string): void => {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3600);
};

const loadCertificatePhotoFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Không thể khôi phục ảnh chứng nhận đã lưu.'));
  image.src = dataUrl;
});

const persistableCertificatePhoto = (photo: HTMLImageElement): string => {
  const maxDimension = 900;
  const scale = Math.min(1, maxDimension / Math.max(photo.naturalWidth, photo.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Không thể lưu ảnh chứng nhận trên trình duyệt này.');
  context.drawImage(photo, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
};

const renderForest = (state: ForestState): void => {
  const totalElement = document.querySelector<HTMLElement>('#tree-count');
  const remainingElement = document.querySelector<HTMLElement>('#remaining-count');
  const progressElement = document.querySelector<HTMLElement>('#forest-progress');
  const progressLabel = document.querySelector<HTMLElement>('#progress-label');
  const progressPercent = document.querySelector<HTMLElement>('[data-progress-percent]');
  const progressCopy = document.querySelector<HTMLElement>('#progress-copy');
  const emptyMap = document.querySelector<HTMLElement>('#empty-map');
  if (!totalElement || !remainingElement || !progressElement || !progressLabel || !progressPercent || !progressCopy || !emptyMap) return;

  const total = state.trees.filter((tree) => tree.status === 'CONFIRMED').length;
  const progress = Math.min(100, Math.round((total / state.target) * 100));
  const currentTreeId = sessionStorage.getItem(CURRENT_TREE_KEY) ?? sessionStorage.getItem('nghe-rung-ke:last-confirmed-tree-id');
  initForestMap();
  renderTreeMarkers(state.trees.map((tree) => ({
    id: tree.id,
    name: tree.supporter,
    treeType: tree.species,
    latitude: tree.latitude,
    longitude: tree.longitude,
    status: tree.status,
    createdAt: tree.plantedAt,
    confirmedAt: tree.confirmedAt,
  })), currentTreeId);

  totalElement.textContent = String(total);
  remainingElement.textContent = String(Math.max(0, state.target - total));
  progressElement.style.width = `${progress}%`;
  progressElement.setAttribute('aria-valuenow', String(total));
  progressLabel.innerHTML = `<span class="toolbar-leaf" aria-hidden="true"></span> ${progress}% MỤC TIÊU`;
  progressPercent.textContent = `${progress}% mục tiêu`;
  progressCopy.textContent = `Còn ${Math.max(0, state.target - total)} mầm nữa để cùng phủ xanh Bù Gia Mập`;
  emptyMap.hidden = total > 0;
};

export const setupForestPlanting = (): void => {
  const dialog = document.querySelector<HTMLDialogElement>('#plant-dialog');
  const form = document.querySelector<HTMLFormElement>('#plant-form');
  if (!dialog || !form) return;

  const formStep = document.querySelector<HTMLElement>('#plant-step-form');
  const resultStep = document.querySelector<HTMLElement>('#plant-result-step');
  const verifyStep = document.querySelector<HTMLElement>('#plant-verify-step');
  const completeStep = document.querySelector<HTMLElement>('#plant-complete-step');
  const proofUrlInput = document.querySelector<HTMLInputElement>('#plant-proof-url');
  const proofConsent = document.querySelector<HTMLInputElement>('#plant-proof-consent');
  const confirmPlant = document.querySelector<HTMLButtonElement>('#confirm-plant');
  const verifyError = document.querySelector<HTMLElement>('#plant-verify-error');
  const shareStep = document.querySelector<HTMLElement>('#plant-share-step');
  const copyCaption = document.querySelector<HTMLButtonElement>('#copy-caption');
  const sendShare = document.querySelector<HTMLButtonElement>('#send-share');
  const downloadCertificate = document.querySelector<HTMLButtonElement>('#download-certificate');
  const certificatePreview = document.querySelector<HTMLCanvasElement>('#certificate-preview');
  const certificatePositionHint = document.querySelector<HTMLElement>('#certificate-position-hint');
  const certificateZoomControl = document.querySelector<HTMLElement>('#certificate-zoom-control');
  const certificatePhotoZoomInput = document.querySelector<HTMLInputElement>('#certificate-photo-zoom');
  const certificatePhotoZoomValue = document.querySelector<HTMLOutputElement>('#certificate-photo-zoom-value');
  const certificatePhotoInput = document.querySelector<HTMLInputElement>('#certificate-photo-input');
  const changeCertificatePhoto = document.querySelector<HTMLButtonElement>('#change-certificate-photo');
  const resetCertificatePhoto = document.querySelector<HTMLButtonElement>('#reset-certificate-photo');
  const certificatePhotoStatus = document.querySelector<HTMLElement>('#certificate-photo-status');
  const certificateStatus = document.querySelector<HTMLElement>('#certificate-status');
  const captionStatus = document.querySelector<HTMLElement>('#caption-status');
  const shareCaptionPreview = document.querySelector<HTMLElement>('#share-caption-preview');
  const shareReadiness = document.querySelector<HTMLElement>('#share-readiness');
  const facebookSharingCard = document.querySelector<HTMLElement>('#facebook-sharing-card');
  const certificateCheck = document.querySelector<HTMLElement>('#certificate-check');
  const captionCheck = document.querySelector<HTMLElement>('#caption-check');
  const facebookCheck = document.querySelector<HTMLElement>('#facebook-check');
  const readyPost = document.querySelector<HTMLButtonElement>('#ready-post');
  const viewForestMap = document.querySelector<HTMLButtonElement>('#view-forest-map');
  const completeSupporter = document.querySelector<HTMLElement>('#complete-supporter');
  const backToPlant = document.querySelector<HTMLButtonElement>('#back-to-plant');
  const backToShare = document.querySelector<HTMLButtonElement>('#back-to-share');
  const backToVerify = document.querySelector<HTMLButtonElement>('#back-to-verify');
  const plantSubmit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const locationHelp = document.querySelector<HTMLElement>('#plant-location-help');
  let selectedPlantLocation: PlantLocation | null = null;
  let participantName = '';
  if (!formStep || !resultStep || !verifyStep || !completeStep || !shareStep || !proofUrlInput || !proofConsent || !confirmPlant || !verifyError || !copyCaption || !sendShare || !downloadCertificate || !certificatePreview || !certificatePositionHint || !certificateZoomControl || !certificatePhotoZoomInput || !certificatePhotoZoomValue || !certificatePhotoInput || !changeCertificatePhoto || !resetCertificatePhoto || !certificatePhotoStatus || !certificateStatus || !captionStatus || !shareCaptionPreview || !shareReadiness || !facebookSharingCard || !certificateCheck || !captionCheck || !facebookCheck || !readyPost || !viewForestMap || !completeSupporter || !backToPlant || !backToShare || !backToVerify || !plantSubmit || !locationHelp) return;
  let certificateCanvas: HTMLCanvasElement | null = null;
  let certificateTree: Pick<TreeParticipant, 'name'> | null = null;
  let certificatePhoto: HTMLImageElement | null = null;
  let certificatePhotoPosition: CertificatePhotoPosition = { x: 0.5, y: 0.5 };
  let certificatePhotoZoom = 1;
  let certificateDownloaded = false;
  let captionCopied = false;
  let certificateGeneration = 0;
  let currentStep: PlantStep = 'PLANT';
  let plantedTree: PlantingDraftTree | null = null;
  let certificatePhotoDataUrl: string | null = null;
  let draftActive = false;
  let storageFailureNotified = false;

  shareCaptionPreview.textContent = createShareCaption();

  const persistDraft = (step: PlantStep = currentStep): void => {
    if (!draftActive) return;
    const supporter = form.elements.namedItem('supporter');
    const species = form.elements.namedItem('species');
    const consent = form.elements.namedItem('consent');
    const draft: Omit<PlantingDraft, 'updatedAt'> = {
      currentStep: step,
      name: supporter instanceof HTMLInputElement ? supporter.value : '',
      seedType: species instanceof RadioNodeList ? species.value : '',
      consent: consent instanceof HTMLInputElement && consent.checked,
      latitude: selectedPlantLocation?.latitude ?? null,
      longitude: selectedPlantLocation?.longitude ?? null,
      caption: shareCaptionPreview.textContent ?? createShareCaption(),
      plantedTree,
      proofUrl: proofUrlInput.value,
      proofConsent: proofConsent.checked,
      certificateDownloaded,
      captionCopied,
      certificatePhotoPosition,
      certificatePhotoZoom,
      certificatePhotoDataUrl,
    };
    if (savePlantingDraft(draft)) {
      storageFailureNotified = false;
    } else if (!storageFailureNotified) {
      storageFailureNotified = true;
      showToast('Không thể lưu tiến trình trồng cây trên thiết bị này.');
    }
  };

  const updateSharingProgress = (): void => {
    const steps = [
      { id: 'certificate', complete: certificateDownloaded },
      { id: 'caption', complete: captionCopied },
      { id: 'facebook', complete: certificateDownloaded && captionCopied },
    ];
    let currentStepFound = false;
    steps.forEach(({ id, complete }, index) => {
      const item = document.querySelector<HTMLElement>(`[data-share-step="${id}"]`);
      if (!item) return;
      const isCurrent = !complete && !currentStepFound;
      if (isCurrent) currentStepFound = true;
      item.classList.toggle('is-complete', complete);
      item.classList.toggle('is-current', isCurrent);
      const number = item.querySelector<HTMLElement>('span');
      if (number) number.textContent = complete ? '✓' : String(index + 1);
    });
    certificateCheck.textContent = certificateDownloaded ? '✓' : '';
    captionCheck.textContent = captionCopied ? '✓' : '';
    facebookCheck.textContent = certificateDownloaded && captionCopied ? '✓' : '';
    downloadCertificate.textContent = certificateDownloaded ? '✓ Đã nhận chứng nhận' : '↓ Tải chứng nhận';
    copyCaption.textContent = captionCopied ? '✓ Đã sao chép caption' : '⧉ Sao chép caption';
    facebookSharingCard.classList.toggle('is-ready', certificateDownloaded && captionCopied);
    shareReadiness.textContent = certificateDownloaded && captionCopied
      ? '🎉 Bạn đã chuẩn bị xong để chia sẻ!'
      : 'Bạn đã chuẩn bị xong! Hãy nhận chứng nhận và sao chép caption để sẵn sàng chia sẻ.';
    persistDraft();
  };

  const resetSharingProgress = (): void => {
    certificateGeneration += 1;
    certificateCanvas = null;
    certificateTree = null;
    certificatePhoto = null;
    certificatePhotoPosition = { x: 0.5, y: 0.5 };
    certificatePhotoZoom = 1;
    certificatePhotoDataUrl = null;
    certificateDownloaded = false;
    captionCopied = false;
    downloadCertificate.disabled = false;
    readyPost.disabled = false;
    readyPost.textContent = 'Xác nhận đồng hành →';
    certificatePreview.getContext('2d')?.clearRect(0, 0, certificatePreview.width, certificatePreview.height);
    certificatePreview.classList.remove('is-animating', 'is-positioning');
    certificatePositionHint.hidden = true;
    certificateZoomControl.hidden = true;
    certificatePhotoZoomInput.value = '100';
    certificatePhotoZoomValue.value = '100%';
    certificatePhotoInput.value = '';
    resetCertificatePhoto.hidden = true;
    certificatePhotoStatus.textContent = 'Chọn ảnh từ thiết bị để thay ảnh phong cảnh trên chứng nhận.';
    certificateStatus.textContent = 'Ảnh PNG tỷ lệ 4:5, phù hợp để đăng bài.';
    captionStatus.textContent = 'Bạn có thể dán caption này cùng với chứng nhận.';
    updateSharingProgress();
  };

  const prepareCertificate = async (
    tree: Pick<TreeParticipant, 'name'>,
    photo: HTMLImageElement | null = certificatePhoto,
    photoPosition: CertificatePhotoPosition = certificatePhotoPosition,
    photoZoom: number = certificatePhotoZoom,
    preserveDownloadStatus = false,
  ): Promise<void> => {
    const generation = ++certificateGeneration;
    certificateTree = tree;
    if (!preserveDownloadStatus) certificateDownloaded = false;
    downloadCertificate.disabled = true;
    certificateStatus.textContent = 'Đang chuẩn bị chứng nhận của bạn…';
    updateSharingProgress();
    const canvas = await createCertificateCanvas(tree, photo, photoPosition, photoZoom);
    if (generation !== certificateGeneration) return;
    certificateCanvas = canvas;
    certificatePhoto = photo;
    certificatePhotoPosition = photoPosition;
    certificatePhotoZoom = photoZoom;
    const previewContext = certificatePreview.getContext('2d');
    if (!previewContext) throw new Error('Không thể hiển thị chứng nhận xem trước.');
    previewContext.clearRect(0, 0, certificatePreview.width, certificatePreview.height);
    previewContext.drawImage(canvas, 0, 0, certificatePreview.width, certificatePreview.height);
    certificatePreview.classList.remove('is-animating');
    void certificatePreview.offsetWidth;
    certificatePreview.classList.add('is-animating');
    certificatePreview.classList.toggle('is-positioning', Boolean(photo));
    certificatePositionHint.hidden = !photo;
    certificateZoomControl.hidden = !photo;
    certificatePhotoZoomInput.value = String(Math.round(photoZoom * 100));
    certificatePhotoZoomValue.value = `${Math.round(photoZoom * 100)}%`;
    downloadCertificate.disabled = false;
    resetCertificatePhoto.hidden = !photo;
    certificateStatus.textContent = 'Ảnh PNG tỷ lệ 4:5, phù hợp để đăng bài.';
    updateSharingProgress();
  };
  let photoDragStart: {
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null = null;
  let photoRenderFrame = 0;
  certificatePreview.addEventListener('pointerdown', (event) => {
    if (!certificatePhoto || !certificateTree || !certificateTemplateImage) return;
    const bounds = certificatePreview.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) * certificatePreview.width / bounds.width;
    const pointerY = (event.clientY - bounds.top) * certificatePreview.height / bounds.height;
    const photoBounds = getCertificatePhotoBounds(certificateTemplateImage);
    if (pointerX < photoBounds.x || pointerX > photoBounds.x + photoBounds.width
      || pointerY < photoBounds.y || pointerY > photoBounds.y + photoBounds.height) return;
    event.preventDefault();
    certificatePreview.setPointerCapture(event.pointerId);
    photoDragStart = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      ...certificatePhotoPosition,
    };
  });
  certificatePreview.addEventListener('pointermove', (event) => {
    if (!photoDragStart || photoDragStart.pointerId !== event.pointerId || !certificatePhoto || !certificateTree) return;

    if (!certificateTemplateImage) return;
    const photoBounds = getCertificatePhotoBounds(certificateTemplateImage);
    const scale = Math.max(
      photoBounds.width / certificatePhoto.naturalWidth,
      photoBounds.height / certificatePhoto.naturalHeight,
    ) * certificatePhotoZoom;
    const movableWidth = certificatePhoto.naturalWidth * scale - photoBounds.width;
    const movableHeight = certificatePhoto.naturalHeight * scale - photoBounds.height;
    const bounds = certificatePreview.getBoundingClientRect();
    const deltaX = (event.clientX - photoDragStart.clientX) * certificatePreview.width / bounds.width;
    const deltaY = (event.clientY - photoDragStart.clientY) * certificatePreview.height / bounds.height;
    const position = {
      x: movableWidth > 0 ? Math.max(0, Math.min(1, photoDragStart.x - deltaX / movableWidth)) : 0.5,
      y: movableHeight > 0 ? Math.max(0, Math.min(1, photoDragStart.y - deltaY / movableHeight)) : 0.5,
    };
    certificatePhotoPosition = position;
    const tree = certificateTree;
    const zoom = certificatePhotoZoom;
    if (photoRenderFrame) cancelAnimationFrame(photoRenderFrame);
    photoRenderFrame = requestAnimationFrame(() => {
      photoRenderFrame = 0;
      void prepareCertificate(tree, certificatePhoto, position, zoom).catch((error: unknown) => {
        console.error('Could not reposition planting certificate photo:', error);
        certificatePhotoStatus.textContent = 'Không thể căn chỉnh ảnh. Vui lòng thử lại.';
      });
    });
  });
  certificatePhotoZoomInput.addEventListener('input', () => {
    if (!certificatePhoto || !certificateTree) return;
    const zoom = Number(certificatePhotoZoomInput.value) / 100;
    certificatePhotoZoomValue.value = `${Math.round(zoom * 100)}%`;
    const tree = certificateTree;
    void prepareCertificate(tree, certificatePhoto, certificatePhotoPosition, zoom).catch((error: unknown) => {
      console.error('Could not zoom planting certificate photo:', error);
      certificatePhotoStatus.textContent = 'Không thể thu phóng ảnh. Vui lòng thử lại.';
    });
  });
  const finishCertificatePhotoDrag = (event: PointerEvent): void => {
    if (photoDragStart?.pointerId === event.pointerId) photoDragStart = null;
  };
  certificatePreview.addEventListener('pointerup', finishCertificatePhotoDrag);
  certificatePreview.addEventListener('pointercancel', finishCertificatePhotoDrag);
  certificatePreview.addEventListener('lostpointercapture', finishCertificatePhotoDrag);
  certificatePreview.addEventListener('pointerup', () => persistDraft());
  downloadCertificate.disabled = false;
  updateSharingProgress();

  const openFacebookShare = (): void => {
    persistDraft();
    window.open('https://www.facebook.com/', '_blank', 'noopener,noreferrer');
  };

  const updatePlantSubmitState = (): void => {
    const supporter = form.elements.namedItem('supporter');
    const species = form.elements.namedItem('species');
    const consent = form.elements.namedItem('consent');
    plantSubmit.disabled = !(supporter instanceof HTMLInputElement
      && supporter.value.trim()
      && species instanceof RadioNodeList
      && species.value
      && consent instanceof HTMLInputElement
      && consent.checked
      && selectedPlantLocation);
  };
  form.addEventListener('input', () => {
    updatePlantSubmitState();
    persistDraft();
  });
  form.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'species' && selectedPlantLocation) {
      setPlantingPreview(selectedPlantLocation, event.target.value);
    }
    updatePlantSubmitState();
    persistDraft();
  });

  const refreshPlantingMap = async (): Promise<void> => {
    const map = initPlantingMap((location, message) => {
      if (!location) {
        locationHelp.textContent = message ?? 'Vị trí này không thể chọn.';
        locationHelp.classList.add('is-error');
        return;
      }
      selectedPlantLocation = location;
      locationHelp.textContent = '✓ Đã chọn vị trí';
      locationHelp.classList.remove('is-error');
      const species = String(new FormData(form).get('species') ?? 'oak');
      setPlantingPreview(location, species);
      updatePlantSubmitState();
      persistDraft();
    });
    if (!map) return;
    try {
      const trees = await getConfirmedTrees();
      state.trees = trees.map(toTreeRecord);
      renderForest(state);
      renderPlantingTrees(trees.map((tree) => ({
        id: tree.id,
        treeType: tree.tree_type,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: tree.status,
      })));
    } catch (error) {
      console.error('Supabase planting map load failed:', error);
      locationHelp.textContent = 'Không thể tải các vị trí đã gieo. Vui lòng thử lại.';
    }
  };

  const setPlantStep = (step: PlantStep): void => {
    currentStep = step;
    const order: PlantStep[] = ['PLANT', 'SHARE', 'VERIFY', 'COMPLETE'];
    document.querySelectorAll<HTMLElement>('[data-step-indicator]').forEach((indicator) => {
      const indicatorStep = indicator.dataset.stepIndicator as PlantStep;
      const index = order.indexOf(indicatorStep);
      const currentIndex = order.indexOf(step);
      indicator.classList.toggle('is-current', indicatorStep === step);
      indicator.classList.toggle('is-complete', index < currentIndex);
      const number = indicator.querySelector('span');
      if (number) number.textContent = index < currentIndex ? '✓' : String(index + 1);
    });
    persistDraft(step);
  };

  const showCompleteStep = (): void => {
    formStep.hidden = true;
    resultStep.hidden = true;
    shareStep.hidden = true;
    verifyStep.hidden = true;
    completeStep.hidden = false;
    setPlantStep('COMPLETE');
  };

  const state: ForestState = { trees: [], target: TARGET_TREES };
  const initialDraft = getPlantingDraft();
  const loadForest = async (): Promise<void> => {
    const progressLabel = document.querySelector<HTMLElement>('#progress-label');
    if (progressLabel) progressLabel.textContent = 'Đang tải bản đồ...';
    try {
      const trees = await getConfirmedTrees();
      state.trees = trees.map(toTreeRecord);
      renderForest(state);
    } catch (error) {
      console.error('Supabase map load failed:', error);
      showToast(error instanceof Error ? error.message : 'Không thể tải bản đồ mầm xanh.');
    }
  };
  void loadForest();

  const restoreDraft = async (draft: PlantingDraft): Promise<void> => {
    draftActive = false;
    resetSharingProgress();

    const supporter = form.elements.namedItem('supporter');
    const species = form.elements.namedItem('species');
    const consent = form.elements.namedItem('consent');
    if (supporter instanceof HTMLInputElement) supporter.value = draft.name;
    if (species instanceof RadioNodeList) {
      const savedSpecies = Array.from(species).find(
        (input): input is HTMLInputElement =>
          input instanceof HTMLInputElement && input.value === draft.seedType,
      );
      if (savedSpecies) savedSpecies.checked = true;
    }
    if (consent instanceof HTMLInputElement) consent.checked = draft.consent;

    selectedPlantLocation = typeof draft.latitude === 'number' && typeof draft.longitude === 'number'
      ? { latitude: draft.latitude, longitude: draft.longitude }
      : null;
    plantedTree = draft.plantedTree;
    participantName = plantedTree?.name ?? draft.name;
    certificatePhotoPosition = draft.certificatePhotoPosition;
    certificatePhotoZoom = draft.certificatePhotoZoom;
    certificatePhotoDataUrl = draft.certificatePhotoDataUrl;
    certificateDownloaded = draft.certificateDownloaded;
    captionCopied = draft.captionCopied;
    proofUrlInput.value = draft.proofUrl;
    proofConsent.checked = draft.proofConsent;
    shareCaptionPreview.textContent = draft.caption || createShareCaption();
    completeSupporter.textContent = participantName || 'bạn';
    certificateStatus.textContent = certificateDownloaded
      ? 'Chứng nhận đã sẵn sàng 💚 Hãy lưu ảnh để sử dụng khi chia sẻ lên Facebook.'
      : 'Ảnh PNG tỷ lệ 4:5, phù hợp để đăng bài.';
    captionStatus.textContent = captionCopied
      ? 'Đã sao chép caption 💚 Bạn có thể dán vào bài viết Facebook.'
      : 'Bạn có thể dán caption này cùng với chứng nhận.';
    certificatePhotoStatus.textContent = certificatePhotoDataUrl
      ? 'Ảnh chứng nhận đã được lưu và sẽ được khôi phục.'
      : 'Chọn ảnh từ thiết bị để thay ảnh phong cảnh trên chứng nhận.';
    if (plantedTree) {
      if (plantedTree.status === 'PENDING') {
        sessionStorage.setItem(CURRENT_TREE_KEY, plantedTree.id);
        sessionStorage.setItem('nghe-rung-ke:last-tree-id', plantedTree.id);
      } else {
        sessionStorage.setItem('nghe-rung-ke:last-confirmed-tree-id', plantedTree.id);
      }
    }

    currentStep = draft.currentStep;
    draftActive = true;
    formStep.hidden = draft.currentStep !== 'PLANT';
    resultStep.hidden = draft.currentStep !== 'SHARE';
    shareStep.hidden = draft.currentStep !== 'SHARE';
    verifyStep.hidden = draft.currentStep !== 'VERIFY';
    completeStep.hidden = draft.currentStep !== 'COMPLETE';
    dialog.classList.toggle('plant-result-mode', draft.currentStep !== 'PLANT');
    setPlantStep(draft.currentStep);
    updatePlantSubmitState();
    updateSharingProgress();
    verifyError.textContent = '';
    const formError = document.querySelector<HTMLElement>('#form-error');
    if (formError) formError.textContent = '';
    if (!dialog.open) dialog.showModal();

    await refreshPlantingMap();
    if (selectedPlantLocation) {
      const selectedSpecies = species instanceof RadioNodeList ? species.value : 'oak';
      setPlantingPreview(selectedPlantLocation, selectedSpecies);
      locationHelp.textContent = '✓ Đã chọn vị trí';
      locationHelp.classList.remove('is-error');
    }
    if (plantedTree && draft.currentStep !== 'PLANT') {
      const resultTrees = new Map(state.trees.map((tree) => [tree.id, tree]));
      resultTrees.set(plantedTree.id, toTreeRecord(plantedTree));
      renderPlantingResultMap(Array.from(resultTrees.values()).map((tree) => ({
        id: tree.id,
        treeType: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: tree.status,
      })), plantedTree.id);

      try {
        certificatePhoto = certificatePhotoDataUrl
          ? await loadCertificatePhotoFromDataUrl(certificatePhotoDataUrl)
          : null;
        await prepareCertificate(
          plantedTree,
          certificatePhoto,
          certificatePhotoPosition,
          certificatePhotoZoom,
          true,
        );
      } catch (error) {
        console.error('Could not restore planting certificate:', error);
        certificatePhoto = null;
        certificatePhotoDataUrl = null;
        certificateStatus.textContent = 'Không thể khôi phục chứng nhận. Vui lòng thử tải lại chứng nhận.';
        updateSharingProgress();
      }
    }
  };

  document.querySelectorAll<HTMLElement>('[data-open-plant]').forEach((button) => {
    button.addEventListener('click', () => {
      if (dialog.open) return;
      const savedDraft = getPlantingDraft();
      if (savedDraft) {
        void restoreDraft(savedDraft);
        return;
      }
      draftActive = false;
      clearPlantingDraft();
      resetSharingProgress();
      form.reset();
      plantedTree = null;
      selectedPlantLocation = null;
      certificatePhotoDataUrl = null;
      proofUrlInput.value = '';
      proofConsent.checked = false;
      sessionStorage.removeItem(CURRENT_TREE_KEY);
      sessionStorage.removeItem('nghe-rung-ke:last-tree-id');
      dialog.classList.remove('plant-result-mode');
      formStep.hidden = false;
      resultStep.hidden = true;
      verifyStep.hidden = true;
      shareStep.hidden = true;
      completeStep.hidden = true;
      selectedPlantLocation = null;
      clearPlantingPreview();
      plantSubmit.disabled = true;
      locationHelp.textContent = 'Chạm vào một vị trí trên bản đồ để chọn nơi gieo mầm.';
      locationHelp.classList.remove('is-error');
      setPlantStep('PLANT');
      document.querySelector<HTMLElement>('#form-error')!.textContent = '';
      verifyError.textContent = '';
      draftActive = true;
      dialog.showModal();
      persistDraft('PLANT');
      void refreshPlantingMap();
    });
  });

  document.querySelector('#close-dialog')?.addEventListener('click', () => {
    persistDraft();
    dialog.close();
  });
  dialog.addEventListener('close', () => persistDraft());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const supporter = String(data.get('supporter') ?? '').trim();
    const species = String(data.get('species') ?? 'oak') as TreeSpecies;
    const error = document.querySelector<HTMLElement>('#form-error');

    if (!supporter || !data.get('consent') || !species) {
      if (error) error.textContent = 'Vui lòng nhập tên, chọn mầm cây và xác nhận đồng ý tham gia.';
      return;
    }
    if (!selectedPlantLocation) {
      if (error) error.textContent = 'Vui lòng chọn một vị trí để gieo mầm.';
      locationHelp.textContent = 'Vui lòng chọn một vị trí để gieo mầm.';
      locationHelp.classList.add('is-error');
      return;
    }
    const coordinates = selectedPlantLocation;
    plantSubmit.disabled = true;
    const originalSubmitText = plantSubmit.textContent;
    plantSubmit.textContent = 'Đang gieo mầm...';
    persistDraft('PLANT');
    let createdTree: PlantingDraftTree;
    const existingTreeMatchesForm = plantedTree
      && plantedTree.status === 'PENDING'
      && plantedTree.name === supporter
      && plantedTree.tree_type === species
      && plantedTree.latitude === coordinates.latitude
      && plantedTree.longitude === coordinates.longitude;
    if (existingTreeMatchesForm && plantedTree) {
      createdTree = plantedTree;
    } else {
      plantedTree = null;
      persistDraft('PLANT');
      try {
        createdTree = await createTree({ name: supporter, treeType: species, ...coordinates });
      } catch (requestError) {
        console.error('Supabase tree insert failed:', requestError);
        if (error) error.textContent = requestError instanceof Error ? requestError.message : 'Không thể gieo mầm. Vui lòng thử lại.';
        plantSubmit.disabled = false;
        plantSubmit.textContent = originalSubmitText;
        return;
      }
    }
    plantedTree = createdTree;
    sessionStorage.setItem(CURRENT_TREE_KEY, createdTree.id);
    sessionStorage.setItem('nghe-rung-ke:last-tree-id', createdTree.id);
    persistDraft('SHARE');
    const newTree = toTreeRecord(createdTree);
    participantName = supporter;
    completeSupporter.textContent = supporter;
    const existingTreeIndex = state.trees.findIndex((tree) => tree.id === newTree.id);
    if (existingTreeIndex >= 0) state.trees[existingTreeIndex] = newTree;
    else state.trees.push(newTree);
    renderForest(state);
    plantSubmit.disabled = false;
    plantSubmit.textContent = originalSubmitText;
    if (error) error.textContent = '';
    formStep.hidden = true;
    resultStep.hidden = false;
    verifyStep.hidden = true;
    shareStep.hidden = false;
    completeStep.hidden = true;
    setPlantStep('SHARE');
    dialog.classList.add('plant-result-mode');
    dialog.scrollTop = 0;
    void prepareCertificate(createdTree).catch((certificateError: unknown) => {
      console.error('Could not generate planting certificate:', certificateError);
      downloadCertificate.disabled = false;
      certificateStatus.textContent = 'Không thể tạo chứng nhận trên trình duyệt này. Bạn vẫn có thể sao chép caption và chia sẻ.';
      showToast('Không thể tạo chứng nhận. Vui lòng thử lại trên trình duyệt khác.');
    });
    renderPlantingResultMap([
      ...state.trees.map((tree) => ({
        id: tree.id,
        treeType: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: tree.status,
      })),
    ], createdTree.id);
    updatePlantSubmitState();
    sessionStorage.setItem('nghe-rung-ke:last-supporter', supporter);
    showToast(`🌱 Mầm xanh của ${supporter} đã được gieo!`);
  });

  changeCertificatePhoto.addEventListener('click', () => certificatePhotoInput.click());
  certificatePhotoInput.addEventListener('change', async () => {
    const file = certificatePhotoInput.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      certificatePhotoStatus.textContent = 'Vui lòng chọn ảnh JPG, PNG hoặc WebP.';
      certificatePhotoInput.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      certificatePhotoStatus.textContent = 'Ảnh cần có dung lượng tối đa 10 MB.';
      certificatePhotoInput.value = '';
      return;
    }
    const tree = certificateTree;
    if (!tree) {
      certificatePhotoStatus.textContent = 'Chứng nhận chưa sẵn sàng. Vui lòng thử lại.';
      certificatePhotoInput.value = '';
      return;
    }

    const generation = certificateGeneration;
    certificatePhotoStatus.textContent = 'Đang cập nhật ảnh trên chứng nhận…';
    try {
      const photo = await loadCertificatePhoto(file);
      if (generation !== certificateGeneration) return;
      certificatePhotoDataUrl = persistableCertificatePhoto(photo);
      await prepareCertificate(tree, photo, { x: 0.5, y: 0.5 }, 1);
      certificatePhotoStatus.textContent = 'Ảnh chứng nhận đã được cập nhật.';
    } catch (error) {
      console.error('Could not update planting certificate photo:', error);
      certificatePhotoStatus.textContent = 'Không thể cập nhật ảnh. Vui lòng chọn ảnh khác.';
      downloadCertificate.disabled = !certificateCanvas;
    } finally {
      certificatePhotoInput.value = '';
    }
  });
  resetCertificatePhoto.addEventListener('click', async () => {
    if (!certificateTree) return;
    certificatePhotoStatus.textContent = 'Đang khôi phục ảnh mặc định…';
    try {
      certificatePhotoDataUrl = null;
      await prepareCertificate(certificateTree, null, { x: 0.5, y: 0.5 }, 1);
      certificatePhotoStatus.textContent = 'Đã khôi phục ảnh mặc định trên chứng nhận.';
    } catch (error) {
      console.error('Could not restore the default planting certificate photo:', error);
      certificatePhotoStatus.textContent = 'Không thể khôi phục ảnh mặc định. Vui lòng thử lại.';
      downloadCertificate.disabled = !certificateCanvas;
    }
  });

  confirmPlant.addEventListener('click', async () => {
    const proofUrl = proofUrlInput.value.trim();
    if (!proofConsent.checked) {
      verifyError.textContent = 'Vui lòng tick xác nhận sau khi bạn đã chia sẻ.';
      return;
    }
    try {
      const url = new URL(proofUrl);
        if (!['http:', 'https:'].includes(url.protocol) || !['facebook.com', 'www.facebook.com', 'm.facebook.com', 'tiktok.com', 'www.tiktok.com'].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error('Invalid domain');
    } catch {
      verifyError.textContent = 'Vui lòng dán một đường link hợp lệ.';
      return;
    }
    const treeId = plantedTree?.id
      ?? sessionStorage.getItem(CURRENT_TREE_KEY)
      ?? sessionStorage.getItem('nghe-rung-ke:last-tree-id');
    if (!treeId) {
      verifyError.textContent = 'Không tìm thấy mầm cây đang chờ xác nhận. Vui lòng gieo lại cây.';
      return;
    }
    confirmPlant.disabled = true;
    const originalConfirmText = confirmPlant.textContent;
    confirmPlant.textContent = 'Đang xác nhận...';
    let confirmedTree: TreeParticipant;
    try {
      confirmedTree = await confirmTree(treeId, proofUrl);
    } catch (requestError) {
      console.error('Supabase tree confirmation failed:', requestError);
      verifyError.textContent = requestError instanceof Error ? requestError.message : 'Không thể xác nhận. Vui lòng thử lại.';
      confirmPlant.disabled = false;
      confirmPlant.textContent = originalConfirmText;
      return;
    }
    plantedTree = confirmedTree;
    const existingIndex = state.trees.findIndex((tree) => tree.id === treeId);
    if (existingIndex >= 0) state.trees[existingIndex] = toTreeRecord(confirmedTree);
    else state.trees.push(toTreeRecord(confirmedTree));
    sessionStorage.setItem('nghe-rung-ke:last-confirmed-tree-id', treeId);
    sessionStorage.removeItem(CURRENT_TREE_KEY);
    sessionStorage.removeItem('nghe-rung-ke:last-tree-id');
    sessionStorage.setItem('nghe-rung-ke:last-certified', '1');
    participantName = confirmedTree.name;
    renderForest(state);
    confirmPlant.disabled = false;
    confirmPlant.textContent = originalConfirmText;
    showCompleteStep();
  });

  downloadCertificate.addEventListener('click', async () => {
    const canvas = certificateCanvas;
    if (!canvas) {
      certificateStatus.textContent = 'Chứng nhận chưa sẵn sàng. Vui lòng thử lại.';
      return;
    }
    try {
      const certificateBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Không thể tạo ảnh PNG.'));
        }, 'image/png');
      });
      const objectUrl = URL.createObjectURL(certificateBlob);
      const downloadLink = document.createElement('a');
      const filename = participantName.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'nguoi-ban-cua-rung';
      downloadLink.href = objectUrl;
      downloadLink.download = `chung-nhan-nghe-rung-ke-${filename}.png`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      certificateDownloaded = true;
      certificateStatus.textContent = 'Chứng nhận đã sẵn sàng 💚 Hãy lưu ảnh để sử dụng khi chia sẻ lên Facebook.';
      updateSharingProgress();
      showToast('Chứng nhận đã sẵn sàng 💚');
    } catch (error) {
      console.error('Could not download planting certificate:', error);
      certificateStatus.textContent = 'Không thể tải chứng nhận. Vui lòng thử lại.';
      showToast('Không thể tải chứng nhận. Vui lòng thử lại.');
    }
  });
  copyCaption.addEventListener('click', async () => {
    try {
      await copyText(createShareCaption());
      captionCopied = true;
      captionStatus.textContent = 'Đã sao chép caption 💚 Bạn có thể dán vào bài viết Facebook.';
      updateSharingProgress();
      showToast('Đã sao chép caption 💚');
    } catch (error) {
      console.error('Could not copy planting caption:', error);
      captionStatus.textContent = 'Không thể sao chép tự động. Vui lòng chọn và sao chép caption ở trên.';
      showToast('Không thể sao chép caption. Vui lòng thử lại.');
    }
  });
  sendShare.addEventListener('click', () => {
    openFacebookShare();
  });
  readyPost.addEventListener('click', () => {
    resultStep.hidden = true;
    shareStep.hidden = true;
    verifyStep.hidden = false;
    setPlantStep('VERIFY');
    dialog.scrollTop = 0;
  });
  viewForestMap.addEventListener('click', () => {
    draftActive = false;
    clearPlantingDraft();
    sessionStorage.removeItem(CURRENT_TREE_KEY);
    sessionStorage.removeItem('nghe-rung-ke:last-tree-id');
    dialog.close();
    document.querySelector('#forest-map-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  backToPlant.addEventListener('click', () => {
    shareStep.hidden = true;
    resultStep.hidden = true;
    verifyStep.hidden = true;
    completeStep.hidden = true;
    formStep.hidden = false;
    setPlantStep('PLANT');
  });

  backToShare.addEventListener('click', () => {
    verifyStep.hidden = true;
    completeStep.hidden = true;
    formStep.hidden = true;
    resultStep.hidden = false;
    shareStep.hidden = false;
    setPlantStep('SHARE');
  });
  backToVerify.addEventListener('click', () => {
    completeStep.hidden = true;
    formStep.hidden = true;
    resultStep.hidden = true;
    shareStep.hidden = true;
    verifyStep.hidden = false;
    setPlantStep('VERIFY');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistDraft();
  });
  window.addEventListener('pagehide', () => persistDraft());
  window.addEventListener('beforeunload', () => persistDraft());
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    const draft = getPlantingDraft();
    if (draft) void restoreDraft(draft);
  });

  if (initialDraft) void restoreDraft(initialDraft);
};
