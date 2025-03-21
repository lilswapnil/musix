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
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function wrapper
 */
export function throttle(limit = 1000) {
  const timestamps = new Map();
  
  return function(key) {
    return function(func) {
      return function(...args) {
        const now = Date.now();
        const lastCall = timestamps.get(key) || 0;
        
        if (now - lastCall >= limit) {
          timestamps.set(key, now);
          return func(...args);
        } else {
          // Calculate time remaining until next allowed call
          const retryAfter = Math.ceil((lastCall + limit - now) / 1000);
          
          // Create error with industry standard message format
          const error = new Error('Rate limit exceeded');
          error.status = 429; // Standard HTTP status code for rate limiting
          error.retryAfter = retryAfter;
          error.message = `Rate limit exceeded. Please retry in ${retryAfter} seconds.`;
          
          // Only log the key in debug console for developer visibility
          console.debug(`Rate limited: ${key} endpoint (retry in ${retryAfter}s)`);
          
          return Promise.reject(error);
        }
      };
    };
  };
}

/**
 * Request queue for limiting concurrent API requests
 */
class RequestQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.runningRequests = 0;
    this.queue = [];
  }
  
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.runningRequests++;
        
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.runningRequests--;
          this.processQueue();
        }
      };
      
      if (this.runningRequests < this.concurrency) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
  
  processQueue() {
    if (this.queue.length > 0 && this.runningRequests < this.concurrency) {
      const nextRequest = this.queue.shift();
      nextRequest();
    }
  }
}

// Create a shared request queue
const globalRequestQueue = new RequestQueue(5);

/**
 * Rate limiter with domain-based buckets
 */
class RateLimiter {
  constructor() {
    this.buckets = new Map();
  }
  
  shouldAllow(domain, maxRequests = 50, timeWindow = 60000) {
    const now = Date.now();
    
    if (!this.buckets.has(domain)) {
      this.buckets.set(domain, {
        requests: 1,
        resetAt: now + timeWindow
      });
      return true;
    }
    
    const bucket = this.buckets.get(domain);
    
    if (now > bucket.resetAt) {
      bucket.requests = 1;
      bucket.resetAt = now + timeWindow;
      return true;
    }
    
    if (bucket.requests < maxRequests) {
      bucket.requests++;
      return true;
    }
    
    return false;
  }
}

const globalRateLimiter = new RateLimiter();

/**
 * Enhanced API request function with debouncing, throttling, and retry logic
 * @param {string} url - API endpoint
 * @param {Object} options - Request options
 * @param {Object} controls - Control parameters for request behavior
 * @returns {Promise} - API response
 */
export async function enhancedApiRequest(url, options = {}, controls = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    cacheTime = 300000,
    domain = new URL(url).hostname,
    rateLimit = 50,
    timeWindow = 60000
  } = controls;
  
  // Apply rate limiting
  if (!globalRateLimiter.shouldAllow(domain, rateLimit, timeWindow)) {
    console.warn(`Rate limit exceeded for ${domain}`);
    return Promise.reject(new Error('Rate limit exceeded'));
  }
  
  // Check cache first for GET requests
  const cacheKey = options.method === 'GET' ? `${url}-${JSON.stringify(options)}` : null;
  if (cacheKey) {
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse && Date.now() < cachedResponse.expiry) {
      console.log(`Using cached response for: ${url}`);
      return cachedResponse.data;
    }
  }
  
  // Queue the request
  return globalRequestQueue.add(async () => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the successful response for GET requests
        if (cacheKey) {
          apiCache.set(cacheKey, {
            data,
            expiry: Date.now() + cacheTime
          });
        }
        
        return data;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed for ${url}:`, error);
        lastError = error;
        
        if (attempt < retries) {
          // Exponential backoff with jitter for retries
          const delay = retryDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  });
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

/**
 * Create a debounced search function
 * @param {Function} searchFunction - The search function to debounce
 * @param {number} wait - Debounce wait time in ms
 * @returns {Function} - Debounced search function
 */
export function createDebouncedSearch(searchFunction, wait = 500) {
  return debounce(searchFunction, wait);
}