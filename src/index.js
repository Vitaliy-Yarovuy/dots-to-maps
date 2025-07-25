import 'leaflet/dist/leaflet.css';
import './index.css';
import _ from 'lodash';
import L from 'leaflet';
import * as mgrs from 'mgrs';

import 'leaflet-range/L.Control.Range';
import { DotsControl } from './components/DotsControl';
import { markerPalette } from './configs';
import { showResultToast } from './components/ResultToast';

const map = L.map('dots-map', {
  center: [50.4472, 30.5233],
  zoom: 10
});

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let appliedMarkers = [];

map.addControl(new DotsControl({
  onApply: (mgrsInput) => {
    appliedMarkers.forEach(marker => map.removeLayer(marker));
    appliedMarkers = [];

    const lines = mgrsInput.split('\n').map(line => line.trim()).filter(line => line);
    const latLngs = [];
    let notRecognized = [];
    lines.forEach((mgrsString, idx) => {
      try {
        const [lon, lat] = mgrs.toPoint(mgrsString);

        const color = markerPalette[idx % markerPalette.length] || `hsl(${(idx * 60) % 360}, 80%, 50%)`;

        const icon = L.icon({
          iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41"><circle cx="12" cy="20" r="10" fill="${encodeURIComponent(color)}" stroke="black" stroke-width="2"/></svg>`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        });

        const marker = L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(`Marker #${idx + 1}`);
        appliedMarkers.push(marker);
        latLngs.push([lat, lon]);
      } catch (e) {
        notRecognized.push(`${idx + 1}| ${mgrsString}`);
      }
    });

    showResultToast(`Created ${latLngs.length} marker(s), not recognized lines: ${notRecognized.length ? notRecognized.join(', ') : 'none'}`);

    if (latLngs.length > 0) {
      const group = new L.featureGroup(appliedMarkers);
      map.fitBounds(group.getBounds().pad(1.5));
    }
  }
}));
