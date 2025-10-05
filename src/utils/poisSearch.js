// Поиск достопримечательностей вдоль маршрута используя 2GIS Places API

const DGIS_API_KEY = '8561492e-8262-40c5-85e7-a58c1c705168';

// ID рубрик достопримечательностей в 2GIS
// 168 - Достопримечательности
// 220 - Музеи
// 221 - Театры
// 222 - Парки
const POI_RUBRIC_IDS = [168, 220, 221, 222];

/**
 * Создает буфер вокруг линии маршрута
 * @param {Array} points - Массив точек маршрута [{lat, lon}, ...]
 * @param {number} radiusMeters - Радиус буфера в метрах
 * @returns {Array} - Массив сегментов для поиска
 */
function createRouteBuffer(points, radiusMeters = 500) {
  const segments = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    // Центр сегмента
    const centerLat = (start.lat + end.lat) / 2;
    const centerLon = (start.lon + end.lon) / 2;
    
    segments.push({
      center: { lat: centerLat, lon: centerLon },
      radius: radiusMeters,
    });
  }
  
  return segments;
}

/**
 * Поиск достопримечательностей в заданной области
 * @param {Object} center - Центр поиска {lat, lon}
 * @param {number} radius - Радиус поиска в метрах
 * @param {Array} rubricIds - ID рубрик для поиска (по умолчанию все)
 * @returns {Promise<Array>} - Массив найденных достопримечательностей
 */
async function searchPOIsInArea(center, radius, rubricIds = POI_RUBRIC_IDS) {
  try {
    const allPOIs = [];
    
    // Ищем по каждой рубрике отдельно (максимум 10 результатов на запрос)
    for (const rubricId of rubricIds) {
      const response = await fetch(
        `https://catalog.api.2gis.com/3.0/items?rubric_id=${rubricId}&point=${center.lon},${center.lat}&radius=${radius}&fields=items.point,items.rubrics,items.address&key=${DGIS_API_KEY}&page_size=10`
      );
      
      const data = await response.json();
      
      if (data.result?.items) {
        const pois = data.result.items.map(item => ({
          id: item.id,
          name: item.name || 'Неизвестное место',
          description: item.address_name || item.full_name || '',
          lat: item.point?.lat || 0,
          lon: item.point?.lon || 0,
          category: item.rubrics?.[0]?.name || 'Достопримечательность',
          rubrics: item.rubrics || [],
          rubricId: rubricId, // Сохраняем ID рубрики для передачи в API
        }));
        allPOIs.push(...pois);
      }
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return allPOIs;
  } catch (error) {
    console.error('Error searching POIs:', error);
    return [];
  }
}

/**
 * Поиск всех достопримечательностей вдоль маршрута
 * @param {Array} routePoints - Точки маршрута [{lat, lon}, ...]
 * @param {number} radiusMeters - Радиус поиска вокруг маршрута
 * @param {Array} rubricIds - ID рубрик для поиска (опционально)
 * @returns {Promise<Array>} - Уникальные достопримечательности
 */
export async function findPOIsAlongRoute(routePoints, radiusMeters = 500, rubricIds = null) {
  if (!routePoints || routePoints.length < 2) {
    return [];
  }
  
  const segments = createRouteBuffer(routePoints, radiusMeters);
  
  // Поиск POI для каждого сегмента
  const allPOIs = await Promise.all(
    segments.map(segment => searchPOIsInArea(segment.center, segment.radius, rubricIds))
  );
  
  // Объединяем и удаляем дубликаты
  const uniquePOIs = new Map();
  
  allPOIs.flat().forEach(poi => {
    if (!uniquePOIs.has(poi.id)) {
      uniquePOIs.set(poi.id, poi);
    }
  });
  
  return Array.from(uniquePOIs.values());
}

/**
 * Вычисляет расстояние между двумя точками (формула Haversine)
 * @param {Object} point1 - {lat, lon}
 * @param {Object} point2 - {lat, lon}
 * @returns {number} - Расстояние в метрах
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
 * Вычисляет общее расстояние маршрута
 * @param {Array} points - Точки маршрута [{lat, lon}, ...]
 * @returns {number} - Расстояние в метрах
 */
export function calculateRouteDistance(points) {
  if (!points || points.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }
  
  return totalDistance;
}

/**
 * Оценивает время прохождения маршрута
 * @param {number} distanceMeters - Расстояние в метрах
 * @param {number} speedKmh - Скорость в км/ч (по умолчанию 4 км/ч - средняя скорость пешехода)
 * @returns {number} - Время в минутах
 */
export function estimateRouteTime(distanceMeters, speedKmh = 4) {
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / speedKmh;
  return Math.round(timeHours * 60);
}
