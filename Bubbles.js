(function () {
  'use strict';

  function waitForPGA(callback) {
    const interval = setInterval(() => {
      if (
        window.pga &&
        window.pga.helpers &&
        typeof window.pga.helpers.getRoomScene === "function"
      ) {
        clearInterval(interval);
        callback();
      }
    }, 500);
  }

  waitForPGA(() => {
    let overlayContainer = document.getElementById("debug-overlay");
    if (!overlayContainer) {
      overlayContainer = document.createElement("div");
      overlayContainer.id = "debug-overlay";
      overlayContainer.style.position = "absolute";
      overlayContainer.style.top = "0";
      overlayContainer.style.left = "0";
      overlayContainer.style.pointerEvents = "none";
      overlayContainer.style.zIndex = "9999";
      document.body.appendChild(overlayContainer);
    }

    function formatTime(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }

    function updateOverlay() {
      const room = window.pga.helpers.getRoomScene();
      const entities = room?.entities;
      if (!entities || entities.size === 0) {
        requestAnimationFrame(updateOverlay);
        return;
      }

      overlayContainer.innerHTML = "";
      let index = 0;

      for (const [key, value] of entities) {
        const gameEntity = value?.gameEntity;
        if (!gameEntity?.id?.startsWith("ent_mine_")) continue;

        const screen = window.pga.helpers.getScreenCoords(
            room,
            value.x,
            value.y,
            value.width,
            value.height
        );

          const offsetX = screen.cameraWidth * 0.08;
          const offsetY = screen.cameraHeight * 0.2;
        const dot = document.createElement("div");
        dot.style.position = "absolute";
        //dot.style.width = "16px";
        //dot.style.height = "16px";
        //dot.style.borderRadius = "50%";
        //dot.style.background = "rgba(255, 0, 0, 0.8)";
        //dot.style.border = "2px solid white";
       dot.style.left = `${screen.x + offsetX}px`;
        dot.style.top = `${screen.y + offsetY}px`;
        dot.style.transform = "translate(-50%, -50%)";

        const utcTarget = value?.currentState?.displayInfo?.utcTarget;
        if (utcTarget) {
          const remain = utcTarget - Date.now();
          const timeText = formatTime(remain);

          const timeDiv = document.createElement("div");
          timeDiv.textContent = timeText;
          timeDiv.style.position = "absolute";
          timeDiv.style.color = "#000";
          timeDiv.style.fontSize = "12px";
          timeDiv.style.opacity = "0.7";

          timeDiv.style.padding = "10px";
          timeDiv.style.top = "18px";
      timeDiv.style.left = "50%";
          timeDiv.style.transform = "translateX(-50%)";
          timeDiv.style.background = "white"; // nền trắng
           timeDiv.style.border = "1px solid #000"; // viền trắng
          timeDiv.style.boxShadow = "0 0 2px rgba(0,0,0,0.5)";
          dot.appendChild(timeDiv);
        }

        overlayContainer.appendChild(dot);
      }

      requestAnimationFrame(updateOverlay);
    }

    updateOverlay();
  });
})();
