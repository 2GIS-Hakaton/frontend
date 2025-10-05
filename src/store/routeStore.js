import { create } from 'zustand';

export const useRouteStore = create((set, get) => ({
  // Current route data
  currentRoute: null,
  audioUrl: null,
  isGenerating: false,
  error: null,
  
  // Selected waypoints on map
  selectedPoints: [],
  
  // Route preferences
  preferences: {
    durationMinutes: 60,
    epochs: [],
    interests: [],
    maxWaypoints: 5,
  },
  
  // Audio playback state
  audioState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentWaypointIndex: 0,
  },
  
  // Actions
  setCurrentRoute: (route) => set({ currentRoute: route }),
  
  setAudioUrl: (url) => set({ audioUrl: url }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setError: (error) => set({ error }),
  
  addSelectedPoint: (point) => {
    const { selectedPoints } = get();
    set({ selectedPoints: [...selectedPoints, point] });
  },
  
  removeSelectedPoint: (index) => {
    const { selectedPoints } = get();
    set({ selectedPoints: selectedPoints.filter((_, i) => i !== index) });
  },
  
  clearSelectedPoints: () => set({ selectedPoints: [] }),
  
  setPreferences: (preferences) => {
    const current = get().preferences;
    set({ preferences: { ...current, ...preferences } });
  },
  
  setAudioState: (audioState) => {
    const current = get().audioState;
    set({ audioState: { ...current, ...audioState } });
  },
  
  reset: () => set({
    currentRoute: null,
    audioUrl: null,
    isGenerating: false,
    error: null,
    selectedPoints: [],
    audioState: {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      currentWaypointIndex: 0,
    },
  }),
}));
