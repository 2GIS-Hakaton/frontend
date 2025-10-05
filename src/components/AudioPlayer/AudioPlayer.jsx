// src/components/AudioPlayer/AudioPlayer.jsx
import { useState } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { useAudioSync } from '../../hooks/useAudioSync';
import './AudioPlayer.css';

// SVG Icons
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>
);

const VolumeHighIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const VolumeMediumIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
);

const VolumeMutedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);

const SkipBackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1.5 13.5v-7l-3 3.5 3 3.5zm4.5-3.5l-3-3.5v7l3-3.5z" opacity="0.3"/>
    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    <text x="12" y="15.5" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">5</text>
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1.5 13.5v-7l-3 3.5 3 3.5zm4.5-3.5l-3-3.5v7l3-3.5z" opacity="0.3"/>
    <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
    <text x="12" y="15.5" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">5</text>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
);

const AudioPlayer = ({ audioUrl, route }) => {
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    togglePlay,
    skip,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    changePlaybackRate,
  } = useAudio(audioUrl);

  useAudioSync(isPlaying, currentTime, duration);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentWaypoint = () => {
    if (!route?.waypoints) return null;
    const progress = duration ? currentTime / duration : 0;
    const waypointIndex = Math.floor(progress * route.waypoints.length);
    return route.waypoints[Math.min(waypointIndex, route.waypoints.length - 1)];
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${route?.name || 'audio-guide'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentWaypoint = getCurrentWaypoint();

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="player-content">
        {currentWaypoint && (
          <div className="waypoint-info">
            <div className="waypoint-name">{currentWaypoint.name}</div>
            <div className="waypoint-description">{currentWaypoint.description}</div>
          </div>
        )}

        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            step="0.1"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        <div className="player-controls">
          <div className="controls-left">
            <div className="volume-control">
              <button
                className="control-btn volume-btn"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                {isMuted || volume === 0 ? <VolumeMutedIcon /> : volume < 0.5 ? <VolumeMediumIcon /> : <VolumeHighIcon />}
              </button>
              {showVolumeSlider && (
                <div
                  className="volume-slider-container"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="speed-control">
              <button
                className="control-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="speed-menu">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                      onClick={() => {
                        changePlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="controls-center">
            <button className="control-btn skip-btn" onClick={() => skip(-5)} title="Назад 5 секунд">
              <SkipBackIcon />
            </button>
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="control-btn skip-btn" onClick={() => skip(5)} title="Вперед 5 секунд">
              <SkipForwardIcon />
            </button>
          </div>

          <div className="controls-right">
            {route && (
              <>
                <div className="route-info">
                  <span className="route-name">{route.name}</span>
                </div>
                <button 
                  className="control-btn download-btn" 
                  onClick={handleDownloadAudio}
                  title="Скачать аудиофайл"
                >
                  <DownloadIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
