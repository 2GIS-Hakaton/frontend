import {
  formatDistance,
  formatDuration,
  getEpochLabel,
  getCategoryLabel,
} from '../../utils/formatters';
import './RouteInfo.css';

const RouteInfo = ({ route, onClose }) => {
  if (!route) return null;

  return (
    <div className="route-info-panel">
      <div className="route-info-header">
        <h2>{route.name}</h2>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="route-info-content">
        <div className="route-stats">
          <div className="stat-item">
            <span className="stat-label">Расстояние</span>
            <span className="stat-value">{formatDistance(route.total_distance)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Длительность</span>
            <span className="stat-value">{formatDuration(route.estimated_duration)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Точек</span>
            <span className="stat-value">{route.waypoints?.length || 0}</span>
          </div>
        </div>

        <div className="waypoints-list">
          <h3>Точки маршрута</h3>
          {route.waypoints?.map((waypoint, index) => (
            <div key={waypoint.id} className="waypoint-item">
              <div className="waypoint-number">{index + 1}</div>
              <div className="waypoint-details">
                <h4>{waypoint.name}</h4>
                <p className="waypoint-desc">{waypoint.description}</p>
                <div className="waypoint-tags">
                  {waypoint.epoch && (
                    <span className="tag epoch-tag">{getEpochLabel(waypoint.epoch)}</span>
                  )}
                  {waypoint.category && (
                    <span className="tag category-tag">{getCategoryLabel(waypoint.category)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteInfo;
