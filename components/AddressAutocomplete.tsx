'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AddressAutocompleteProps, LocationData } from '@/types';

export default function AddressAutocomplete({
  onSelect,
  defaultValue = '',
  placeholder = 'Enter your address...',
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Parse address components from Place result
  const parseAddressComponents = useCallback(
    (place: google.maps.places.PlaceResult): LocationData | null => {
      if (!place.geometry?.location || !place.address_components) {
        return null;
      }

      const getComponent = (type: string): string => {
        const component = place.address_components?.find((c) =>
          c.types.includes(type)
        );
        return component?.long_name || component?.short_name || '';
      };

      const getShortComponent = (type: string): string => {
        const component = place.address_components?.find((c) =>
          c.types.includes(type)
        );
        return component?.short_name || '';
      };

      const streetNumber = getComponent('street_number');
      const route = getComponent('route');
      const city =
        getComponent('locality') ||
        getComponent('sublocality') ||
        getComponent('administrative_area_level_2');
      const state = getShortComponent('administrative_area_level_1');
      const postalCode = getComponent('postal_code');

      const addressLine1 = [streetNumber, route].filter(Boolean).join(' ');

      return {
        addressLine1,
        city,
        state,
        postalCode,
        fullAddress: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id,
      };
    },
    []
  );

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: [
            'address_components',
            'formatted_address',
            'geometry',
            'place_id',
          ],
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place) {
          const location = parseAddressComponents(place);
          if (location) {
            setInputValue(place.formatted_address || '');
            onSelect(location);
          }
        }
      });

      setIsLoaded(true);
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      // Wait for the script to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [onSelect, parseAddressComponents]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-lg
                   focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                   focus:outline-none transition-all duration-200
                   disabled:bg-slate-100 disabled:cursor-not-allowed
                   placeholder:text-slate-400"
        autoComplete="off"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
