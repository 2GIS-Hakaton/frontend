import apiClient from './client';

/**
 * Generate a new route
 * @param {Object} routeRequest - Route generation parameters
 * @returns {Promise<Object>} Route response with waypoints
 */
export const generateRoute = async (routeRequest) => {
  const response = await apiClient.post('/routes/generate', routeRequest);
  return response.data;
};

/**
 * Get route details by ID
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} Route details
 */
export const getRoute = async (routeId) => {
  const response = await apiClient.get(`/routes/${routeId}`);
  return response.data;
};

/**
 * Get route audio file URL
 * @param {string} routeId - Route ID
 * @returns {string} Audio URL
 */
export const getRouteAudioUrl = (routeId) => {
  return `${apiClient.defaults.baseURL}/routes/${routeId}/audio`;
};

/**
 * Get waypoint audio file URL
 * @param {string} waypointId - Waypoint ID
 * @returns {string} Audio URL
 */
export const getWaypointAudioUrl = (waypointId) => {
  return `${apiClient.defaults.baseURL}/audio/${waypointId}`;
};

/**
 * Check if route audio is ready
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} Status response
 */
export const checkRouteAudioStatus = async (routeId) => {
  try {
    const response = await apiClient.get(`/routes/${routeId}/audio`, {
      validateStatus: (status) => status < 500,
    });
    return {
      ready: response.status === 200,
      partial: response.status === 206,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      ready: false,
      partial: false,
      status: error.response?.status || 0,
    };
  }
};
