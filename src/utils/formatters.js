/**
 * Format distance in meters to human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
};

/**
 * Format duration in minutes to human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
};

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get epoch label in Russian
 * @param {string} epoch - Epoch value
 * @returns {string} Epoch label
 */
export const getEpochLabel = (epoch) => {
  const labels = {
    medieval: 'Средневековье',
    imperial: 'Имперский период',
    soviet: 'Советский период',
    modern: 'Современность',
  };
  return labels[epoch] || epoch;
};

/**
 * Get category label in Russian
 * @param {string} category - Category value
 * @returns {string} Category label
 */
export const getCategoryLabel = (category) => {
  const labels = {
    architecture: 'Архитектура',
    history: 'История',
    culture: 'Культура',
    religion: 'Религия',
    art: 'Искусство',
  };
  return labels[category] || category;
};
