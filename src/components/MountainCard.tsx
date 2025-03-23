'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import type { Map as LeafletMap, Marker } from 'leaflet';
import type { Map as MapLibreMap, MapOptions } from 'maplibre-gl';
import { ToggleButton } from './shared/ToggleButton';
import { StarRating } from './shared/StarRating';
import { MountainCardHeader } from './MountainCard/MountainCardHeader';
import { MountainDetails } from './MountainCard/MountainDetails';
import { RatingPanel } from './MountainCard/RatingPanel';
import { MountainCardFooter } from './MountainCard/MountainCardFooter';
import { MountainMap } from './MountainCard/MountainMap';
import { CompletionModal } from './MountainCard/CompletionModal';
import { CommentsModal } from './MountainCard/CommentsModal';
import { useRouter } from 'next/navigation';

interface MountainCardProps {
  mountain: Mountain;
  isCompleted?: boolean;
  onToggleCompletion: (mountainId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
  allMountains: Mountain[];
  onMapMarkerClick?: (mountainName: string) => void;
}

// Dynamic imports for mapping libraries
let L: typeof import('leaflet');
let maplibregl: typeof import('maplibre-gl');

const loadMapLibraries = async () => {
  if (typeof window === 'undefined') return;

  try {
    // Import the libraries
    const [leafletModule, maplibreModule] = await Promise.all([
      import('leaflet'),
      import('maplibre-gl')
    ]);

    L = leafletModule.default;
    maplibregl = maplibreModule.default;

    // Add CSS to head
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(leafletCss);

    const maplibreCss = document.createElement('link');
    maplibreCss.rel = 'stylesheet';
    maplibreCss.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
    document.head.appendChild(maplibreCss);

    // Fix Leaflet icon paths
    if (L) {
      // @ts-expect-error Icon properties are not fully typed in Leaflet types
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  } catch (error) {
    console.error('Error loading map libraries:', error);
  }
};

// Load libraries on mount
if (typeof window !== 'undefined') {
  loadMapLibraries();
}

export const MountainCard: React.FC<MountainCardProps> = ({
  mountain,
  isCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
  allMountains = [],
  onMapMarkerClick,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentState, setCurrentState] = useState(isCompleted);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [mountainData, setMountainData] = useState(mountain);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ignoreNextPropChange = useRef(false);
  const categoryName = mountainData.MountainCategoryID === 12 ? 'Munro' : 'Corbett';
  const rating = mountainData.averageRating;
  const hasUserRated = mountainData.userRating !== undefined;
  const userRating = mountainData.userRating;
  const recentComments = mountainData.recentComments || [];
  const [is3DMode, setIs3DMode] = useState(false);
  const maplibreMap = useRef<MapLibreMap | null>(null);
  const markers3D = useRef<maplibregl.Marker[]>([]);

  // Update mountainData when mountain prop changes
  useEffect(() => {
    setMountainData(mountain);
  }, [mountain]);

  const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfStar = x < rect.width / 2;
    const value = halfStar ? starIndex - 0.5 : starIndex;
    setSelectedRating(value);
  };

  const handleStarHover = (star: number, event: React.MouseEvent) => {
    if (!hasUserRated) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const percentage = (event.clientX - rect.left) / rect.width;
      const rating = star - 0.5 + percentage;
      setHoverRating(Math.max(0.5, Math.min(star, rating)));
    }
  };

  // Only update from props if we didn't trigger the change ourselves
  useEffect(() => {
    if (ignoreNextPropChange.current) {
      ignoreNextPropChange.current = false;
      return;
    }
    setCurrentState(isCompleted);
  }, [isCompleted]);

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;

    const newState = !currentState;
    
    if (newState) {
      // If marking as completed and user hasn't rated yet, show the confirmation modal
      if (!hasUserRated) {
        setShowCompletionModal(true);
      } else {
        // If user has already rated, just mark as completed without showing modal
        await processToggle(newState);
      }
      return;
    } else {
      // If marking as not completed, proceed directly
      await processToggle(newState);
    }
  };

  const processToggle = async (newState: boolean) => {
    // Set flag to ignore the next prop change since we're triggering it
    ignoreNextPropChange.current = true;
    
    // Update visual state immediately
    setCurrentState(newState);
    setIsUpdating(true);

    try {
      // Call the API
      await onToggleCompletion(mountainData.id, newState);
      // Keep our flag true since the API succeeded
      ignoreNextPropChange.current = true;
      
      // Only show rating panel if marking as completed AND hasn't rated yet
      if (newState && !hasUserRated) {
        setShowRatingPanel(true);
      }
    } catch {
      // If the API call fails, revert the visual state
      setCurrentState(!newState);
      // Reset our flag since we want to sync with the server state
      ignoreNextPropChange.current = false;
    } finally {
      setIsUpdating(false);
    }
  };

  const getCategoryImage = (categoryId: number) => {
    switch (categoryId) {
      case 11:
        return '/mountain-category-11.jpg';
      case 12:
        return '/mountain-category-12.jpg';
      default:
        return '/mountain-default.jpg';
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedRating || !session?.user?.id) {
      toast.error('Please select a rating before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/mountains/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mountainId: mountainData.id,
          rating: selectedRating,
          comment: comment.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Create a new mountain data object with updated values
      const updatedMountain = { ...mountainData };
      updatedMountain.userRating = selectedRating;
      updatedMountain.userComment = comment.trim() || undefined;
      
      if (comment.trim()) {
        updatedMountain.recentComments = [{
          rating: selectedRating,
          comment: comment.trim() || null,
          createdAt: new Date().toISOString(),
          userName: session.user.name || null
        }, ...(mountainData.recentComments || []).slice(0, 4)];
      }

      // Recalculate average rating
      const newTotalRatings = (mountainData.totalRatings || 0) + (mountainData.userRating === undefined ? 1 : 0);
      const oldRatingSum = (mountainData.averageRating || 0) * (mountainData.totalRatings || 0);
      const newRatingSum = oldRatingSum + (mountainData.userRating === undefined ? selectedRating : (selectedRating - (mountainData.userRating || 0)));
      updatedMountain.averageRating = newRatingSum / newTotalRatings;
      updatedMountain.totalRatings = newTotalRatings;

      // Update the state with the new mountain data
      setMountainData(updatedMountain);

      // If not already completed, mark as completed
      if (!currentState) {
        await processToggle(true);
      }

      toast.success('Rating submitted successfully!');
      setShowRatingPanel(false);
      // Reset form
      setSelectedRating(undefined);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowRatingPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize 3D map
  const initialize3DMap = useCallback(() => {
    if (!maplibregl || !mapContainer.current) return;

    // Clean up existing 2D map if it exists
    if (map.current) {
      map.current.remove();
      map.current = null;
      marker.current = null;
    }

    // Clean up existing 3D map if it exists
    if (maplibreMap.current) {
      markers3D.current.forEach(marker => marker.remove());
      markers3D.current = [];
      maplibreMap.current.remove();
      maplibreMap.current = null;
    }

    const lat = parseFloat(mountainData.ukHillsDbLatitude);
    const lng = parseFloat(mountainData.ukHillsDbLongitude);

    // Add styles for 3D markers
    const style = document.createElement('style');
    style.setAttribute('data-mountain-marker', 'true');
    style.textContent = `
      .mountain-marker {
        cursor: pointer;
        width: 24px;
        height: 24px;
        transform: translate(-50%, -50%);
      }
      .mountain-marker div {
        transform-origin: center;
        transform: rotateX(45deg);
        transition: transform 0.3s ease;
      }
      .mountain-marker:hover div {
        transform: rotateX(45deg) scale(1.1);
      }
    `;
    document.head.appendChild(style);

    const mapOptions: MapOptions = {
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          'terrain-rgb': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            maxzoom: 14,
            encoding: 'terrarium'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 1
            }
          }
        ],
        terrain: {
          source: 'terrain-rgb',
          exaggeration: 1.2
        }
      },
      center: [lng, lat],
      zoom: 12,
      pitch: 60,
      bearing: 30
    };

    maplibreMap.current = new maplibregl.Map(mapOptions);

    // Wait for map to load
    maplibreMap.current?.on('load', () => {
      if (!maplibreMap.current) return;
      
      maplibreMap.current.addLayer({
        id: 'fog',
        type: 'background',
        paint: {
          'background-color': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 'rgba(255,255,255,0.9)',
            5, 'rgba(255,255,255,0.6)',
            10, 'rgba(255,255,255,0.3)',
            15, 'rgba(255,255,255,0.1)'
          ]
        }
      });

      // Add markers after terrain is loaded
      allMountains.forEach((m) => {
        if (!maplibreMap.current) return;
        
        const mLat = parseFloat(m.ukHillsDbLatitude);
        const mLng = parseFloat(m.ukHillsDbLongitude);

        const el = document.createElement('div');
        el.className = 'mountain-marker';
        el.innerHTML = `
          <div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-orange-600 transition-colors">
            ${m.id === mountainData.id ? '<div class="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>' : ''}
          </div>
        `;

        // Create popup element
        const popupContent = document.createElement('div');
        popupContent.className = 'text-center bg-white p-2 rounded-lg';
        popupContent.innerHTML = `
          <strong class="text-gray-900">${m.ukHillsDbName}</strong><br/>
          <span class="text-gray-700">${m.Height}m - ${m.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}</span><br/>
        `;

        // Create button element
        const button = document.createElement('button');
        button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
        button.textContent = 'Show Details';
        button.onclick = () => {
          if (onMapMarkerClick) {
            onMapMarkerClick(m.ukHillsDbName);
            setShowMap(false);
          }
        };

        // Append button to popup content
        popupContent.appendChild(button);

        const popup = new maplibregl.Popup({ offset: 25 })
          .setDOMContent(popupContent);

        const marker = new maplibregl.Marker(el)
          .setLngLat([mLng, mLat])
          .setPopup(popup)
          .addTo(maplibreMap.current);

        markers3D.current.push(marker);

        if (m.id === mountainData.id) {
          marker.togglePopup();
        }
      });

      // Force a resize to ensure proper rendering
      if (maplibreMap.current) {
        maplibreMap.current.resize();
      }
    });

    // Add terrain controls
    const terrainControls = document.createElement('div');
    terrainControls.className = 'maplibre-ctrl maplibre-ctrl-group';
    terrainControls.style.cssText = 'position: absolute; bottom: 10px; left: 10px; margin: 0;';
    terrainControls.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg" style="touch-action: none;">
        <div class="flex items-center gap-3 p-2" style="pointer-events: auto;">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <span class="text-xs text-gray-600 font-medium">Tilt</span>
          </div>
          <div class="relative w-32" style="touch-action: none;">
            <input 
              type="range" 
              min="0" 
              max="85" 
              step="1" 
              value="60" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style="
                pointer-events: auto;
                touch-action: none;
                -webkit-appearance: none;
                appearance: none;
              "
            />
            <style>
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #f97316;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              }
              input[type='range']::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #f97316;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              }
              input[type='range']:focus {
                outline: none;
              }
              input[type='range']::-webkit-slider-runnable-track {
                background: #e5e7eb;
                border-radius: 0.5rem;
                height: 0.5rem;
              }
              input[type='range']::-moz-range-track {
                background: #e5e7eb;
                border-radius: 0.5rem;
                height: 0.5rem;
              }
            </style>
          </div>
          <button 
            class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" 
            title="Reset View"
          >
            <svg class="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 100-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add click handler for reset button
    terrainControls.querySelector('button')?.addEventListener('click', () => {
      if (maplibreMap.current) {
        maplibreMap.current.easeTo({
          pitch: 60,
          bearing: 30,
          zoom: 12,
          duration: 1500
        });
      }
    });

    // Add change handler for pitch slider
    const pitchSlider = terrainControls.querySelector('input[type="range"]');
    pitchSlider?.addEventListener('input', (e) => {
      if (maplibreMap.current) {
        const pitch = parseFloat((e.target as HTMLInputElement).value);
        maplibreMap.current.easeTo({
          pitch: pitch,
          duration: 0
        });
      }
    });

    // Add the controls directly to the map container
    mapContainer.current.appendChild(terrainControls);
  }, [mountainData, allMountains, onMapMarkerClick]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!showMap) return;

    // Fix scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    if (is3DMode) {
      initialize3DMap();
    } else if (L && mapContainer.current) {
      // Clean up existing 3D map if it exists
      if (maplibreMap.current) {
        markers3D.current.forEach(marker => marker.remove());
        markers3D.current = [];
        maplibreMap.current.remove();
        maplibreMap.current = null;
      }

      // Clean up existing 2D map if it exists
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
      
      const lat = parseFloat(mountainData.ukHillsDbLatitude);
      const lng = parseFloat(mountainData.ukHillsDbLongitude);

      // Initialize map centered on the current mountain with closer zoom
      map.current = L.map(mapContainer.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([lat, lng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.current);

      // Add custom zoom control
      const zoomAllButton = L.Control.extend({
        options: {
          position: 'topleft'
        },

        onAdd: function(map: LeafletMap) {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', '', container);
          button.innerHTML = `
            <div class="w-[30px] h-[30px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100" title="View All Nearby">
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm14 0H3v12h14V3z" clip-rule="evenodd"/>
                <path fill-rule="evenodd" d="M13 7a1 1 0 10-2 0v1H9a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
              </svg>
            </div>
          `;
          
          L.DomEvent.on(button, 'click', function(e: Event) {
            L.DomEvent.stopPropagation(e);
            // Create bounds object to fit all markers
            const bounds = L.latLngBounds([]);
            allMountains.forEach(m => {
              bounds.extend([
                parseFloat(m.ukHillsDbLatitude),
                parseFloat(m.ukHillsDbLongitude)
              ]);
            });
            // Fit the map to show all markers with some padding
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 10
            });
          });

          return container;
        }
      });

      // Create markers for all mountains
      const markers = new Map<number, L.Marker>();
      
      allMountains.forEach((m) => {
        const mLat = parseFloat(m.ukHillsDbLatitude);
        const mLng = parseFloat(m.ukHillsDbLongitude);
        
        if (map.current) {
          const marker = L.marker([mLat, mLng])
            .addTo(map.current)
            .bindPopup(
              `<div class="text-center">
                <strong>${m.ukHillsDbName}</strong><br/>
                ${m.Height}m - ${m.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}<br/>
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('mountain-selected', { detail: '${m.ukHillsDbName}' }))"
                  class="px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600"
                >
                  Show Details
                </button>
              </div>`,
              {
                className: 'mountain-popup'
              }
            );

          // Highlight the current mountain's marker
          if (m.id === mountainData.id) {
            marker.setZIndexOffset(1000); // Bring to front
            marker.openPopup();
          }

          markers.set(m.id, marker);
        }
      });

      // Add the zoom control to the map
      if (map.current) {
        map.current.addControl(new zoomAllButton());

        // Force a resize after a short delay to ensure the container is visible
        setTimeout(() => {
          if (map.current) {
            map.current.invalidateSize();
          }
        }, 100);
      }

      // Add event listener for mountain selection
      const handleMountainSelected = (event: CustomEvent) => {
        if (onMapMarkerClick) {
          onMapMarkerClick(event.detail);
          setShowMap(false);
        }
      };

      window.addEventListener('mountain-selected', handleMountainSelected as EventListener);

      return () => {
        window.removeEventListener('mountain-selected', handleMountainSelected as EventListener);
      };
    }

    return () => {
      if (is3DMode && maplibreMap.current) {
        markers3D.current.forEach(marker => marker.remove());
        markers3D.current = [];
        maplibreMap.current.remove();
        maplibreMap.current = null;
      } else if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'unset';
      // Remove any added styles
      const style = document.querySelector('style[data-mountain-marker]');
      if (style) {
        style.remove();
      }
    };
  }, [showMap, is3DMode, mountainData.ukHillsDbLatitude, mountainData.ukHillsDbLongitude, mountainData.ukHillsDbName, mountainData.id, allMountains, onMapMarkerClick, initialize3DMap]);

  // Handle completion toggle
  const handleCompletionToggle = async () => {
    if (!session?.user || isUpdating) return;

    try {
      setIsSubmitting(true);
      const newCompletionStatus = !currentState;
      
      // Update completion status
      await processToggle(newCompletionStatus);
      
      // Only show rating panel if marking as completed AND hasn't rated yet
      if (newCompletionStatus && !hasUserRated) {
        setShowRatingPanel(true);
      }
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update completion status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle showing rating panel from footer button
  const handleShowRatingPanel = () => {
    setShowRatingPanel(true);
  };

  return (
    <>
      <div className={`
        group relative bg-gray-800 rounded-xl overflow-hidden h-full
        border border-orange-500/20 hover:border-orange-500/40
        shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.2)]
        ${isInitialLoading ? 'animate-pulse blur-[2px]' : ''}
      `}>
        {isInitialLoading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 animate-spin text-orange-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        
        <MountainCardHeader
          name={mountainData.ukHillsDbName}
          categoryId={mountainData.MountainCategoryID}
          isCompleted={currentState}
          isUpdating={isUpdating}
          showToggle={!!session?.user}
          onToggleCompletion={handleCompletionToggle}
        />

        {/* Content Section - Fixed height */}
        <div className="h-[240px] bg-gradient-to-b from-gray-800 to-gray-900">
          {showRatingPanel ? (
            <RatingPanel
              hasUserRated={hasUserRated}
              userRating={userRating}
              selectedRating={hasUserRated ? userRating : selectedRating}
              comment={hasUserRated ? mountainData.userComment || '' : comment}
              userComment={mountainData.userComment}
              isSubmitting={isSubmitting}
              onClose={() => setShowRatingPanel(false)}
              onRatingChange={setSelectedRating}
              onCommentChange={setComment}
              onSubmit={handleSubmitRating}
              readOnly={hasUserRated}
            />
          ) : (
            <div className="h-full p-4 flex flex-col">
              {/* Mountain Details Content */}
              <MountainDetails
                height={mountainData.Height}
                latitude={mountainData.ukHillsDbLatitude}
                longitude={mountainData.ukHillsDbLongitude}
                region={mountainData.ukHillsDbSection}
                onShowMap={() => setShowMap(true)}
              />

              {/* Rating Stars and Comment Button */}
              <MountainCardFooter
                rating={rating}
                totalRatings={mountainData.totalRatings}
                hasRecentComments={recentComments.length > 0}
                isUserLoggedIn={!!session?.user}
                hasUserRated={hasUserRated}
                onShowComments={() => setShowComments(true)}
                onShowRatingPanel={handleShowRatingPanel}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <MountainMap
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        mountain={mountain}
        allMountains={allMountains}
        onMountainSelect={onMapMarkerClick}
      />

      <CompletionModal
        isOpen={showCompletionModal}
        mountainName={mountainData.ukHillsDbName}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={() => setShowCompletionModal(false)}
        onRateAndComment={() => {
          setShowCompletionModal(false);
          setShowRatingPanel(true);
        }}
      />

      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={recentComments}
      />
    </>
  );
}; 