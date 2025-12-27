const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');
const config = require('./config');

const endpointUrl = config.azureMl.endpointUrl;
const apiKey = process.env.AZURE_ML_API_KEY || '';
const apiKeyHeaderName = process.env.AZURE_ML_API_KEY_HEADER || 'azureml-model-key';
const scope = process.env.AZURE_ML_SCOPE || 'https://ml.azure.com/.default';
const timeoutMs = config.azureMl.timeoutMs;

let credential = null;
let credentialInitError = null;

const ensureCredential = () => {
  if (credential || credentialInitError) {
    return credential;
  }

  try {
    credential = new DefaultAzureCredential();
  } catch (error) {
    credentialInitError = error;
    console.error('Failed to initialize Azure ML credential:', error.message);
  }

  return credential;
};

const getAuthHeaders = async () => {
  if (apiKey) {
    return { [apiKeyHeaderName]: apiKey };
  }

  const resolvedCredential = ensureCredential();
  if (!resolvedCredential) {
    throw credentialInitError || new Error('Azure ML credential unavailable');
  }

  const tokenResponse = await resolvedCredential.getToken(scope);
  if (!tokenResponse?.token) {
    throw new Error('Failed to acquire Azure ML access token');
  }

  return { Authorization: `Bearer ${tokenResponse.token}` };
};

const invokeAzureMl = async (payload = {}) => {
  if (!endpointUrl) {
    throw new Error('AZURE_ML_ENDPOINT_URL is not configured');
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error('Azure ML payload is empty');
  }

  const authHeaders = await getAuthHeaders();

  const response = await axios.post(endpointUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    timeout: timeoutMs,
    validateStatus: status => status >= 200 && status < 500
  });

  if (response.status >= 400) {
    const error = new Error('Azure ML inference failed');
    error.response = response;
    throw error;
  }

  return response.data;
};

module.exports = {
  invokeAzureMl
};
