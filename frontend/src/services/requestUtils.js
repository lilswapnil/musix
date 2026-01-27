// Centralized fetch utility for consistent error handling and response parsing
export async function fetchWithHandling(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    const errorMsg = data?.error_description || data?.error || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }
  return data;
}
