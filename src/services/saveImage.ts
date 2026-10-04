export type ImageSaveMethod = 'shared' | 'downloaded';

export const saveImage = async (
  blob: Blob,
  filename: string,
  title: string,
): Promise<ImageSaveMethod> => {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  if (
    typeof navigator.share === 'function'
    && navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({ files: [file], title });
    return 'shared';
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return 'downloaded';
};
