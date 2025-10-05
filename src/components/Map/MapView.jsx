import { useEffect, useRef } from "react";
import { useMapStore } from "../../store/mapStore";
import { useRouteStore } from "../../store/routeStore";
import "./MapView.css";

const MapView = () => {
  const mapContainerRef = useRef(null);
  const {
    map,
    directions,
    setMap,
    setDirections,
    clearMarkers,
    addMarker,
    markers,
  } = useMapStore();
  const { selectedPoints, addSelectedPoint, currentRoute, audioUrl } =
    useRouteStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    const mapglApiKey = "89ebb4c5-891d-4609-9e53-66383a3cbdbc";
    const directionsApiKey = "89ebb4c5-891d-4609-9e53-66383a3cbdbc";

    if (!mapglApiKey) {
      console.error("2GIS MapGL API key is not set");
      return;
    }

    // Initialize map
    const mapInstance = new window.mapgl.Map(mapContainerRef.current, {
      center: [37.6173, 55.7558], // Moscow
      zoom: 12,
      key: mapglApiKey,
    });

    // ===============================
    // 🔄 Автоматическое переключение темы карты
    // ===============================
    const darkStyleId = "e05ac437-fcc2-4845-ad74-b1de9ce07555";
    const lightStyleId = "c080bb6a-8134-4993-93a1-5b4d8c36a59b";

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyMapTheme = (isDark) => {
      mapInstance.setStyleById(isDark ? darkStyleId : lightStyleId);
    };

    // Устанавливаем при запуске
    applyMapTheme(prefersDark.matches);

    // Слушаем изменения системной темы
    prefersDark.addEventListener("change", (e) => {
      applyMapTheme(e.matches);
    });

    // ===============================

    setMap(mapInstance);

    // Initialize directions plugin if key is available
    if (directionsApiKey) {
      const directionsInstance = new window.mapgl.Directions(mapInstance, {
        directionsApiKey: directionsApiKey,
      });
      setDirections(directionsInstance);
    }

    // Функция для получения адреса по координатам
    const getAddressFromCoordinates = async (lat, lon) => {
      try {
        const apiKey = "8561492e-8262-40c5-85e7-a58c1c705168";
        const response = await fetch(
          `https://catalog.api.2gis.com/3.0/items/geocode?lat=${lat}&lon=${lon}&fields=items.point,items.address&key=${apiKey}`
        );
        const data = await response.json();

        if (data.result?.items?.length > 0) {
          const item = data.result.items[0];
          const address = item.address_name || item.full_name || "";
          const name = item.name || "";

          let displayAddress = address;
          if (name && name !== address) {
            displayAddress = name;
          }

          return {
            name: displayAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            address: address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          };
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }

      return {
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };
    };

    // Add click handler for selecting points
    mapInstance.on("click", async (e) => {
      const coords = e.lngLat;

      const { selectedPoints, preferences, removeSelectedPoint } =
        useRouteStore.getState();
      const maxPoints = preferences.maxWaypoints || 10;

      const clickThreshold = 0.0005; // примерно 50 метров
      const existingPointIndex = selectedPoints.findIndex((point) => {
        const latDiff = Math.abs(point.lat - coords[1]);
        const lonDiff = Math.abs(point.lon - coords[0]);
        return latDiff < clickThreshold && lonDiff < clickThreshold;
      });

      if (existingPointIndex !== -1) {
        removeSelectedPoint(existingPointIndex);

        const { markers, removeMarker } = useMapStore.getState();
        if (markers[existingPointIndex]) {
          markers[existingPointIndex].destroy();
          removeMarker(markers[existingPointIndex]);
        }
        return;
      }

      if (selectedPoints.length >= maxPoints) {
        alert(
          `Достигнут лимит точек (${maxPoints}). Измените "Максимум точек" в настройках или очистите маршрут.`
        );
        return;
      }

      const marker = new window.mapgl.Marker(mapInstance, {
        coordinates: coords,
        icon: "https://docs.2gis.com/img/dotMarker.svg",
      });

      addMarker(marker);

      const addressInfo = await getAddressFromCoordinates(coords[1], coords[0]);

      addSelectedPoint({
        lat: coords[1],
        lon: coords[0],
        name: addressInfo.name,
        address: addressInfo.address,
      });
    });

    // Cleanup
    return () => {
      prefersDark.removeEventListener("change", applyMapTheme);
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);

  // Draw route when selectedPoints change
  useEffect(() => {
    if (!map || !directions) return;

    directions.clear();

    if (selectedPoints.length >= 2) {
      const points = selectedPoints.map((p) => [p.lon, p.lat]);

      directions.pedestrianRoute({ points });
    } else if (selectedPoints.length === 0) {
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

    clearMarkers();

    const points = waypoints.map((wp) => [
      wp.coordinates.lon,
      wp.coordinates.lat,
    ]);

    directions.pedestrianRoute({ points });

    waypoints.forEach((waypoint, index) => {
      const marker = new window.mapgl.Marker(map, {
        coordinates: [waypoint.coordinates.lon, waypoint.coordinates.lat],
        label: {
          text: `${index + 1}`,
          color: "#ffffff",
          fontSize: 14,
        },
      });

      addMarker(marker);
    });

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
    <div className={`map-view ${audioUrl ? "audio-player-visible" : ""}`}>
      <div ref={mapContainerRef} className="map-container" />

      {selectedPoints.length > 0 && (
        <div className="map-info">
          <p>
            <span className="map-info-icon">📍</span>
            Точек: {selectedPoints.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
