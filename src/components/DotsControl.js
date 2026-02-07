import './DotsControl.css';
import { markerPalette } from '../configs';

export const DotsControl = L.Control.extend({
  options: {
    position: 'topright',
    onApply: null
  },
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar dots-control');

    const collapseBtn = L.DomUtil.create('button', 'dots-collapse-btn', container);
    collapseBtn.innerText = '⮟';
    collapseBtn.title = 'Collapse';

    const editable = L.DomUtil.create('div', 'dots-editable', container);
    editable.contentEditable = 'true';
    editable.setAttribute('placeholder', 'Enter MGRS coordinates (one per line)');

    const footer = L.DomUtil.create('div', 'dots-footer', container);
    const button = L.DomUtil.create('button', 'apply-btn', footer);
    button.innerText = 'Apply';

    const resizeHandle = L.DomUtil.create('div', 'resize-handle', footer);

    let collapsed = false;
    collapseBtn.onclick = () => {
      collapsed = !collapsed;
      if (collapsed) {
        container.classList.add('collapsed');
        collapseBtn.innerText = '⮞';
        collapseBtn.title = 'Expand';
      } else {
        container.classList.remove('collapsed');
        collapseBtn.innerText = '⮟';
        collapseBtn.title = 'Collapse';
      }
    };

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
      if (typeof this.options.onApply === 'function') {
        editable.innerHTML = this.options.onApply(editable.innerText);
      } else {
        alert('Input Value: ' + lines.join('\n'));
      }
    };

    return container;
  }
});

