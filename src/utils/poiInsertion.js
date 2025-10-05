// Утилита для оптимальной вставки достопримечательностей в маршрут

/**
 * Вычисляет расстояние между двумя точками (формула Haversine)
 */
function calculateDistance(point1, point2) {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lon - point1.lon) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Вычисляет расстояние от точки до отрезка маршрута
 */
function distanceToSegment(poi, segmentStart, segmentEnd) {
  const A = poi.lat - segmentStart.lat;
  const B = poi.lon - segmentStart.lon;
  const C = segmentEnd.lat - segmentStart.lat;
  const D = segmentEnd.lon - segmentStart.lon;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = segmentStart.lat;
    yy = segmentStart.lon;
  } else if (param > 1) {
    xx = segmentEnd.lat;
    yy = segmentEnd.lon;
  } else {
    xx = segmentStart.lat + param * C;
    yy = segmentStart.lon + param * D;
  }

  return calculateDistance(poi, { lat: xx, lon: yy });
}

/**
 * Находит оптимальную позицию для вставки POI в маршрут
 * Возвращает индекс, после которого нужно вставить POI
 */
function findOptimalInsertionPosition(poi, route) {
  if (route.length < 2) {
    return route.length; // Добавляем в конец
  }

  let minDistance = Infinity;
  let bestPosition = route.length - 1;

  // Проверяем каждый сегмент маршрута
  for (let i = 0; i < route.length - 1; i++) {
    const distance = distanceToSegment(poi, route[i], route[i + 1]);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestPosition = i;
    }
  }

  return bestPosition + 1; // Вставляем после найденного сегмента
}

/**
 * Вычисляет увеличение длины маршрута при вставке POI
 */
function calculateRouteIncrease(poi, route, position) {
  if (position === 0) {
    // Вставка в начало
    return calculateDistance(poi, route[0]);
  } else if (position >= route.length) {
    // Вставка в конец
    return calculateDistance(route[route.length - 1], poi);
  } else {
    // Вставка между точками
    const prev = route[position - 1];
    const next = route[position];
    const originalDistance = calculateDistance(prev, next);
    const newDistance = calculateDistance(prev, poi) + calculateDistance(poi, next);
    return newDistance - originalDistance;
  }
}

/**
 * Сортирует POI по приоритету вставки (минимальное увеличение маршрута)
 */
export function sortPOIsByInsertionCost(pois, route) {
  return pois.map(poi => {
    const position = findOptimalInsertionPosition(poi, route);
    const cost = calculateRouteIncrease(poi, route, position);
    return { poi, position, cost };
  }).sort((a, b) => a.cost - b.cost);
}

/**
 * Вставляет достопримечательности в маршрут оптимальным образом
 * @param {Array} currentRoute - Текущий маршрут
 * @param {Array} poisToAdd - Достопримечательности для добавления
 * @param {number} maxPoints - Максимальное количество точек
 * @returns {Object} - { newRoute, addedCount, needsExpansion }
 */
export function insertPOIsIntoRoute(currentRoute, poisToAdd, maxPoints) {
  if (!poisToAdd || poisToAdd.length === 0) {
    return { newRoute: currentRoute, addedCount: 0, needsExpansion: false };
  }

  const availableSlots = maxPoints - currentRoute.length;
  const needsExpansion = availableSlots < poisToAdd.length;
  
  // Сортируем POI по стоимости вставки
  const sortedPOIs = sortPOIsByInsertionCost(poisToAdd, currentRoute);
  
  // Берем только те POI, которые помещаются
  const poisToInsert = sortedPOIs.slice(0, Math.min(poisToAdd.length, availableSlots));
  
  let newRoute = [...currentRoute];
  let addedCount = 0;

  // Вставляем POI по одному, пересчитывая позиции после каждой вставки
  for (const { poi } of poisToInsert) {
    const position = findOptimalInsertionPosition(poi, newRoute);
    
    // Преобразуем POI в формат точки маршрута
    const poiPoint = {
      lat: poi.lat,
      lon: poi.lon,
      name: poi.name,
      address: poi.description,
      isPOI: true, // Помечаем как достопримечательность
      category: poi.category,
    };
    
    newRoute.splice(position, 0, poiPoint);
    addedCount++;
  }

  return {
    newRoute,
    addedCount,
    needsExpansion,
    remainingPOIs: poisToAdd.length - addedCount,
  };
}

/**
 * Проверяет, можно ли добавить хотя бы одну достопримечательность
 */
export function canAddPOI(currentRouteLength, maxPoints) {
  return currentRouteLength < maxPoints;
}

/**
 * Вычисляет необходимое количество слотов для всех достопримечательностей
 */
export function calculateRequiredSlots(currentRouteLength, poisCount) {
  return currentRouteLength + poisCount;
}
