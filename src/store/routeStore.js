import { create } from 'zustand';

export const useRouteStore = create((set, get) => ({
  // Current route data
  currentRoute: null,
  audioUrl: null,
  isGenerating: false,
  error: null,
  
  // Selected waypoints on map
  selectedPoints: [],
  
  // POIs (достопримечательности) along the route
  routePOIs: [],
  isLoadingPOIs: false,
  
  // Route statistics
  routeStats: {
    distance: 0, // в метрах
    duration: 0, // в минутах
  },
  
  // Route preferences
  preferences: {
    durationMinutes: 60,
    epochs: [],
    interests: [],
    maxWaypoints: 5,
    includePOIs: false, // Включать ли достопримечательности
    poiCategories: [], // Выбранные категории достопримечательностей
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
  
  reorderSelectedPoints: (fromIndex, toIndex) => {
    const { selectedPoints } = get();
    const newPoints = [...selectedPoints];
    const [movedPoint] = newPoints.splice(fromIndex, 1);
    newPoints.splice(toIndex, 0, movedPoint);
    set({ selectedPoints: newPoints });
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
  
  setRoutePOIs: (pois) => set({ routePOIs: pois }),
  
  setIsLoadingPOIs: (isLoading) => set({ isLoadingPOIs: isLoading }),
  
  setRouteStats: (stats) => {
    const current = get().routeStats;
    set({ routeStats: { ...current, ...stats } });
  },
  
  reset: () => set({
    currentRoute: null,
    audioUrl: null,
    isGenerating: false,
    error: null,
    selectedPoints: [],
    routePOIs: [],
    isLoadingPOIs: false,
    routeStats: {
      distance: 0,
      duration: 0,
    },
    audioState: {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      currentWaypointIndex: 0,
    },
  }),
}));
