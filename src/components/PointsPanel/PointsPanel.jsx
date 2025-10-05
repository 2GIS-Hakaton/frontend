import { useState, useEffect } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapStore } from '../../store/mapStore';
import { optimizeRouteAdvanced } from '../../utils/routeOptimizer';
import { formatDistance } from '../../utils/formatters';
import { canAddPOI, calculateRequiredSlots } from '../../utils/poiInsertion';
import { POI_CATEGORIES } from '../../enums/POICategories';
import './PointsPanel.css';

const PointsPanel = () => {
  const { 
    selectedPoints, 
    removeSelectedPoint, 
    reorderSelectedPoints,
    preferences,
    setPreferences,
    routePOIs,
    setRoutePOIs,
    isLoadingPOIs,
    routeStats,
    isGenerating,
  } = useRouteStore();
  const { markers, removeMarker, clearMarkers, map } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPOIDialog, setShowPOIDialog] = useState(false);
  const [poiInsertionInfo, setPOIInsertionInfo] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedPointInfo, setSelectedPointInfo] = useState(null);
  const [allFoundPOIs, setAllFoundPOIs] = useState([]);

  // Сохраняем все найденные POI при их загрузке
  useEffect(() => {
    if (!isLoadingPOIs && routePOIs.length > 0 && allFoundPOIs.length === 0) {
      setAllFoundPOIs(routePOIs);
    }
  }, [routePOIs, isLoadingPOIs, allFoundPOIs.length]);

  // Сбрасываем найденные POI при выключении
  useEffect(() => {
    if (!preferences.includePOIs) {
      setAllFoundPOIs([]);
    }
  }, [preferences.includePOIs]);

  const handleRemovePoint = (index) => {
    removeSelectedPoint(index);
    
    if (markers[index]) {
      markers[index].destroy();
      removeMarker(markers[index]);
    }
  };

  const handleTogglePOI = (poi) => {
    if (isGenerating) return;

    const existingIndex = selectedPoints.findIndex(
      point => point.lat === poi.lat && point.lon === poi.lon
    );

    if (existingIndex !== -1) {
      // POI уже добавлена - удаляем
      removeSelectedPoint(existingIndex);
      if (markers[existingIndex]) {
        markers[existingIndex].destroy();
        removeMarker(markers[existingIndex]);
      }
    } else {
      // Добавляем POI как обычную точку на карту
      const newPoint = {
        lat: poi.lat,
        lon: poi.lon,
        name: poi.name,
        address: poi.name,
        description: poi.description,
        category: poi.category,
        isPOI: true,
        rubricId: poi.rubricId,
      };

      useRouteStore.setState({ 
        selectedPoints: [...selectedPoints, newPoint] 
      });

      // Добавляем маркер на карту
      if (map) {
        const marker = new window.mapgl.Marker(map, {
          coordinates: [poi.lon, poi.lat],
          icon: 'https://docs.2gis.com/img/dotMarker.svg',
        });
        useMapStore.getState().addMarker(marker);
      }
    }
  };

  const handlePointClick = (point, index) => {
    setSelectedPointInfo({
      ...point,
      index,
      label: getPointLabel(index),
    });
  };

  const getPointLabel = (index) => {
    if (selectedPoints.length === 1) return 'A';
    if (index === 0) return 'A';
    if (index === selectedPoints.length - 1) return 'B';
    return index.toString();
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    reorderSelectedPoints(draggedIndex, dropIndex);
    
    const newMarkers = [...markers];
    const [movedMarker] = newMarkers.splice(draggedIndex, 1);
    newMarkers.splice(dropIndex, 0, movedMarker);
    
    clearMarkers();
    newMarkers.forEach(marker => {
      if (marker) {
        useMapStore.getState().addMarker(marker);
      }
    });
  };

  const handleOptimizeRoute = () => {
    if (selectedPoints.length < 3) {
      alert('Для оптимизации нужно минимум 3 точки');
      return;
    }

    setIsOptimizing(true);

    // Небольшая задержка для UI feedback
    setTimeout(() => {
      // Оптимизируем маршрут
      const optimizedPoints = optimizeRouteAdvanced(selectedPoints);
      
      // Обновляем порядок точек в store
      useRouteStore.setState({ selectedPoints: optimizedPoints });
      
      // Переупорядочиваем маркеры
      const newMarkers = optimizedPoints.map((point) => {
        const originalIndex = selectedPoints.findIndex(
          p => p.lat === point.lat && p.lon === point.lon
        );
        return markers[originalIndex];
      });
      
      clearMarkers();
      newMarkers.forEach(marker => {
        if (marker) {
          useMapStore.getState().addMarker(marker);
        }
      });

      setIsOptimizing(false);
    }, 300);
  };

  const handleCategoryToggle = (categoryValue) => {
    const currentCategories = preferences.poiCategories || [];
    const newCategories = currentCategories.includes(categoryValue)
      ? currentCategories.filter(c => c !== categoryValue)
      : [...currentCategories, categoryValue];
    
    setPreferences({ poiCategories: newCategories });
  };

  const handleTogglePOIs = () => {
    const newValue = !preferences.includePOIs;
    
    if (newValue) {
      // Включаем достопримечательности
      if (selectedPoints.length < 2) {
        alert('Добавьте минимум 2 точки на карту для поиска достопримечательностей');
        return;
      }
      
      // Показываем селектор категорий
      setShowCategorySelector(true);
    } else {
      // Выключаем достопримечательности - удаляем их из маршрута
      removePOIsFromRoute();
      setPreferences({ includePOIs: false });
      setShowCategorySelector(false);
    }
  };

  const handleConfirmCategories = () => {
    // Просто подтверждаем выбор категорий
    setPreferences({ includePOIs: true });
    
    // Закрываем селектор
    setShowCategorySelector(false);
  };

  const removePOIsFromRoute = () => {
    // Удаляем все POI из selectedPoints и с карты
    const poisToRemove = selectedPoints
      .map((point, index) => ({ point, index }))
      .filter(({ point }) => point.isPOI);
    
    poisToRemove.reverse().forEach(({ index }) => {
      if (markers[index]) {
        markers[index].destroy();
        removeMarker(markers[index]);
      }
      removeSelectedPoint(index);
    });
    
    // Очищаем список найденных POI
    setAllFoundPOIs([]);
    setRoutePOIs([]);
  };

  const handleConfirmPOIInsertion = () => {
    if (poiInsertionInfo?.type === 'no-slots') {
      // Увеличиваем лимит
      const newMax = poiInsertionInfo.requiredSlots;
      setPreferences({ maxWaypoints: newMax, includePOIs: true });
    } else if (poiInsertionInfo?.type === 'partial') {
      // Просто подтверждаем
      setPreferences({ includePOIs: true });
    }
    
    setShowPOIDialog(false);
    setPOIInsertionInfo(null);
  };

  const handleCancelPOIInsertion = () => {
    setShowPOIDialog(false);
    setPOIInsertionInfo(null);
  };

  if (selectedPoints.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating button to open panel */}
      {!isOpen && (
        <button className="points-panel-toggle" onClick={() => setIsOpen(true)}>
          <span className="points-count">{selectedPoints.length}</span>
          <span className="toggle-icon">📍</span>
        </button>
      )}

      {/* Panel */}
      <div className={`points-panel ${isOpen ? 'open' : 'closed'}`}>
        <div className="points-panel-header">
          <h3 className="points-panel-title">
            Точки маршрута ({selectedPoints.length})
          </h3>
          <button className="points-panel-close" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div className="points-panel-content">
          {/* Статистика маршрута */}
          {selectedPoints.length >= 2 && (
            <div className="route-stats-panel">
              <div className="stat-item-panel">
                <span className="stat-icon">📏</span>
                <div className="stat-info">
                  <span className="stat-label">Расстояние</span>
                  <span className="stat-value">{formatDistance(routeStats.distance)}</span>
                </div>
              </div>
              <div className="stat-item-panel">
                <span className="stat-icon">⏱️</span>
                <div className="stat-info">
                  <span className="stat-label">Время</span>
                  <span className="stat-value">
                    {routeStats.duration < 60 
                      ? `${routeStats.duration} мин`
                      : `${Math.floor(routeStats.duration / 60)} ч ${routeStats.duration % 60} мин`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Кнопка достопримечательностей */}
          <div className="poi-toggle-container">
            <button 
              className={`poi-toggle-btn ${preferences.includePOIs ? 'active' : ''}`}
              onClick={handleTogglePOIs}
              disabled={isLoadingPOIs || selectedPoints.length < 2 || isGenerating}
            >
              <span className="poi-icon">🏛️</span>
              <div className="poi-info">
                <span className="poi-label">Достопримечательности</span>
                {selectedPoints.length < 2 && (
                  <span className="poi-status">Добавьте минимум 2 точки</span>
                )}
                {selectedPoints.length >= 2 && isLoadingPOIs && (
                  <span className="poi-status loading">Загрузка...</span>
                )}
                {selectedPoints.length >= 2 && !isLoadingPOIs && preferences.includePOIs && routePOIs.length > 0 && (
                  <span className="poi-status">Найдено: {routePOIs.length}</span>
                )}
                {selectedPoints.length >= 2 && !isLoadingPOIs && preferences.includePOIs && routePOIs.length === 0 && (
                  <span className="poi-status">Не найдено</span>
                )}
                {selectedPoints.length >= 2 && !isLoadingPOIs && !preferences.includePOIs && (
                  <span className="poi-status">Нажмите для поиска</span>
                )}
              </div>
              <span className="poi-toggle-indicator">
                {preferences.includePOIs ? '✓' : ''}
              </span>
            </button>
          </div>

          <div className="points-panel-actions">
            {!isGenerating && <p className="points-panel-hint">Перетащите точки для изменения порядка</p>}
            {isGenerating && <p className="points-panel-hint generating">⏳ Генерация маршрута... Редактирование недоступно</p>}
            {selectedPoints.length >= 3 && !isGenerating && (
              <button
                className="optimize-route-btn"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || isGenerating}
                title="Найти оптимальный порядок точек для кратчайшего маршрута"
              >
                {isOptimizing ? '⏳ Оптимизация...' : '🎯 Оптимизировать'}
              </button>
            )}
          </div>
          
          <div className="points-panel-list">
            {selectedPoints.map((point, index) => {
              const pointLabel = getPointLabel(index);

              return (
                <div
                  key={index}
                  className={`points-panel-item ${draggedIndex === index ? 'dragging' : ''} ${isGenerating ? 'disabled' : ''}`}
                  draggable={!isGenerating}
                  onDragStart={(e) => !isGenerating && handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => !isGenerating && handleDragOver(e)}
                  onDrop={(e) => !isGenerating && handleDrop(e, index)}
                >
                  <span className="drag-handle" title={isGenerating ? 'Недоступно во время генерации' : 'Перетащите для изменения порядка'}>
                    ⋮⋮
                  </span>
                  <span className="point-number">{pointLabel}</span>
                  <div 
                    className="point-info"
                    onClick={() => !isGenerating && handlePointClick(point, index)}
                    style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="point-name">
                      {point.address || point.name || 'Загрузка адреса...'}
                    </span>
                    <span className="point-coords">
                      {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                    </span>
                  </div>
                  <button
                    className="point-remove-btn"
                    onClick={() => handleRemovePoint(index)}
                    disabled={isGenerating}
                    title={isGenerating ? 'Недоступно во время генерации' : 'Удалить точку'}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Список найденных POI для добавления на карту */}
          {allFoundPOIs && allFoundPOIs.length > 0 && (
            <div className="pois-section">
              <h3 className="pois-section-title">
                🏛️ Найденные достопримечательности ({allFoundPOIs.length})
              </h3>
              <p className="pois-section-hint">Выберите достопримечательности для добавления на карту</p>
              <div className="pois-list">
                {allFoundPOIs.map((poi, index) => {
                  const isSelected = selectedPoints.some(
                    point => point.lat === poi.lat && point.lon === poi.lon
                  );
                  return (
                    <div 
                      key={index} 
                      className={`poi-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleTogglePOI(poi)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePOI(poi)}
                        onClick={(e) => e.stopPropagation()}
                        className="poi-checkbox"
                      />
                      <span className="poi-icon">📍</span>
                      <div className="poi-details">
                        <span className="poi-name">{poi.name}</span>
                        <span className="poi-category">{poi.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="points-panel-overlay" onClick={() => setIsOpen(false)} />}

      {/* Информационный бабл для точки */}
      {selectedPointInfo && (
        <div className="point-info-overlay" onClick={() => setSelectedPointInfo(null)}>
          <div className="point-info-bubble" onClick={(e) => e.stopPropagation()}>
            <div className="bubble-header">
              <div className="bubble-label">{selectedPointInfo.label}</div>
              <button className="bubble-close" onClick={() => setSelectedPointInfo(null)}>✕</button>
            </div>
            
            <div className="bubble-content">
              <div className="bubble-section">
                <h3 className="bubble-title">
                  {selectedPointInfo.isPOI && <span className="poi-badge">🏛️ Достопримечательность</span>}
                  {selectedPointInfo.address || selectedPointInfo.name || 'Точка на карте'}
                </h3>
              </div>

              {selectedPointInfo.name && selectedPointInfo.address && selectedPointInfo.name !== selectedPointInfo.address && (
                <div className="bubble-section">
                  <label className="bubble-label-text">Название:</label>
                  <p className="bubble-text selectable">{selectedPointInfo.name}</p>
                </div>
              )}

              <div className="bubble-section">
                <label className="bubble-label-text">Координаты:</label>
                <p className="bubble-text selectable">
                  {selectedPointInfo.lat.toFixed(6)}, {selectedPointInfo.lon.toFixed(6)}
                </p>
              </div>

              {selectedPointInfo.category && (
                <div className="bubble-section">
                  <label className="bubble-label-text">Категория:</label>
                  <p className="bubble-text">{selectedPointInfo.category}</p>
                </div>
              )}

              {selectedPointInfo.description && selectedPointInfo.description !== selectedPointInfo.address && (
                <div className="bubble-section">
                  <label className="bubble-label-text">Описание:</label>
                  <p className="bubble-text selectable">{selectedPointInfo.description}</p>
                </div>
              )}

              <div className="bubble-section">
                <label className="bubble-label-text">Позиция в маршруте:</label>
                <p className="bubble-text">
                  {selectedPointInfo.index === 0 && 'Начальная точка'}
                  {selectedPointInfo.index === selectedPoints.length - 1 && selectedPointInfo.index !== 0 && 'Конечная точка'}
                  {selectedPointInfo.index !== 0 && selectedPointInfo.index !== selectedPoints.length - 1 && `Промежуточная точка ${selectedPointInfo.index}`}
                </p>
              </div>
            </div>

            <div className="bubble-footer">
              <p className="bubble-hint">💡 Нажмите вне окна, чтобы закрыть</p>
            </div>
          </div>
        </div>
      )}

      {/* Селектор категорий достопримечательностей */}
      {showCategorySelector && (
        <div className="poi-dialog-overlay" onClick={() => setShowCategorySelector(false)}>
          <div className="poi-dialog category-selector" onClick={(e) => e.stopPropagation()}>
            <div className="poi-dialog-header">
              <h3>Выберите категории</h3>
              <button className="poi-dialog-close" onClick={() => setShowCategorySelector(false)}>✕</button>
            </div>
            <div className="poi-dialog-content">
              <div className="category-header">
                <p className="category-hint">Выберите категории достопримечательностей для поиска:</p>
              </div>
              <div className="category-list">
                {POI_CATEGORIES.map(category => {
                  const isSelected = preferences.poiCategories?.includes(category.value) || false;
                  
                  return (
                    <div key={category.value} className={`category-item ${isSelected ? 'selected' : ''}`}>
                      <label className="category-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryToggle(category.value)}
                        />
                        <span className="category-icon">{category.icon}</span>
                        <div className="category-info">
                          <span className="category-label">{category.label}</span>
                          <span className="category-description">{category.description}</span>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
              
              {preferences.poiCategories?.length === 0 && (
                <div className="category-summary">
                  <p className="category-warning">
                    ℹ️ Категории не выбраны - будут искаться все типы достопримечательностей
                  </p>
                </div>
              )}
            </div>
            <div className="poi-dialog-actions">
              <button className="poi-dialog-btn poi-dialog-btn-cancel" onClick={() => setShowCategorySelector(false)}>
                Отмена
              </button>
              <button className="poi-dialog-btn poi-dialog-btn-confirm" onClick={handleConfirmCategories}>
                Искать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог для подтверждения добавления достопримечательностей */}
      {showPOIDialog && (
        <div className="poi-dialog-overlay" onClick={handleCancelPOIInsertion}>
          <div className="poi-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="poi-dialog-header">
              <h3>Добавление достопримечательностей</h3>
              <button className="poi-dialog-close" onClick={handleCancelPOIInsertion}>✕</button>
            </div>
            <div className="poi-dialog-content">
              {poiInsertionInfo?.type === 'no-slots' && (
                <>
                  <p className="poi-dialog-message">
                    ⚠️ Нет свободных слотов для добавления достопримечательностей.
                  </p>
                  <p className="poi-dialog-info">
                    Текущий лимит: <strong>{poiInsertionInfo.currentMax} точек</strong>
                  </p>
                  <p className="poi-dialog-suggestion">
                    Хотите добавить 1 достопримечательность и автоматически увеличить лимит до {poiInsertionInfo.requiredSlots} точек?
                  </p>
                </>
              )}
              {poiInsertionInfo?.type === 'partial' && (
                <>
                  <p className="poi-dialog-message">
                    ℹ️ Найдено {poiInsertionInfo.totalPOIs} достопримечательностей, но свободно только {poiInsertionInfo.availableSlots} слотов.
                  </p>
                  <p className="poi-dialog-suggestion">
                    Будут добавлены {poiInsertionInfo.availableSlots} ближайших к маршруту достопримечательностей.
                  </p>
                </>
              )}
            </div>
            <div className="poi-dialog-actions">
              <button className="poi-dialog-btn poi-dialog-btn-cancel" onClick={handleCancelPOIInsertion}>
                Отмена
              </button>
              <button className="poi-dialog-btn poi-dialog-btn-confirm" onClick={handleConfirmPOIInsertion}>
                {poiInsertionInfo?.type === 'no-slots' ? 'Увеличить лимит' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PointsPanel;
