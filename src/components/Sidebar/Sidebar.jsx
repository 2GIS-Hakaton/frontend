import { useState, useEffect } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapStore } from '../../store/mapStore';
import { generateRoute, getRouteAudioUrl, checkRouteAudioStatus } from '../../api/routes';
import AddressSearch from '../AddressSearch/AddressSearch';
import { findPOIsAlongRoute, calculateRouteDistance, estimateRouteTime } from '../../utils/poisSearch';
import { formatDistance } from '../../utils/formatters';
import { getSelectedRubricIds, getCategoriesForAPI } from '../../enums/POICategories';
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
    routePOIs,
    setRoutePOIs,
    setIsLoadingPOIs,
    isLoadingPOIs,
    routeStats,
    setRouteStats,
  } = useRouteStore();

  const { clearMarkers, directions } = useMapStore();
  const [narrativeStyle, setNarrativeStyle] = useState('casual');
  const [pollingTimeoutId, setPollingTimeoutId] = useState(null);

  // Загрузка достопримечательностей при изменении точек маршрута
  useEffect(() => {
    const loadPOIs = async () => {
      if (selectedPoints.length < 2) {
        setRoutePOIs([]);
        setRouteStats({ distance: 0, duration: 0 });
        return;
      }

      // Вычисляем статистику маршрута
      const distance = calculateRouteDistance(selectedPoints);
      const duration = estimateRouteTime(distance);
      setRouteStats({ distance, duration });

      // Загружаем достопримечательности, если включена опция
      if (preferences.includePOIs) {
        setIsLoadingPOIs(true);
        try {
          // Получаем ID рубрик из выбранных категорий
          const rubricIds = getSelectedRubricIds(preferences.poiCategories);
          const pois = await findPOIsAlongRoute(selectedPoints, 500, rubricIds);
          setRoutePOIs(pois);
        } catch (error) {
          console.error('Error loading POIs:', error);
        } finally {
          setIsLoadingPOIs(false);
        }
      } else {
        setRoutePOIs([]);
      }
    };

    loadPOIs();
  }, [selectedPoints, preferences.includePOIs, preferences.poiCategories]);

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

      // Добавляем достопримечательности, если они включены
      const allPOIs = preferences.includePOIs 
        ? [
            ...customPOIs,
            ...routePOIs.map(poi => ({
              name: poi.name,
              description: poi.description,
              latitude: poi.lat,
              longitude: poi.lon,
              epoch: preferences.epochs[0] || 'modern',
              category: poi.category,
              rubric_id: poi.rubricId, // Добавляем ID рубрики для AI
            }))
          ]
        : customPOIs;

      const routeRequest = {
        start_point: selectedPoints[0],
        duration_minutes: preferences.durationMinutes,
        epochs: preferences.epochs,
        interests: preferences.interests,
        max_waypoints: preferences.maxWaypoints,
        custom_pois: allPOIs,
        poi_categories: preferences.includePOIs ? getCategoriesForAPI(preferences.poiCategories) : [], // Категории для AI
      };

      console.log('Generating route with POIs:', routeRequest);
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
      const apiKey = 'ae73fc4c-e332-4564-81c8-ede0a597947e';
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
      setPollingTimeoutId(null);
      return;
    }

    try {
      const status = await checkRouteAudioStatus(routeId);

      if (status.ready) {
        setAudioUrl(getRouteAudioUrl(routeId));
        setIsGenerating(false);
        setPollingTimeoutId(null);
      } else {
        // Wait 5 seconds and try again
        const timeoutId = setTimeout(() => pollForAudio(routeId, attempts + 1), 5000);
        setPollingTimeoutId(timeoutId);
      }
    } catch (err) {
      console.error('Error checking audio status:', err);
      const timeoutId = setTimeout(() => pollForAudio(routeId, attempts + 1), 5000);
      setPollingTimeoutId(timeoutId);
    }
  };

  const handleCancelGeneration = () => {
    // Отменяем polling
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }
    
    // Сбрасываем состояние генерации
    setIsGenerating(false);
    setError('Генерация отменена');
  };

  const handleClearRoute = () => {
    // Если идет генерация, отменяем её
    if (isGenerating) {
      handleCancelGeneration();
      return;
    }

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
              <h2 className="section-title">Поиск адреса</h2>
              <AddressSearch />
            </section>

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

              {/* Статистика маршрута - всегда видна */}
              <div className="route-stats">
                <div className="stat-item">
                  <span className="stat-icon">📏</span>
                  <div className="stat-info">
                    <span className="stat-label">Расстояние</span>
                    <span className="stat-value">
                      {selectedPoints.length >= 2 
                        ? formatDistance(routeStats.distance)
                        : '—'
                      }
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⏱️</span>
                  <div className="stat-info">
                    <span className="stat-label">Время в пути</span>
                    <span className="stat-value">
                      {selectedPoints.length >= 2 
                        ? (routeStats.duration < 60 
                            ? `${routeStats.duration} мин`
                            : `${Math.floor(routeStats.duration / 60)} ч ${routeStats.duration % 60} мин`
                          )
                        : '—'
                      }
                    </span>
                  </div>
                </div>
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
                {isGenerating ? '⏳ Генерация...' : 'Построить маршрут'}
              </button>

              <button
                className={`btn ${isGenerating ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleClearRoute}
              >
                {isGenerating ? '⏹️ Отменить генерацию' : 'Очистить'}
              </button>
            </div>

            <div className="sidebar-info">
              <p className="info-text">
                Выбрано точек: <strong>{selectedPoints.length}</strong>
              </p>
              <p className="info-hint">Кликните на карту, чтобы добавить точки маршрута</p>
              <p className="info-hint">Повторный клик на точку удалит её</p>
              {selectedPoints.length > 0 && (
                <p className="info-hint">📍 Откройте панель точек справа для управления маршрутом</p>
              )}
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
