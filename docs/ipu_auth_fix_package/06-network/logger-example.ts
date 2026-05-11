export async function safeFetch(url: string, options?: RequestInit) {
  try {
    console.log('[HTTP] Request:', url);

    const response = await fetch(url, options);

    console.log('[HTTP] Status:', response.status);

    return response;
  } catch (error) {
    console.error('[HTTP] Network Error:', error);
    throw error;
  }
}
