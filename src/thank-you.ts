import './style.css';
import templateUrl from './assets/thank-you-template.png';
import brushMaskUrl from './assets/thank-you-brush-mask.png';

interface CardState {
  name: string;
  photo: HTMLImageElement | null;
}

const canvas = document.querySelector<HTMLCanvasElement>('#thank-card');
const nameInput = document.querySelector<HTMLInputElement>('#supporter-name');
const nameLength = document.querySelector<HTMLElement>('#name-length');
const photoInput = document.querySelector<HTMLInputElement>('#supporter-photo');
const resetPhotoButton = document.querySelector<HTMLButtonElement>('#reset-photo');
const photoStatus = document.querySelector<HTMLElement>('#photo-status');
const downloadButton = document.querySelector<HTMLButtonElement>('#download-card');
const shareButton = document.querySelector<HTMLButtonElement>('#share-card');
const toast = document.querySelector<HTMLElement>('#toast');
const backLink = document.querySelector<HTMLAnchorElement>('.back-link');

if (!canvas || !nameInput || !nameLength || !photoInput || !resetPhotoButton || !photoStatus || !downloadButton || !shareButton || !toast) {
  throw new Error('Không tìm thấy thành phần tạo thư cảm ơn.');
}

backLink?.addEventListener('click', (event) => {
  event.preventDefault();
  window.history.back();
});

const context = canvas.getContext('2d');
if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

const queryName = new URLSearchParams(location.search).get('name')?.trim();
const state: CardState = {
  name: queryName || sessionStorage.getItem('nghe-rung-ke:last-supporter') || 'Người bạn của rừng',
  photo: null,
};

const template = new Image();
const brushMask = new Image();
const photoCanvas = document.createElement('canvas');
// Cover the whole alpha area of thank-you-brush-mask.png (x: 30..737, y: 120..599).
// A smaller photo leaves straight edges visible inside the brush texture.
const photoBounds = { x: 30, y: 120, width: 708, height: 480 };
photoCanvas.width = canvas.width;
photoCanvas.height = canvas.height;
const photoContext = photoCanvas.getContext('2d');
if (!photoContext) throw new Error('Không thể tạo lớp ảnh trong suốt.');

const loadImage = (image: HTMLImageElement, source: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Không tải được ảnh: ${source}`));
  image.src = source;
});

const drawImageCover = (
  targetContext: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  targetContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
};

const fitText = (text: string, maxWidth: number, initialSize: number): number => {
  let size = initialSize;
  do {
    context.font = `800 ${size}px "Be Vietnam Pro", sans-serif`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > 38);
  return size;
};

const drawCard = (): void => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(template, 0, 0, canvas.width, canvas.height);

  if (state.photo) {
    photoContext.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
    drawImageCover(photoContext, state.photo, photoBounds.x, photoBounds.y, photoBounds.width, photoBounds.height);
    photoContext.globalCompositeOperation = 'destination-in';
    photoContext.drawImage(brushMask, 0, 0, photoCanvas.width, photoCanvas.height);
    photoContext.globalCompositeOperation = 'source-over';
    context.drawImage(photoCanvas, 0, 0);
  }

  context.fillStyle = '#f8f2d9';
  context.fillRect(25, 624, 718, 76);
  context.textAlign = 'center';
  const nameSize = fitText(state.name, 680, 43);
  context.fillStyle = '#111';
  context.font = `800 ${nameSize}px "Be Vietnam Pro", sans-serif`;
  context.fillText(state.name, 384, 678);
};

const cardBlob = (): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('Không thể tạo ảnh PNG.'));
  }, 'image/png', 1);
});

const safeFileName = (name: string): string => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase() || 'nguoi-ban-cua-rung';

const showToast = (message: string): void => {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
};

const loadUploadedPhoto = (file: File): void => {
  if (file.size > 8 * 1024 * 1024) {
    photoStatus.textContent = 'Ảnh vượt quá 8 MB. Vui lòng chọn ảnh nhỏ hơn.';
    photoStatus.classList.add('error');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    state.photo = image;
    drawCard();
    photoStatus.textContent = `Đã chọn: ${file.name}`;
    photoStatus.classList.remove('error');
    URL.revokeObjectURL(objectUrl);
  };
  image.onerror = () => {
    photoStatus.textContent = 'Không thể đọc ảnh này. Vui lòng chọn ảnh khác.';
    photoStatus.classList.add('error');
    URL.revokeObjectURL(objectUrl);
  };
  image.src = objectUrl;
};

nameInput.value = state.name;
nameLength.textContent = `${state.name.length}/32`;
nameInput.addEventListener('input', () => {
  state.name = nameInput.value.trim() || 'Người bạn của rừng';
  nameLength.textContent = `${nameInput.value.length}/32`;
  drawCard();
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (file) loadUploadedPhoto(file);
});

resetPhotoButton.addEventListener('click', () => {
  state.photo = null;
  photoInput.value = '';
  photoStatus.textContent = 'Đang dùng ảnh mặc định của dự án.';
  photoStatus.classList.remove('error');
  drawCard();
});

downloadButton.addEventListener('click', async () => {
  const blob = await cardBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `thu-cam-on-${safeFileName(state.name)}.png`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Thiệp cảm ơn đã được tải xuống.');
});

shareButton.addEventListener('click', async () => {
  try {
    const blob = await cardBlob();
    const file = new File([blob], `thu-cam-on-${safeFileName(state.name)}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'Nghe Rừng Kể', text: 'Tôi đã trồng một cây ảo cùng Nghe Rừng Kể!', files: [file] });
      return;
    }
    await navigator.clipboard.writeText(location.href);
    showToast('Thiết bị chưa hỗ trợ chia sẻ ảnh. Đã sao chép đường dẫn trang.');
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') showToast('Chưa thể chia sẻ. Bạn có thể tải ảnh về trước.');
  }
});

Promise.all([
  loadImage(template, templateUrl),
  loadImage(brushMask, brushMaskUrl),
  document.fonts.ready,
]).then(() => {
  drawCard();
}).catch(() => {
  context.fillStyle = '#f5f1e6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  showToast('Một số tài nguyên chưa tải được. Vui lòng làm mới trang.');
});
