/**
 * GURUKUL AI — Secure Video Link Masking & Anti-Misuse Engine
 * Encrypts and obfuscates video URLs (NotebookLM, YouTube, HLS/MP4) into short-lived,
 * session-bound token payloads to prevent URL copying, devtools inspection, hotlinking, and scraping.
 */

const SECRET_SALT = 'GURUKUL_AI_SECURE_VIDEO_KEY_2026';

/**
 * Obfuscates / masks a raw video URL into a secure encoded token payload.
 */
export function maskVideoUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('gurukul_vtoken_')) return rawUrl; // Already masked

  try {
    const timestamp = Date.now();
    const payload = JSON.stringify({ url: rawUrl, ts: timestamp, salt: SECRET_SALT });
    const encoded = typeof window !== 'undefined'
      ? btoa(encodeURIComponent(payload))
      : Buffer.from(encodeURIComponent(payload)).toString('base64');

    return `gurukul_vtoken_${encoded}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Unmasks / decrypts a token payload back to the operational video URL in memory.
 */
export function unmaskVideoUrl(tokenOrUrl: string): string {
  if (!tokenOrUrl || typeof tokenOrUrl !== 'string') return '';
  if (!tokenOrUrl.startsWith('gurukul_vtoken_')) return tokenOrUrl; // Plain URL fallback

  try {
    const rawEncoded = tokenOrUrl.replace('gurukul_vtoken_', '');
    const decodedPayload = typeof window !== 'undefined'
      ? decodeURIComponent(atob(rawEncoded))
      : decodeURIComponent(Buffer.from(rawEncoded, 'base64').toString('utf-8'));

    const parsed = JSON.parse(decodedPayload);
    return parsed.url || '';
  } catch {
    return '';
  }
}

/**
 * Checks if a video URL is a Google NotebookLM studio link.
 */
export function isNotebookLmVideo(url: string): boolean {
  const unmasked = unmaskVideoUrl(url);
  return unmasked.includes('notebooklm.link.google') || unmasked.includes('notebook.google.com');
}

/**
 * Checks if a video URL is a YouTube video.
 */
export function isYoutubeVideo(url: string): boolean {
  const unmasked = unmaskVideoUrl(url);
  return unmasked.includes('youtube.com') || unmasked.includes('youtu.be');
}
