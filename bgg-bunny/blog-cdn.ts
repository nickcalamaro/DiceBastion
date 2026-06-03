/**
 * Upload pre-rendered blog HTML to Bunny Storage and purge CDN cache.
 */

const SITE_URL = (process.env.SITE_URL || "https://dicebastion.com").replace(/\/+$/, "");

export function blogCdnBaseUrl(): string {
  return (process.env.BUNNY_CDN_URL || "https://dicebastion.b-cdn.net").replace(/\/+$/, "");
}

export function blogStorageZone(): string {
  return process.env.BUNNY_STORAGE_ZONE || "dicebastion";
}

export function blogPublicPath(relativePath: string): string {
  return `${blogCdnBaseUrl()}/${relativePath.replace(/^\/+/, "")}`;
}

export function blogSiteUrl(): string {
  return SITE_URL;
}

export async function uploadStorageFile(relativePath: string, body: string, contentType: string): Promise<void> {
  await uploadStorageBinary(relativePath, new TextEncoder().encode(body), contentType);
}

export async function uploadStorageBinary(
  relativePath: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  const key = process.env.BUNNY_STORAGE_API_KEY;
  const zone = blogStorageZone();
  if (!key) throw new Error("BUNNY_STORAGE_API_KEY not configured");

  const path = relativePath.replace(/^\/+/, "");
  const res = await fetch(`https://storage.bunnycdn.com/${zone}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: key,
      "Content-Type": contentType,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage upload failed (${path}): ${res.status} ${text}`);
  }
}

export async function deleteStorageFile(relativePath: string): Promise<void> {
  const key = process.env.BUNNY_STORAGE_API_KEY;
  const zone = blogStorageZone();
  if (!key) return;

  const path = relativePath.replace(/^\/+/, "");
  const res = await fetch(`https://storage.bunnycdn.com/${zone}/${path}`, {
    method: "DELETE",
    headers: { AccessKey: key },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.warn(`[Blog] Storage delete warning (${path}): ${res.status} ${text}`);
  }
}

export async function purgeCdnUrls(urls: string[]): Promise<void> {
  const pullZoneId = process.env.BUNNY_PULL_ZONE_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  if (!pullZoneId || !apiKey || urls.length === 0) {
    console.warn("[Blog] CDN purge skipped — set BUNNY_PULL_ZONE_ID and BUNNY_API_KEY");
    return;
  }

  const res = await fetch(`https://api.bunny.net/pullzone/${pullZoneId}/purgeCache`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(urls),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("[Blog] CDN purge failed:", res.status, text);
  }
}

export async function purgeBlogPaths(relativePaths: string[]): Promise<void> {
  const urls = [...new Set(relativePaths.map((p) => blogPublicPath(p)))];
  await purgeCdnUrls(urls);
}
