import { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapStore } from '../../store/mapStore';
import { generateRoute, getRouteAudioUrl, checkRouteAudioStatus } from '../../api/routes';
import './Sidebar.css';
import { NARRATIVE_STYLES } from '../../enums/Narrative_styles';
import { EPOCHS } from '../../enums/Epochs';
import { INTERESTS } from '../../enums/Interests';

const Sidebar = ({ isOpen, onToggle }) => {
  const {
    preferences,
    setPreferences,
    selectedPoints,
    clearSelectedPoints,
    setCurrentRoute,
    setAudioUrl,
    setIsGenerating,
    setError,
    isGenerating,
    error,
  } = useRouteStore();

  const { clearMarkers, directions } = useMapStore();
  const [narrativeStyle, setNarrativeStyle] = useState('casual');

  const handleEpochToggle = (epoch) => {
    const epochs = preferences.epochs.includes(epoch)
      ? preferences.epochs.filter((e) => e !== epoch)
      : [...preferences.epochs, epoch];
    setPreferences({ epochs });
  };

  const handleInterestToggle = (interest) => {
    const interests = preferences.interests.includes(interest)
      ? preferences.interests.filter((i) => i !== interest)
      : [...preferences.interests, interest];
    setPreferences({ interests });
  };

  const handleGenerateRoute = async () => {
    if (selectedPoints.length === 0) {
      setError('Выберите хотя бы одну точку на карте');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Получаем названия мест для каждой точки через reverse geocoding
      const customPOIs = await Promise.all(
        selectedPoints.map(async (point, index) => {
          const address = await getAddressFromCoordinates(point.lat, point.lon);
          return {
            name: address.name || `Точка ${index + 1}`,
            description:
              address.full || `Координаты: ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`,
            latitude: point.lat,
            longitude: point.lon,
            epoch: preferences.epochs[0] || 'modern',
            category: preferences.interests[0] || 'architecture',
          };
        })
      );

      const routeRequest = {
        start_point: selectedPoints[0],
        duration_minutes: preferences.durationMinutes,
        epochs: preferences.epochs,
        interests: preferences.interests,
        max_waypoints: preferences.maxWaypoints,
        custom_pois: customPOIs,
      };

      console.log('Generating route with custom POIs:', routeRequest);
      const route = await generateRoute(routeRequest);
      setCurrentRoute(route);

      // Poll for audio availability
      pollForAudio(route.route_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при генерации маршрута');
      setIsGenerating(false);
    }
  };

  // Получить адрес по координатам через 2GIS API
  const getAddressFromCoordinates = async (lat, lon) => {
    try {
      const apiKey = '8561492e-8262-40c5-85e7-a58c1c705168';
      const response = await fetch(
        `https://catalog.api.2gis.com/3.0/items/geocode?lat=${lat}&lon=${lon}&fields=items.point,items.address&key=${apiKey}`
      );
      const data = await response.json();

      if (data.result?.items?.length > 0) {
        const item = data.result.items[0];
        const address = item.address_name || item.name || '';
        const building = item.building_name || '';

        return {
          name: item.name || address || 'Неизвестное место',
          full:
            [address, building].filter(Boolean).join(', ') ||
            `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        };
      }

      return {
        name: 'Неизвестное место',
        full: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        name: 'Неизвестное место',
        full: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };
    }
  };

  const pollForAudio = async (routeId, attempts = 0) => {
    const maxAttempts = 60; // 5 minutes with 5 second intervals

    if (attempts >= maxAttempts) {
      setError('Превышено время ожидания генерации аудио');
      setIsGenerating(false);
      return;
    }

    try {
      const status = await checkRouteAudioStatus(routeId);

      if (status.ready) {
        setAudioUrl(getRouteAudioUrl(routeId));
        setIsGenerating(false);
      } else {
        // Wait 5 seconds and try again
        setTimeout(() => pollForAudio(routeId, attempts + 1), 5000);
      }
    } catch (err) {
      console.error('Error checking audio status:', err);
      setTimeout(() => pollForAudio(routeId, attempts + 1), 5000);
    }
  };

  const handleClearRoute = () => {
    clearSelectedPoints();
    clearMarkers();
    setCurrentRoute(null);
    setAudioUrl(null);
    setError(null);

    if (directions) {
      directions.clear();
    }
  };

  return (
    <>
      {/* Кнопка открытия когда sidebar закрыт */}
      {!isOpen && (
        <button className="sidebar-open-btn" onClick={onToggle}>
          <span className="menu-icon">☰</span>
        </button>
      )}

      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Аудиогид</h1>
          <button className="toggle-btn" onClick={onToggle}>
            {isOpen ? '←' : '→'}
          </button>
        </div>

        {isOpen && (
          <div className="sidebar-content">
            <section className="sidebar-section">
              <h2 className="section-title">Параметры маршрута</h2>

              <div className="form-group">
                <label>Максимум точек</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={preferences.maxWaypoints}
                  onChange={(e) => setPreferences({ maxWaypoints: parseInt(e.target.value) })}
                />
              </div>
            </section>

            <section className="sidebar-section">
              <h2 className="section-title">Эпохи</h2>
              <div className="checkbox-group">
                {EPOCHS.map((epoch) => (
                  <label key={epoch.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.epochs.includes(epoch.value)}
                      onChange={() => handleEpochToggle(epoch.value)}
                    />
                    <span>{epoch.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="sidebar-section">
              <h2 className="section-title">Интересы</h2>
              <div className="checkbox-group">
                {INTERESTS.map((interest) => (
                  <label key={interest.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.interests.includes(interest.value)}
                      onChange={() => handleInterestToggle(interest.value)}
                    />
                    <span>{interest.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="sidebar-section">
              <h2 className="section-title">Стиль рассказа</h2>
              <select
                value={narrativeStyle}
                onChange={(e) => setNarrativeStyle(e.target.value)}
                className="select-input"
              >
                {NARRATIVE_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </section>

            {error && <div className="error-message">{error}</div>}

            <div className="sidebar-actions">
              <button
                className="btn btn-primary"
                onClick={handleGenerateRoute}
                disabled={isGenerating || selectedPoints.length === 0}
              >
                {isGenerating ? 'Генерация...' : 'Построить маршрут'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleClearRoute}
                disabled={isGenerating}
              >
                Очистить
              </button>
            </div>

            <div className="sidebar-info">
              <p className="info-text">
                Выбрано точек: <strong>{selectedPoints.length}</strong>
              </p>
              <p className="info-hint">Кликните на карту, чтобы добавить точки маршрута</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
    </>
  );
};

export default Sidebar;
