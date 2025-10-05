import { useState } from 'react';
import MapView from './components/Map/MapView';
import Sidebar from './components/Sidebar/Sidebar';
import AudioPlayer from './components/AudioPlayer/AudioPlayer';
import PointsPanel from './components/PointsPanel/PointsPanel';
import { useRouteStore } from './store/routeStore';
import './App.css';

import { useTheme } from './hooks/useTheme';

function App() {
  useTheme();
  const { currentRoute, audioUrl } = useRouteStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <PointsPanel />

      <div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <MapView />

        {audioUrl && (
          <div className="audio-player-container">
            <AudioPlayer audioUrl={audioUrl} route={currentRoute} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
