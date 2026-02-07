import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';
import * as mgrs from 'mgrs';

import 'leaflet-range/L.Control.Range';
import { DotsControl } from './components/DotsControl';
import { markerPalette } from './configs';
import { showResultToast } from './components/ResultToast';

const mgrsRegex = /\b\d{1,2}[C-HJ-NP-X]\s*[A-HJ-NP-Z][A-HJ-NP-V]\s*(?:\d{1,5}\s*\d{1,5})\b/gi;
// Decimal degrees lat,lon (WGS84) — latitude then longitude, comma or whitespace separated
const latLonRegex = /([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)/g;


// Replace Cyrillic characters with Latin equivalents
function normalizeCyrillicToLatin(text) {
  const replacements = {
    'А': 'A',
    'а': 'a',
    'В': 'B',
    'в': 'b',
    'Е': 'E',
    'е': 'e',
    'К': 'K',
    'к': 'k',
    'М': 'M',
    'м': 'm',
    'Н': 'H',
    'н': 'h',
    'О': 'O',
    'о': 'o',
    'П': 'P',
    'п': 'p',
    'С': 'C',
    'с': 'c',
    'Т': 'T',
    'т': 't',
    'У': 'Y',
    'у': 'y',
    'Х': 'X',
    'х': 'x',
    'Р': 'P',
    'р': 'p'
  };
  
  return text.replace(/[АаВвЕеКкМмНнОоПпСсТтУуХхРр]/g, char => replacements[char] || char);
}

const map = L.map('dots-map', {
  center: [50.4472, 30.5233],
  zoom: 10
});

const getIcon = (color) => L.icon({
  iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41"><circle cx="12" cy="20" r="10" fill="${encodeURIComponent(color)}" stroke="black" stroke-width="2"/></svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let appliedMarkers = [];
let latLngs = [];

map.addControl(new DotsControl({
  onApply: (mgrsInput) => {
    appliedMarkers.forEach(marker => map.removeLayer(marker));
    appliedMarkers = [];
    latLngs = [];

    // Normalize Cyrillic characters to Latin
    const normalizedInput = normalizeCyrillicToLatin(mgrsInput);
    let markerCount = 0;
    
    // Array to store all detected coordinates with their metadata
    const detectedPoints = [];
    
    // Extract all MGRS coordinates from the input text
    let match;
    
    while ((match = mgrsRegex.exec(normalizedInput)) !== null) {
      const mgrsString = match[0].trim();
      try {
        const [lon, lat] = mgrs.toPoint(mgrsString);
        detectedPoints.push({
          type: 'mgrs',
          index: match.index,
          length: mgrsString.length,
          lat,
          lon,
          original: mgrsString,
          normalized: normalizeCyrillicToLatin(mgrsString),
          color: null
        });
      } catch (e) {
        console.error(`Failed to parse MGRS: ${mgrsString}`, e);
      }
    }

    // Also detect WGS84 decimal lat,lon (skip overlaps with MGRS)
    let lm;
    while ((lm = latLonRegex.exec(normalizedInput)) !== null) {
      const latVal = parseFloat(lm[1]);
      const lonVal = parseFloat(lm[2]);
      
      // Check if this position overlaps with any MGRS coordinate
      const isOverlapWithMGRS = detectedPoints.some(pt => 
        pt.type === 'mgrs' && 
        lm.index < pt.index + pt.length && lm.index + lm[0].length > pt.index
      );
      
      if (isOverlapWithMGRS) continue;
      
      // basic validation
      if (Number.isFinite(latVal) && Number.isFinite(lonVal) && Math.abs(latVal) <= 90 && Math.abs(lonVal) <= 180) {
        const normalizedText = `${latVal.toFixed(6)}, ${lonVal.toFixed(6)}`;
        detectedPoints.push({
          type: 'latlon',
          index: lm.index,
          length: lm[0].length,
          lat: latVal,
          lon: lonVal,
          original: lm[0].trim(),
          normalized: normalizedText,
          color: null
        });
      }
    }

    // Sort by index for consistent marker numbering
    detectedPoints.sort((a, b) => a.index - b.index);
    
    // Assign colors and create markers for all detected points
    detectedPoints.forEach((pt, idx) => {
      const color = markerPalette[idx % markerPalette.length] || `hsl(${(idx * 55) % 360}, 80%, 50%)`;
      pt.color = color;
      
      const icon = getIcon(color);
      const marker = L.marker([pt.lat, pt.lon], { icon })
        .addTo(map)
        .bindPopup(`Marker #${idx + 1}: ${pt.original}`);
      
      appliedMarkers.push(marker);
      latLngs.push([pt.lat, pt.lon]);
      markerCount++;
    });

    showResultToast(`Created ${markerCount} marker(s), detected coordinates: ${detectedPoints.length}`);

    if (latLngs.length > 0) {
      const group = new L.featureGroup(appliedMarkers);
      map.fitBounds(group.getBounds().pad(1.5));
    }
    
    // Build highlighted text using sorted detectedPoints
    let highlightedText = mgrsInput;
    let offset = 0;

    detectedPoints.forEach(pt => {
      const adjustedIndex = pt.index + offset;
      const mark = `<mark style="background-color: ${pt.color}; opacity: 0.6; padding: 2px;">${pt.normalized}</mark>`;
      highlightedText = highlightedText.substring(0, adjustedIndex) + mark + highlightedText.substring(adjustedIndex + pt.length);
      offset += mark.length - pt.length;
    });

    return highlightedText;
  }
}));
