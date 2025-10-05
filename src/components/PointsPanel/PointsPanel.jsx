import { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapStore } from '../../store/mapStore';
import { optimizeRouteAdvanced } from '../../utils/routeOptimizer';
import './PointsPanel.css';

const PointsPanel = () => {
  const { selectedPoints, removeSelectedPoint, reorderSelectedPoints } = useRouteStore();
  const { markers, removeMarker, clearMarkers } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleRemovePoint = (index) => {
    removeSelectedPoint(index);
    
    if (markers[index]) {
      markers[index].destroy();
      removeMarker(markers[index]);
    }
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
          <div className="points-panel-actions">
            <p className="points-panel-hint">Перетащите точки для изменения порядка</p>
            {selectedPoints.length >= 3 && (
              <button
                className="optimize-route-btn"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing}
                title="Найти оптимальный порядок точек для кратчайшего маршрута"
              >
                {isOptimizing ? '⏳ Оптимизация...' : '🎯 Оптимизировать'}
              </button>
            )}
          </div>
          
          <div className="points-panel-list">
            {selectedPoints.map((point, index) => {
              // Определяем метку точки: A для первой, B для последней, цифры для остальных
              const getPointLabel = () => {
                if (selectedPoints.length === 1) return 'A';
                if (index === 0) return 'A';
                if (index === selectedPoints.length - 1) return 'B';
                return index.toString();
              };

              return (
                <div
                  key={index}
                  className={`points-panel-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <span className="drag-handle" title="Перетащите для изменения порядка">
                    ⋮⋮
                  </span>
                  <span className="point-number">{getPointLabel()}</span>
                <div className="point-info">
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
                  title="Удалить точку"
                >
                  ✕
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="points-panel-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default PointsPanel;
