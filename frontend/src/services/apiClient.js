import { enhancedApiRequest } from '../utils/requestUtils';

export class ApiError extends Error {
  constructor(message, { status, data, url, retryAfter } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.retryAfter = retryAfter;
  }
}

const normalizeError = (error, url) => {
  if (error instanceof ApiError) return error;
  const status = error?.status ?? error?.response?.status;
  const retryAfter = error?.retryAfter;
  const message = error?.message || 'Request failed';
  return new ApiError(message, { status, data: error?.data, url, retryAfter });
};

export const normalizeApiError = (error, url) => normalizeError(error, url);

export const createApiError = (message, meta = {}) => new ApiError(message, meta);

export const createApiClient = ({
  baseUrl = '',
  getToken,
  refreshToken,
  onAuthFailure
} = {}) => {
  const request = async (endpoint, options = {}, controls = {}) => {
    const {
      params,
      auth = false,
      enhancedControls = {}
    } = controls;

    const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
    const url = isAbsoluteUrl ? endpoint : `${baseUrl}${endpoint}`;
    const urlWithParams = params
      ? `${url}?${new URLSearchParams(params)}`
      : url;

    const execute = async (tokenOverride) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (auth) {
        const token = tokenOverride ?? (await getToken?.());
        if (!token) {
          throw new ApiError('Authentication required', {
            status: 401,
            url: urlWithParams
          });
        }
        headers.Authorization = `Bearer ${token}`;
      }

      const requestOptions = {
        method: options.method || 'GET',
        headers
      };

      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }

      try {
        return await enhancedApiRequest(urlWithParams, requestOptions, enhancedControls);
      } catch (error) {
        throw normalizeError(error, urlWithParams);
      }
    };

    try {
      return await execute();
    } catch (error) {
      const normalized = normalizeError(error, urlWithParams);
      if (normalized.status === 401 && refreshToken) {
        const newToken = await refreshToken();
        if (newToken) {
          return await execute(newToken);
        }
        if (onAuthFailure) {
          onAuthFailure(normalized);
        }
      }
      throw normalized;
    }
  };

  return { request };
};
