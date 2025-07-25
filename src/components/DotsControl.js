import './DotsControl.css';
import { markerPalette } from '../configs';

export const DotsControl = L.Control.extend({
  options: {
    position: 'topright',
    onApply: null // Add callback option
  },
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar dots-control');

    // Use contenteditable div instead of textarea
    const editable = L.DomUtil.create('div', 'dots-editable', container);
    editable.contentEditable = 'true';
    editable.setAttribute('placeholder', 'Enter MGRS coordinates (one per line)');
    editable.style.minHeight = '60px';

    // Create footer for the button
    const footer = L.DomUtil.create('div', 'dots-footer', container);

    const button = L.DomUtil.create('button', '', footer);
    button.innerText = 'Apply';

    // Add resize handle
    const resizeHandle = L.DomUtil.create('div', 'resize-handle', container);

    // Resize logic (unchanged)
    resizeHandle.onmousedown = function(e) {
      e.preventDefault();
      e.stopPropagation();

      document.body.style.userSelect = 'none';

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = parseInt(document.defaultView.getComputedStyle(container).width, 10);
      const startHeight = parseInt(document.defaultView.getComputedStyle(container).height, 10);

      function doDrag(ev) {
        let newWidth = startWidth - ev.clientX + startX;
        let newHeight = startHeight + ev.clientY - startY;
        newWidth = Math.max(newWidth, 150);
        newHeight = Math.max(newHeight, 60);
        container.style.width = newWidth + 'px';
        container.style.height = newHeight + 'px';
      }

      function stopDrag() {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
        document.body.style.userSelect = '';
      }

      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    };

    L.DomEvent.disableClickPropagation(container);

    button.onclick = () => {
      // Get lines from contenteditable div
      const lines = editable.innerText.split('\n').map(line => line.trim());

      // Color each line background
      editable.innerHTML = lines.map((line, idx) => {
        const color = markerPalette[idx % markerPalette.length];
        return `<div style="background:${color};padding:2px 4px;">${line || '&nbsp;'}</div>`;
      }).join('');

      if (typeof this.options.onApply === 'function') {
        this.options.onApply(lines.join('\n'));
      } else {
        alert('Input Value: ' + lines.join('\n'));
      }
    };

    return container;
  }
});

