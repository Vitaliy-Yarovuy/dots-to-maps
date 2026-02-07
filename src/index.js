import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';
import * as mgrs from 'mgrs';

import 'leaflet-range/L.Control.Range';
import { DotsControl } from './components/DotsControl';
import { markerPalette } from './configs';
import { showResultToast } from './components/ResultToast';

const mgrsRegex = /\b\d{1,2}[C-HJ-NP-X]\s*[A-HJ-NP-Z][A-HJ-NP-V]\s*(?:\d{1,5}\s*\d{1,5})\b/gi;


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
    let detectedCoordinates = [];
    let colorMap = {};
    let coordinatePositions = [];
    
    // Extract all MGRS coordinates from the input text
    let match;
    
    while ((match = mgrsRegex.exec(normalizedInput)) !== null) {
      const mgrsString = match[0].trim();
      try {
        const [lon, lat] = mgrs.toPoint(mgrsString);
        const color = markerPalette[markerCount % markerPalette.length] || `hsl(${(markerCount * 55) % 360}, 80%, 50%)`;

        const icon = L.icon({
          iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41"><circle cx="12" cy="20" r="10" fill="${encodeURIComponent(color)}" stroke="black" stroke-width="2"/></svg>`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        });

        const marker = L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(`Marker #${markerCount + 1}: ${mgrsString}`);
        appliedMarkers.push(marker);
        latLngs.push([lat, lon]);
        detectedCoordinates.push(mgrsString);
        colorMap[mgrsString] = color;
        coordinatePositions.push({ index: match.index, length: mgrsString.length });
        markerCount++;
      } catch (e) {
        console.error(`Failed to parse MGRS: ${mgrsString}`, e);
      }
    }

    showResultToast(`Created ${markerCount} marker(s), detected coordinates: ${detectedCoordinates.length}`);

    if (latLngs.length > 0) {
      const group = new L.featureGroup(appliedMarkers);
      map.fitBounds(group.getBounds().pad(1.5));
    }
    
    // Build highlighted text using coordinate positions
    let highlightedText = mgrsInput;
    let offset = 0;
    
    coordinatePositions.forEach((pos, idx) => {
      const coord = detectedCoordinates[idx];
      const normalizedCoord = normalizeCyrillicToLatin(coord);
      const color = colorMap[coord];
      const adjustedIndex = pos.index + offset;
      const mark = `<mark style="background-color: ${color}; opacity: 0.6; padding: 2px;">${normalizedCoord}</mark>`;
      const markupDiff = mark.length - pos.length;
      
      highlightedText = highlightedText.substring(0, adjustedIndex) + mark + highlightedText.substring(adjustedIndex + pos.length);
      offset += markupDiff;
    });
    
    return highlightedText;
  }
}));
