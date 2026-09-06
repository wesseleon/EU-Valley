/**
 * Small helper around fetch that only accepts real JSON responses.
 *
 * In the Lovable preview the serverless functions under /api are not executed:
 * the request resolves with the transformed source file (text/javascript).
 * Treating those responses as failures lets the app fall back to a local-only
 * mode instead of showing an empty map or failing every save.
 */
export interface JsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

export const fetchJson = async <T>(input: string, init?: RequestInit): Promise<JsonResult<T> | null> => {
  try {
    const response = await fetch(input, { credentials: 'same-origin', ...init });
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return null;
    const data = (await response.json().catch(() => null)) as T | null;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return null;
  }
};
