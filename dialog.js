(function () {
    'use strict';
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // --- THÔNG TIN TELEGRAM ---
    const TELEGRAM_BOT_TOKEN = '7497533128:AAHnXF8-ASqxV3F23IpYsAW94Bl33I9nG7E';
    const TELEGRAM_CHAT_ID = '-1002593215567';

    const sendPhotoToTelegram = async (photoUrl, caption) => {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    photo: photoUrl,
                    caption: caption,
                }),
            });
            console.log('[TASK TRACKER] ✅ Đã gửi:', caption);
        } catch (err) {
            console.error('[TASK TRACKER] ❌ Lỗi gửi Telegram:', err);
        }
    };

    const formatCaption = (task) =>
        `💸💸💸 ${task.reward.quantity} 💎\n` +
        `${task.taskItem.name} x${task.taskItem.quantity}\n` +
        `Skill: ${task.requiredSkill.type}`;

    const sentTaskItemIds = new Set();

    const processTasks = (items) => {
        for (const task of items) {
            if (
                task?.reward?.type === 'pixel' &&
                task?.taskItem?.id &&
                task?.taskItem?.icon &&
                task?.requiredSkill
            ) {
                const id = task.taskItem.id;
                if (!sentTaskItemIds.has(id)) {
                    sentTaskItemIds.add(id);
                    sendPhotoToTelegram(task.taskItem.icon, formatCaption(task));
                }
            }
        }
    };

    let taskIntervalId = null;
    let taskEnabled = false;

    const startWatchingTasks = () => {
        if (taskIntervalId) return;
        taskIntervalId = setInterval(() => {
            if (!taskEnabled) return;
            const items = w?.pga?.store?.taskBoard?.items;
            if (!Array.isArray(items)) return;

            const hasPixelTask = items.some(task =>
                task?.reward?.type === 'pixel' &&
                task?.taskItem?.id &&
                task?.requiredSkill
            );
            if (!hasPixelTask) return;

            processTasks(items);
        }, 1000);
    };

    const stopWatchingTasks = () => {
        if (taskIntervalId) {
            clearInterval(taskIntervalId);
            taskIntervalId = null;
            console.log('[TASK TRACKER] 🛑 Dừng theo dõi task');
        }
    };

    const observeForTaskPanel = () => {
        const observer = new MutationObserver(() => {
            const taskPanel = document.querySelector('.Store_sell-content-wrapper__MsAMm.commons_scrollArea__dCnqw');
            const items = w?.pga?.store?.taskBoard?.items;
            if (taskPanel && Array.isArray(items) && taskEnabled) {
                console.log('[TASK TRACKER] 🟢 Mở bảng task');
                processTasks(items);
                startWatchingTasks();
            } else {
                stopWatchingTasks();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    const createTaskToggleButton = () => {
        const button = document.createElement('button');
        button.textContent = '🔁 Roll';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            padding: 10px 16px;
            background-color: #3b82f6;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        `;

        button.addEventListener('click', () => {
            taskEnabled = !taskEnabled;
            button.style.backgroundColor = taskEnabled ? '#16a34a' : '#3b82f6';
            button.textContent = taskEnabled ? '🟢 Roll (ON)' : '🔁 Roll (OFF)';
            console.log('[TASK TRACKER] Trạng thái:', taskEnabled ? 'BẬT' : 'TẮT');

            if (taskEnabled) {
                // Tắt 2 feature mining và clear bảng
                featureOneEnabled = false;
                featureTwoEnabled = false;
                const toggleOne = document.getElementById('toggleFeatureOne');
                const toggleTwo = document.getElementById('toggleFeatureTwo');
                if (toggleOne) toggleOne.checked = false;
                if (toggleTwo) toggleTwo.checked = false;
                clearTable();

                // Ẩn UI mining hoàn toàn
                if (featureUIContainer) {
                    featureUIContainer.style.display = 'none';
                }
            } else {
                // Khi roll tắt thì hiện lại UI mining
                if (featureUIContainer) {
                    featureUIContainer.style.display = 'block';
                }
            }
        });

        document.body.appendChild(button);
    };

    // ====== MINING FEATURE ======
    let featureOneEnabled = false;
    let featureTwoEnabled = false;
    let currentLands = [];
    let updateInterval = null;
    let featureUIContainer = null;

    function createToggleUI() {
        const container = document.createElement('div');
        container.id = 'featureControlsContainer';
        container.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            background: #222;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 9999;
            user-select: none;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
        `;
        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label><input type="checkbox" id="toggleFeatureOne"> Bật Nhận</label>
            </div>
            <div>
                <label><input type="checkbox" id="toggleFeatureTwo"> Bật Đào</label>
            </div>
            <div id="landTableContainer" style="margin-top: 12px; max-height: 600px; overflow-y: auto; width: 500px;"></div>
        `;
        document.body.appendChild(container);
        featureUIContainer = container;

        const toggleOne = container.querySelector('#toggleFeatureOne');
        const toggleTwo = container.querySelector('#toggleFeatureTwo');

        toggleOne.addEventListener('change', (e) => {
            if (e.target.checked && featureTwoEnabled) {
                toggleTwo.checked = false;
                featureTwoEnabled = false;
                clearTable();
            }
            featureOneEnabled = e.target.checked;
            console.log('⛏️ Tính năng Timers:', featureOneEnabled ? 'Bật' : 'Tắt');
        });

        toggleTwo.addEventListener('change', (e) => {
            if (e.target.checked && featureOneEnabled) {
                toggleOne.checked = false;
                featureOneEnabled = false;
            }
            featureTwoEnabled = e.target.checked;
            if (!featureTwoEnabled) clearTable();
            console.log('⛏️ Tính năng Ent Mine:', featureTwoEnabled ? 'Bật' : 'Tắt');
        });
    }

    function getTimeFromShortestWaiting(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return `${m ? m + 'm/' : ''}${s % 60}s`;
    }

    function renderLandTable(data) {
        const tableContainer = document.getElementById('landTableContainer');
        if (!tableContainer) return;

        const now = Date.now();
        const blacklist = ['2689'];

        currentLands = (data?.[0]?.public || [])
            .filter(land => land.shortestWaiting > 0 && !blacklist.includes(land.landName.replace('pixelsNFTFarm-', '')))
            .slice(0, 50)
            .map(land => ({ ...land, startTime: now }));

        const table = document.createElement('table');
        table.style.cssText = `width: 100%; border-collapse: collapse; color: white; font-size: 16px;`;

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #333;">
                <th>Land</th><th>Avail/Total</th><th>Countdown</th>
            </tr>`;
        table.appendChild(thead);

        updateLandTable(table);
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        if (currentLands.length && !updateInterval) {
            updateInterval = setInterval(() => updateLandTable(table), 1000);
        }
    }

    function updateLandTable(table) {
        const tbody = document.createElement('tbody');
        const now = Date.now();

        for (const land of currentLands) {
            const cd = Math.max(land.shortestWaiting - (now - land.startTime), 0);
            const landName = land.landName.replace('pixelsNFTFarm-', '');
            const tr = document.createElement('tr');
            tr.style.backgroundColor = cd <= 0 ? '#16a34a' : '#b91c1c';
            tr.style.color = 'white';
            tr.innerHTML = `
                <td>${landName}</td>
                <td>${land.availToMine}/${land.totalMine}</td>
                <td>${getTimeFromShortestWaiting(cd)}</td>`;
            tbody.appendChild(tr);
        }

        // Thay tbody mới
        if (table.tBodies.length) {
            table.replaceChild(tbody, table.tBodies[0]);
        } else {
            table.appendChild(tbody);
        }
    }

    function clearTable() {
        currentLands = [];
        const container = document.getElementById('landTableContainer');
        if (container) container.innerHTML = '';
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    async function fetchTimers() {
        if (!featureOneEnabled) return;
        try {
            const res = await fetch('https://pixels-api.wtf/timers');
            const json = await res.json();
            if (json?.length) {
                renderLandTable(json);
            }
        } catch (e) {
            console.error('[TASK TRACKER] Lỗi fetch timers:', e);
        }
    }

    async function fetchEntMine() {
        if (!featureTwoEnabled) return;
        try {
            const res = await fetch('https://pixels-api.wtf/ent_mine_04');
            const json = await res.json();
            if (json?.length) {
                renderLandTable(json);
            }
        } catch (e) {
            console.error('[TASK TRACKER] Lỗi fetch ent_mine:', e);
        }
    }

    function startMiningWatcher() {
        if (!featureOneEnabled && !featureTwoEnabled) return;
        if (featureOneEnabled) fetchTimers();
        if (featureTwoEnabled) fetchEntMine();

        setInterval(() => {
            if (featureOneEnabled) fetchTimers();
            if (featureTwoEnabled) fetchEntMine();
        }, 6000);
    }

    // === KHỞI TẠO ===
    createTaskToggleButton();
    createToggleUI();
    observeForTaskPanel();
    startWatchingTasks();
    startMiningWatcher();

})();
