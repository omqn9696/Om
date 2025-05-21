(function () {
  'use strict';

  const clonedBubbles = new Map();
  let lastMapId = null;
  let enabled = false;

  function createClonedBubble(timeOnly, top, right) {
    const bubble = document.createElement('div');
    bubble.className = 'LookAtBubble_lookAtBubble___pd4a LookAtBubble_lookAtBubbleBackground__H6GyF';
    bubble.style.position = 'absolute';
    bubble.style.color = '#000';
    bubble.style.top = `${top}px`;
    bubble.style.right = `${right}px`;
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

  function createToggleButton() {
  const btn = document.createElement('button');
  btn.innerText = 'Enable'; // Vì mặc định đang tắt
  btn.style.position = 'fixed';
  btn.style.bottom = '10px';
  btn.style.right = '10px';
  btn.style.zIndex = '10000';
  btn.style.padding = '10px 15px';
  btn.style.background = '#007bff';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  btn.style.fontWeight = 'bold';

  btn.addEventListener('click', () => {
    enabled = !enabled;
    btn.innerText = enabled ? 'Disable' : 'Enable';
  });

  document.body.appendChild(btn);
}



  // Main Loop
  setInterval(() => {
    if (!enabled) return;

    const look = window.pga?.helpers?.getReduxValue()?.game?.lookAtText;
    const uiSize = window.pga?.helpers?.getReduxValue()?.ui?.dimension;
    const currentMapId = window.pga?.helpers?.getReduxValue()?.game?.farmDetails?.mapId;

    if (!look || !uiSize) return;

    if (lastMapId !== null && lastMapId !== currentMapId) {
      clearAllBubbles();
    }
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

      const bubble = createClonedBubble(cleanTime, top, right);
      clonedBubbles.set(key, bubble);
      startCountdown(bubble, cleanTime, key);
    }
  }, 100);

  // Tạo nút điều khiển
  //createResetButton();
  createToggleButton();
    document.addEventListener('keydown', (e) => {
  if (!enabled) return;
  if (e.code === 'Space') {
    e.preventDefault(); // Ngăn cuộn trang khi nhấn Space
    clearAllBubbles();
  }
});
})();
