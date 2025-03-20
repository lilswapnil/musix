/**
 * Debounce function to delay API calls until user input stops
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cache for storing API responses
 */
const apiCache = new Map();

/**
 * Function to make API requests with caching
 * @param {string} url - The API URL
 * @param {Object} options - Fetch options
 * @param {number} cacheTime - How long to cache the result in ms (default: 5 minutes)
 * @returns {Promise} - The API response
 */
export async function cachedFetch(url, options = {}, cacheTime = 300000) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check if we have a cached response that's not expired
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse && Date.now() < cachedResponse.expiry) {
    console.log(`Using cached response for: ${url}`);
    return cachedResponse.data;
  }
  
  // Make the API call
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, {
      data,
      expiry: Date.now() + cacheTime
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}