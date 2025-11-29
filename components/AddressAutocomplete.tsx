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
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    const initServices = () => {
      if (!window.google?.maps?.places) return;

      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();

      // Create a dummy div for PlacesService (required by the API)
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);

      setIsLoaded(true);
    };

    if (window.google?.maps?.places) {
      initServices();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initServices();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Debounced search for predictions
  const searchPredictions = useCallback((input: string) => {
    if (!autocompleteServiceRef.current || input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait 300ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input,
          types: ['address'],
          componentRestrictions: { country: 'us' },
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    searchPredictions(value);
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setInputValue(prediction.description);
    setShowDropdown(false);
    setPredictions([]);

    // Get full place details
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const location = parseAddressComponents(place);
          if (location) {
            onSelect(location);
          }
        }
      }
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
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

      {/* Predictions dropdown */}
      {showDropdown && predictions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
            >
              <span className="text-slate-700">{prediction.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
