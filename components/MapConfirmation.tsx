'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapConfirmationProps } from '@/types';

export default function MapConfirmation({
  lat,
  lng,
  address,
  onConfirm,
}: MapConfirmationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  const initMap = useCallback(async () => {
    if (!mapRef.current || !window.google?.maps) return;

    const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

    const map = new Map(mapRef.current, {
      center: { lat, lng },
      zoom: 19,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      mapId: 'roof-check-map', // Required for AdvancedMarkerElement
    });

    mapInstanceRef.current = map;

    // Create custom marker element
    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
      <div class="relative">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs font-medium text-slate-700 whitespace-nowrap">
          Drag to adjust
        </div>
        <div class="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      map,
      position: { lat, lng },
      content: markerContent,
      gmpDraggable: true,
      title: 'Drag to adjust location',
    });

    marker.addListener('dragend', () => {
      const position = marker.position;
      if (position) {
        const newLat = typeof position.lat === 'function' ? position.lat() : position.lat;
        const newLng = typeof position.lng === 'function' ? position.lng() : position.lng;
        setCurrentLat(newLat);
        setCurrentLng(newLng);
      }
    });

    markerRef.current = marker;
    setIsLoaded(true);
  }, [lat, lng]);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      initMap();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [initMap]);

  const handleConfirm = () => {
    onConfirm(currentLat, currentLng);
  };

  const hasLocationChanged = currentLat !== lat || currentLng !== lng;

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg border border-slate-200"
        />
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-500">Loading map...</span>
            </div>
          </div>
        )}
      </div>

      {/* Address display */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-900">{address}</p>
            {hasLocationChanged && (
              <p className="text-sm text-amber-600 mt-1">
                Location adjusted from original address
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!isLoaded}
        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white
                   font-semibold rounded-xl shadow-lg shadow-emerald-500/25
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        Yes, this is my home
      </button>

      <p className="text-center text-sm text-slate-500">
        Drag the marker to fine-tune the location if needed
      </p>
    </div>
  );
}
