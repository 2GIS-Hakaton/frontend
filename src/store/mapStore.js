import { create } from 'zustand';

export const useMapStore = create((set) => ({
  // Map instance
  map: null,
  directions: null,
  
  // Map state
  center: [37.6173, 55.7558], // Moscow center [lon, lat]
  zoom: 12,
  
  // Markers
  markers: [],
  
  // Actions
  setMap: (map) => set({ map }),
  
  setDirections: (directions) => set({ directions }),
  
  setCenter: (center) => set({ center }),
  
  setZoom: (zoom) => set({ zoom }),
  
  addMarker: (marker) => set((state) => ({
    markers: [...state.markers, marker],
  })),
  
  removeMarker: (marker) => set((state) => ({
    markers: state.markers.filter((m) => m !== marker),
  })),
  
  clearMarkers: () => {
    const { markers } = useMapStore.getState();
    markers.forEach((marker) => {
      if (marker && marker.destroy) {
        marker.destroy();
      }
    });
    set({ markers: [] });
  },
}));
