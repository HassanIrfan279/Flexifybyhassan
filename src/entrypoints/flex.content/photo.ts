/**
 * Copies the student's profile photo from Flex's top bar into a small JPEG
 * data URL (kept on this device, shown on the popup's Home tab).
 */
export async function capturePhoto(size = 128): Promise<string | undefined> {
  const img = document.querySelector<HTMLImageElement>('.m-topbar__userpic img, .m-card-user__pic img');
  if (!img?.getAttribute('src')) return undefined;
  try {
    if (!img.complete) await new Promise((resolve, reject) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', reject, { once: true });
    });
    if (!img.naturalWidth) return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    // Centre-crop to a square.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    // Cross-origin or broken image: the popup falls back to initials.
    return undefined;
  }
}
