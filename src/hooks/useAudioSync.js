import { useEffect } from 'react';
import { useRouteStore } from '../store/routeStore';

export const useAudioSync = (isPlaying, currentTime, duration) => {
  const { setAudioState } = useRouteStore();

  useEffect(() => {
    setAudioState({ isPlaying, currentTime, duration });
  }, [isPlaying, currentTime, duration, setAudioState]);
};
