import { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useRouteStore } from '../../store/routeStore';
import './MapView.css';

const MapView = () => {
  const mapContainerRef = useRef(null);
  const { map, directions, setMap, setDirections, clearMarkers, addMarker, markers } = useMapStore();
  const { selectedPoints, addSelectedPoint, currentRoute, preferences } = useRouteStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    const mapglApiKey = import.meta.env.VITE_2GIS_MAP_API_KEY;
    const directionsApiKey = import.meta.env.VITE_2GIS_DIRECTIONS_API_KEY;

    if (!mapglApiKey) {
      console.error('2GIS MapGL API key is not set');
      return;
    }

    // Initialize map
    const mapInstance = new window.mapgl.Map(mapContainerRef.current, {
      center: [37.6173, 55.7558], // Moscow
      zoom: 12,
      key: mapglApiKey,
    });

    setMap(mapInstance);

    // Initialize directions plugin if key is available
    if (directionsApiKey) {
      const directionsInstance = new window.mapgl.Directions(mapInstance, {
        directionsApiKey: directionsApiKey,
      });
      setDirections(directionsInstance);
    }

    // Add click handler for selecting points
    mapInstance.on('click', (e) => {
      const coords = e.lngLat;
      
      // Проверяем лимит точек из preferences
      const { selectedPoints, preferences } = useRouteStore.getState();
      const maxPoints = preferences.maxWaypoints || 10;
      
      if (selectedPoints.length >= maxPoints) {
        alert(`Достигнут лимит точек (${maxPoints}). Измените "Максимум точек" в настройках или очистите маршрут.`);
        return;
      }
      
      // Add marker to visualize selected point
      const marker = new window.mapgl.Marker(mapInstance, {
        coordinates: coords,
        icon: 'https://docs.2gis.com/img/dotMarker.svg',
      });
      
      addMarker(marker);
      addSelectedPoint({
        lat: coords[1],
        lon: coords[0],
      });
    });

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);

  // Draw route when selectedPoints change
  useEffect(() => {
    if (!map || !directions) return;

    if (selectedPoints.length >= 2) {
      // Convert points to [lon, lat] format
      const points = selectedPoints.map(p => [p.lon, p.lat]);
      
      // Draw pedestrian route
      directions.pedestrianRoute({
        points: points,
      });

      // Remove temporary markers after route is drawn
      markers.forEach((m) => {
        if (m && m.destroy) {
          m.destroy();
        }
      });
      clearMarkers();
    }
  }, [selectedPoints, map, directions]);

  // Draw route when currentRoute changes (from backend)
  useEffect(() => {
    if (!map || !directions || !currentRoute) return;

    const waypoints = currentRoute.waypoints || [];
    if (waypoints.length < 2) return;

    // Clear previous markers
    clearMarkers();

    // Extract coordinates
    const points = waypoints.map(wp => [
      wp.coordinates.lon,
      wp.coordinates.lat,
    ]);

    // Draw pedestrian route
    directions.pedestrianRoute({
      points: points,
    });

    // Add markers for waypoints
    waypoints.forEach((waypoint, index) => {
      const marker = new window.mapgl.Marker(map, {
        coordinates: [waypoint.coordinates.lon, waypoint.coordinates.lat],
        label: {
          text: `${index + 1}`,
          color: '#ffffff',
          fontSize: 14,
        },
      });
      
      addMarker(marker);
    });

    // Fit bounds to show all waypoints
    if (points.length > 0) {
      const bounds = points.reduce((acc, point) => {
        if (!acc.minLon || point[0] < acc.minLon) acc.minLon = point[0];
        if (!acc.maxLon || point[0] > acc.maxLon) acc.maxLon = point[0];
        if (!acc.minLat || point[1] < acc.minLat) acc.minLat = point[1];
        if (!acc.maxLat || point[1] > acc.maxLat) acc.maxLat = point[1];
        return acc;
      }, {});

      const center = [
        (bounds.minLon + bounds.maxLon) / 2,
        (bounds.minLat + bounds.maxLat) / 2,
      ];

      map.setCenter(center);
      map.setZoom(12);
    }
  }, [currentRoute, map, directions]);

  return (
    <div className="map-view">
      <div ref={mapContainerRef} className="map-container" />
      
      {selectedPoints.length > 0 && (
        <div className="map-info">
          <p>Выбрано точек: {selectedPoints.length}</p>
        </div>
      )}
    </div>
  );
};

export default MapView;
