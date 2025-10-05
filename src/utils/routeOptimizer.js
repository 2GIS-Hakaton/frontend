/**
 * Вычисляет расстояние между двумя точками (формула гаверсинуса)
 * @param {Object} point1 - {lat, lon}
 * @param {Object} point2 - {lat, lon}
 * @returns {number} расстояние в метрах
 */
const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Радиус Земли в метрах
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Вычисляет общую длину маршрута
 * @param {Array} points - массив точек
 * @returns {number} общая длина в метрах
 */
const calculateTotalDistance = (points) => {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(points[i], points[i + 1]);
  }
  return total;
};

/**
 * Оптимизирует порядок промежуточных точек методом ближайшего соседа
 * Первая и последняя точки остаются на своих местах (A и B)
 * @param {Array} points - массив точек маршрута
 * @returns {Array} оптимизированный массив точек
 */
export const optimizeRoute = (points) => {
  if (points.length <= 2) {
    return points; // Нечего оптимизировать
  }

  // Сохраняем первую и последнюю точки
  const start = points[0];
  const end = points[points.length - 1];
  const middlePoints = points.slice(1, -1);

  if (middlePoints.length === 0) {
    return points; // Только начало и конец
  }

  if (middlePoints.length === 1) {
    return points; // Только одна промежуточная точка
  }

  // Используем жадный алгоритм ближайшего соседа
  const optimized = [start];
  const remaining = [...middlePoints];
  let current = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(current, remaining[0]);

    // Находим ближайшую точку
    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(current, remaining[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // Добавляем ближайшую точку к маршруту
    const nearest = remaining[nearestIndex];
    optimized.push(nearest);
    remaining.splice(nearestIndex, 1);
    current = nearest;
  }

  // Добавляем конечную точку
  optimized.push(end);

  return optimized;
};

/**
 * Улучшает маршрут методом 2-opt
 * @param {Array} points - массив точек
 * @param {number} maxIterations - максимальное количество итераций
 * @returns {Array} улучшенный маршрут
 */
export const optimizeRouteAdvanced = (points, maxIterations = 100) => {
  if (points.length <= 3) {
    return points;
  }

  let route = [...points];
  let improved = true;
  let iterations = 0;

  const start = route[0];
  const end = route[route.length - 1];

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Пробуем все возможные перестановки промежуточных точек
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        // Создаем новый маршрут с обратным порядком между i и j
        const newRoute = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];

        // Проверяем, стал ли маршрут короче
        const oldDistance = calculateTotalDistance(route);
        const newDistance = calculateTotalDistance(newRoute);

        if (newDistance < oldDistance) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  // Убеждаемся, что первая и последняя точки на месте
  if (route[0] !== start) {
    const startIndex = route.indexOf(start);
    if (startIndex > 0) {
      route = [start, ...route.slice(0, startIndex), ...route.slice(startIndex + 1)];
    }
  }

  if (route[route.length - 1] !== end) {
    const endIndex = route.indexOf(end);
    if (endIndex < route.length - 1) {
      route = [...route.slice(0, endIndex), ...route.slice(endIndex + 1), end];
    }
  }

  return route;
};

/**
 * Форматирует расстояние для отображения
 * @param {number} meters - расстояние в метрах
 * @returns {string} отформатированное расстояние
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
};
