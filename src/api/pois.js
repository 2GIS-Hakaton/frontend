import apiClient from './client';

/**
 * Get list of POIs with optional filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.epoch - Filter by epoch (medieval, imperial, soviet, modern)
 * @param {string} filters.category - Filter by category (architecture, history, culture, religion, art)
 * @returns {Promise<Array>} List of POIs
 */
export const getPOIs = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.epoch) params.append('epoch', filters.epoch);
  if (filters.category) params.append('category', filters.category);
  
  const response = await apiClient.get('/pois', { params });
  return response.data;
};

/**
 * Get POI details by ID
 * @param {string} poiId - POI ID
 * @returns {Promise<Object>} POI details
 */
export const getPOI = async (poiId) => {
  const response = await apiClient.get(`/pois/${poiId}`);
  return response.data;
};
