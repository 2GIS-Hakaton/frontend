// src/components/AudioPlayer/AudioPlayer.jsx
import { useState } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { useAudioSync } from '../../hooks/useAudioSync';
import './AudioPlayer.css';

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
                className="control-btn"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
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
            <button className="control-btn" onClick={() => skip(-5)}>
              ⏪ 5s
            </button>
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={() => skip(5)}>
              5s ⏩
            </button>
          </div>

          <div className="controls-right">
            {route && (
              <div className="route-info">
                <span className="route-name">{route.name}</span>
                <span className="route-distance">
                  {(route.total_distance / 1000).toFixed(1)} км
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
