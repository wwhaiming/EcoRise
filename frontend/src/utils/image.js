/* EcoRise — client-side image downscale.
 *
 * Shrinks a captured photo to <= maxPx on its longest side and re-encodes as JPEG
 * BEFORE upload. Cuts the upload payload (faster posts, less bandwidth) and strips
 * most camera metadata. Fails safe: returns the original string unchanged on any
 * error, so it can never block a legitimate post. The server still computes the
 * dedup hashes and applies its own retention policy on what it receives.
 */
export async function downscaleImage(dataUrl, maxPx = 1280, quality = 0.82) {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return dataUrl;
    if (typeof document === 'undefined' || typeof Image === 'undefined') return dataUrl;
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataUrl;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return dataUrl;
    const scale = Math.min(1, maxPx / Math.max(w, h));
    if (scale >= 1) return dataUrl;                       // already small enough
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    const ctx = cv.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    const out = cv.toDataURL('image/jpeg', quality);
    return (out && out.startsWith('data:image/jpeg') && out.length < dataUrl.length) ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

export default downscaleImage;
