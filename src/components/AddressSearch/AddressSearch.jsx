import { useState, useEffect, useRef } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapStore } from '../../store/mapStore';
import './AddressSearch.css';

const AddressSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const { addSelectedPoint, selectedPoints, preferences } = useRouteStore();
  const { map, addMarker } = useMapStore();

  // Закрытие результатов при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск адресов через 2GIS API
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const apiKey = '8561492e-8262-40c5-85e7-a58c1c705168';
      // Используем центр карты для контекста поиска
      const center = map ? map.getCenter() : [37.6173, 55.7558];
      
      const response = await fetch(
        `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&lon=${center[0]}&lat=${center[1]}&radius=50000&fields=items.point,items.address&key=${apiKey}`
      );
      const data = await response.json();

      if (data.result?.items) {
        const results = data.result.items.map(item => ({
          id: item.id,
          name: item.name || 'Неизвестное место',
          address: item.address_name || item.full_name || '',
          lat: item.point?.lat,
          lon: item.point?.lon,
        })).filter(item => item.lat && item.lon);

        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchAddress(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectAddress = (result) => {
    const maxPoints = preferences.maxWaypoints || 10;
    
    if (selectedPoints.length >= maxPoints) {
      alert(`Достигнут лимит точек (${maxPoints}). Измените "Максимум точек" в настройках или очистите маршрут.`);
      return;
    }

    // Добавляем точку с адресом
    addSelectedPoint({
      lat: result.lat,
      lon: result.lon,
      name: result.name,
      address: result.address,
    });

    // Добавляем маркер на карту
    if (map) {
      const marker = new window.mapgl.Marker(map, {
        coordinates: [result.lon, result.lat],
        icon: 'https://docs.2gis.com/img/dotMarker.svg',
      });
      addMarker(marker);

      // Центрируем карту на новой точке
      map.setCenter([result.lon, result.lat]);
      map.setZoom(15);
    }

    // Очищаем поиск
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="address-search" ref={searchRef}>
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Поиск адреса или места..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        {isSearching && <span className="search-loader">⏳</span>}
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowResults(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => handleSelectAddress(result)}
            >
              <div className="result-icon">📍</div>
              <div className="result-info">
                <div className="result-name">{result.name}</div>
                {result.address && (
                  <div className="result-address">{result.address}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="search-results">
          <div className="search-no-results">
            Ничего не найдено
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
