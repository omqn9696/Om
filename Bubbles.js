(function () {
  'use strict';

  const clonedBubbles = new Map();
  let lastMapId = null;
  let enabled = false;

  function createClonedBubble(timeOnly) {
    const bubble = document.createElement('div');
    bubble.className = 'LookAtBubble_lookAtBubble___pd4a LookAtBubble_lookAtBubbleBackground__H6GyF';
    bubble.style.position = 'absolute';
    bubble.style.color = '#000';
    bubble.style.display = 'flex';
    bubble.style.zIndex = '9999';
    bubble.style.pointerEvents = 'none';
    bubble.innerHTML = `<div><span class="timer">${timeOnly}</span></div>`;
    document.body.appendChild(bubble);
    return bubble;
  }

  function parseTimeStringToSeconds(str) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      return hh * 3600 + mm * 60 + ss;
    } else if (parts.length === 2) {
      const [mm, ss] = parts;
      return mm * 60 + ss;
    }
    return 0;
  }

  function startCountdown(bubble, initialTimeStr, key) {
    let totalSeconds = parseTimeStringToSeconds(initialTimeStr);
    if (totalSeconds === 0) return;

    const interval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds < 0) {
        clearInterval(interval);
        bubble.remove();
        clonedBubbles.delete(key);
        return;
      }

      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(totalSeconds % 60).padStart(2, '0');
      bubble.querySelector('.timer').textContent = `${h}:${m}:${s}`;
    }, 1000);

    bubble.dataset.timerId = interval;
  }

  function clearAllBubbles() {
    for (const [key, bubble] of clonedBubbles.entries()) {
      clearInterval(bubble.dataset.timerId);
      bubble.remove();
    }
    clonedBubbles.clear();
  }

  function updateBubblePosition(bubble, mapX, mapY) {
    const camera = window.pga?.helpers?.getRoomScene()?.camera;
    if (!camera) return;
    const zoom = camera.zoom || 1;
    const screenX = (mapX - camera.scrollX) * zoom;
    const screenY = (mapY - camera.scrollY) * zoom;
    bubble.style.top = `${screenY}px`;
    bubble.style.right = `${window.innerWidth - screenX}px`;
  }

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.textContent = '⏲️';
    btn.id = 'btntime';
    btn.title = 'Toggle Timer Bubbles';
    Object.assign(btn.style, {
      position: 'fixed', bottom: '10px', right: '10px', zIndex: '10000',
      width: '50px', height: '50px', background: '#007bff', border: 'none',
      borderRadius: '6px', cursor: 'pointer', fontSize: '24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)', outline: 'none'
    });

    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('click', () => {
      enabled = !enabled;
      btn.style.background = enabled ? '#16a34a' : '#007bff';
    });
    document.body.appendChild(btn);
  }

  setInterval(() => {
    const camera = window.pga?.helpers?.getRoomScene()?.camera;
    if (!camera || !enabled) return;
    for (const [key, bubble] of clonedBubbles.entries()) {
      const mapX = parseFloat(bubble.dataset.mapX);
      const mapY = parseFloat(bubble.dataset.mapY);
      updateBubblePosition(bubble, mapX, mapY);
    }
  }, 100);

  setInterval(() => {
    const btntime = document.getElementById('btntime');
    if (btntime && btntime.classList.contains('on')) {
      enabled = true;
      btntime.style.background = '#16a34a';
    } else {
      enabled = false;
      if (btntime) btntime.style.background = '#007bff';
    }

    if (!enabled) return;

    const look = window.pga?.helpers?.getReduxValue()?.game?.lookAtText;
    const uiSize = window.pga?.helpers?.getReduxValue()?.ui?.dimension;
    const currentMapId = window.pga?.helpers?.getReduxValue()?.game?.farmDetails?.mapId;

    if (!look || !uiSize) return;
    if (lastMapId !== null && lastMapId !== currentMapId) clearAllBubbles();
    lastMapId = currentMapId;

    const isValidText = look.text?.includes("Mining") || look.text?.includes("Processing");
    if (look.isActive && isValidText) {
      const lines = look.text.split('\n');
      const timeLine = lines.find(line => /^\d{2}:\d{2}:\d{2}$/.test(line.trim()));
      if (!timeLine) return;

      const cleanTime = timeLine.trim();
      const top = look.y;
      const right = uiSize.width - look.x;
      const key = `${look.x}_${look.y}`;

      if (clonedBubbles.has(key)) {
        const oldBubble = clonedBubbles.get(key);
        clearInterval(oldBubble.dataset.timerId);
        oldBubble.remove();
        clonedBubbles.delete(key);
      }

      const bubble = createClonedBubble(cleanTime);

      const camera = window.pga.helpers.getRoomScene().camera;
      const zoom = camera.zoom || 1;
      const mapX = camera.scrollX + (window.innerWidth - right) / zoom;
      const mapY = camera.scrollY + top / zoom;

      bubble.dataset.mapX = mapX;
      bubble.dataset.mapY = mapY;

      updateBubblePosition(bubble, mapX, mapY);
      clonedBubbles.set(key, bubble);
      startCountdown(bubble, cleanTime, key);
    }
  }, 100);

  createToggleButton();
  document.addEventListener('keydown', (e) => {
    if (enabled && e.code === 'Space') {
      e.preventDefault();
      clearAllBubbles();
    }
  });
})();
