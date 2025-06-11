(function () {
    'use strict';

    // State management
    let featureOneEnabled = false; // API timers
    let featureTwoEnabled = false; // API ent_mine_04
    let currentLands = [];
    let updateInterval = null;
    let taskInterval = null;
    let enabled = false;

    // Constants
    const TELEGRAM_BOT_TOKEN = '7497533128:AAHnXF8-ASqxV3F23IpYsAW94Bl33I9nG7E';
    const TELEGRAM_CHAT_ID = '-1002593215567';
    const BLACKLIST_LAND_IDS = JSON.parse(localStorage.getItem('backlistLand') || '[]');
    //console.log(BLACKLIST_LAND_IDS);
    const WINDOW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // Utility Functions
    const sendPhotoToTelegram = async (photoUrl, caption) => {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, photo: photoUrl, caption })
            });
        } catch (err) {
           // console.error('Telegram send error:', err);
        }
    };

    const formatCaption = (task) =>
        `💸💸💸 ${task.reward.quantity} 💎\n${task.taskItem.name} x${task.taskItem.quantity}\nSkill: ${task.requiredSkill.type}`;

    const sentTaskItemIds = new Set();

    // Task Processing
    const processTasks = (items) => {
        if (!Array.isArray(items)) return;
        for (const task of items) {
            if (task?.reward?.type === 'pixel' && task?.taskItem?.id && task?.taskItem?.icon && task?.requiredSkill) {
                if (!sentTaskItemIds.has(task.taskItem.id)) {
                    sentTaskItemIds.add(task.taskItem.id);
                    sendPhotoToTelegram(task.taskItem.icon, formatCaption(task));
                }
            }
        }
    };

    const startWatchingTasks = () => {
        if (taskInterval) return;
        taskInterval = setInterval(() => {
            if (!enabled) return;
            const items = WINDOW?.pga?.store?.taskBoard?.items;
            if (!Array.isArray(items) || !items.some(task => task?.reward?.type === 'pixel' && task?.taskItem?.id && task?.requiredSkill)) return;
            processTasks(items);
        }, 1000);
    };

    const stopWatchingTasks = () => {
        if (taskInterval) {
            clearInterval(taskInterval);
            taskInterval = null;
        }
    };

    const observeForTaskPanel = () => {
        const observer = new MutationObserver(() => {
            const taskPanel = document.querySelector('.Store_sell-content-wrapper__MsAMm.commons_scrollArea__dCnqw');
            const items = WINDOW?.pga?.store?.taskBoard?.items;
            if (taskPanel && Array.isArray(items) && enabled) {
                processTasks(items);
                startWatchingTasks();
            } else {
                stopWatchingTasks();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    // UI Creation
    const createToggleButton = () => {
        const button = document.createElement('button');
        Object.assign(button.style, {
            position: 'fixed', bottom: '20px', left: '20px', zIndex: '9999',
            padding: '10px 16px', backgroundColor: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)', fontWeight: 'bold',
            transition: 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease',
            outline: 'none'
        });
        button.textContent = '💎';
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('focus', () => {
            button.style.outline = '2px solid #fff';
        });
        button.addEventListener('blur', () => {
            button.style.outline = 'none';
        });
        button.addEventListener('click', () => {
            enabled = !enabled;
            button.style.backgroundColor = enabled ? '#16a34a' : '#3b82f6';
            button.textContent = enabled ? '💎' : '💎';
            const mineBtn = document.getElementById('minebtn');
            if (enabled && mineBtn) {
                mineBtn.remove();
                featureOneEnabled = false;
                featureTwoEnabled = false;
            } else if (!enabled && !mineBtn) {
                createToggleUI();
            }
        });
        document.body.appendChild(button);
    };

    const createToggleUI = () => {
        const container = document.createElement('div');
        container.id = 'minebtn';
        Object.assign(container.style, {
            position: 'fixed', bottom: '70px', right: '20px', background: '#222',
            color: 'white', padding: '12px 16px', borderRadius: '8px', fontFamily: 'Arial, sans-serif',
            fontSize: '14px', zIndex: '9999', userSelect: 'none', boxShadow: '0 0 8px rgba(0,0,0,0.5)',
            width: '150px', transition: 'width 0.3s ease'
        });
        container.innerHTML = `
            <style>
                .icon-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 8px auto;
                    border: none;
                    border-radius: 6px;
                    font-size: 20px;
                    cursor: pointer;
                    transition: transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease, filter 0.2s ease;
                    outline: none;
                }
                .icon-button.off {
                    background-color: #3b82f6;
                    filter: grayscale(70%);
                }
                .icon-button.on {
                    background-color: #16a34a;
                    filter: none;
                }
                .icon-button:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }
                .icon-button:active {
                    transform: scale(0.95);
                }
                .icon-button:focus {
                    outline: 2px solid #fff;
                    outline-offset: 2px;
                }
            </style>
            <button id="toggleFeatureOne" class="icon-button off" title="Toggle Nhận">🎁</button>
            <button id="toggleFeatureTwo" class="icon-button off" title="Toggle Đào">⛏️</button>
             <button id="blacklistButton" class="icon-button off" title="Nhập Blacklist">📋</button>
            <div id="landTableContainer" style="margin-top: 12px; max-height: 700px; overflow-y: auto; width: 500px;"></div>
        `;
        document.body.appendChild(container);

        const toggleOne = container.querySelector('#toggleFeatureOne');
        const toggleTwo = container.querySelector('#toggleFeatureTwo');
        const btntoime = document.getElementById('btntime');


        toggleOne.addEventListener('click', () => {
            featureOneEnabled = !featureOneEnabled;
            if (featureOneEnabled && featureTwoEnabled) {
                featureTwoEnabled = false;
                toggleTwo.classList.remove('on');
                toggleTwo.classList.add('off');
                btntoime.classList.remove('on');
                btntoime.classList.add('off');

            }
            toggleOne.classList.toggle('on', featureOneEnabled);
            toggleOne.classList.toggle('off', !featureOneEnabled);
        });

        toggleTwo.addEventListener('click', () => {
            featureTwoEnabled = !featureTwoEnabled;
            if (featureTwoEnabled && featureOneEnabled) {
                featureOneEnabled = false;
                toggleOne.classList.remove('on');
                toggleOne.classList.add('off');
            }
            toggleTwo.classList.toggle('on', featureTwoEnabled);
             btntoime.classList.toggle('on', featureTwoEnabled);
            toggleTwo.classList.toggle('off', !featureTwoEnabled);
             btntoime.classList.toggle('off', !featureTwoEnabled);

            if (!featureTwoEnabled){clearTable();
            }

        });
    };

    // Table Rendering
    const getTimeFromShortestWaiting = (shortestWaiting) => {
        const totalSeconds = Math.floor(shortestWaiting / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const renderLandTable = (data) => {
        const tableContainer = document.getElementById('landTableContainer');
        if (!tableContainer) return;

        const container = document.getElementById('minebtn');
        if (container) {
            container.style.width = '500px'; // Expand to match table width
        }

        const now = Date.now();
        currentLands = (data?.[0]?.public?.filter(land =>
            land.shortestWaiting > 0 && !BLACKLIST_LAND_IDS.includes(land.landName.replace('pixelsNFTFarm-', ''))
        ) || []).slice(0, 50).map(land => ({
            landName: land.landName,
            numberOfEntities: land.numberOfEntities,
            numberOfAvailableEntities: land.numberOfAvailableEntities,
            shortestWaiting: land.shortestWaiting,
            startTime: now
        }));

        const table = document.createElement('table');
        Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '16px' });
        table.innerHTML = `
            <thead>
                <tr style="background: #333;">
                    <th style="padding: 6px; border: 1px solid #444;">Land</th>
                    <th style="padding: 6px; border: 1px solid #444;">Available|Total Entities</th>
                    <th style="padding: 6px; border: 1px solid #444;">Shortest Waiting</th>
                </tr>
            </thead>
        `;
        updateLandTable(table);
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        if (currentLands.length && !updateInterval) {
            updateInterval = setInterval(() => updateLandTable(table), 1000);
        }
    };

    const updateLandTable = (table) => {
        const tbody = document.createElement('tbody');
        const now = Date.now();
        currentLands = currentLands.filter(land => (now - land.startTime) < land.shortestWaiting);

        if (currentLands.length) {
            currentLands.forEach(land => {
                const remaining = Math.max(0, land.shortestWaiting - (now - land.startTime));
                const cleanLandName = land.landName.replace('pixelsNFTFarm-', '');
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 0px; border: 1px solid #444; text-align: left;">
                            <button style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; transition: transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease;"
                                    onmouseenter="this.style.transform='scale(1.03)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.3)'"
                                    onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"
                                    onmousedown="this.style.transform='scale(0.97)'"
                                    onmouseup="this.style.transform='scale(1.03)'"
                                    onfocus="this.style.outline='2px solid #fff'"
                                    onblur="this.style.outline='none'"
                                    onclick="window.setInputValue('${cleanLandName}')">Land ${cleanLandName}</button>
                        </td>
                        <td style="padding: 6px; border: 1px solid #444; text-align: center;">${land.numberOfAvailableEntities}|${land.numberOfEntities}</td>
                        <td style="padding: 6px; border: 1px solid #444; text-align: center;">${getTimeFromShortestWaiting(remaining)}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="3" style="padding: 6px; border: 1px solid #444; text-align: center;">No data available</td></tr>`;
        }

        const oldTbody = table.querySelector('tbody');
        if (oldTbody) table.replaceChild(tbody, oldTbody);
        else table.appendChild(tbody);

        if (!currentLands.length && updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };

    const clearTable = () => {
        const tableContainer = document.getElementById('landTableContainer');
        const container = document.getElementById('minebtn');
        if (tableContainer) tableContainer.innerHTML = '';
        if (container) container.style.width = '150px'; // Revert to default width
        currentLands = [];
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };

    // API and Data Processing
    const decodeTimers = (base64Str) => {
        try {
            const bytes = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
            return JSON.parse(pako.inflate(bytes, { to: 'string' }));
        } catch (error) {
            //console.error('Error decoding timers:', error);
            return null;
        }
    };

    const filterMineTimers = (timersData) => {
        try {
            const now = Date.now();
            const usedMapId = localStorage.getItem('lastUsedMapId');
            const filteredTimers = timersData.filter(timer =>
                timer.entity?.startsWith('ent_mine') && timer.mapId && !timer.mapId.startsWith('shareRent') && timer.endTime < now
            );

            if (!filteredTimers.length) return '';
            const chosenTimer = filteredTimers.find(t => t.mapId !== usedMapId) || filteredTimers[Math.floor(Math.random() * filteredTimers.length)];
            const cleanMapId = chosenTimer.mapId.replace('pixelsNFTFarm-', '');
            localStorage.setItem('lastUsedMapId', chosenTimer.mapId);
            return cleanMapId;
        } catch (error) {
            //console.error('Error filtering timers:', error);
            return '';
        }
    };

    const processEntMineData = (data) => {
        if (!data?.[0]?.public?.length) return;
        renderLandTable(data);
    };

    const setInputValue = (farmLand) => {
        const input = document.querySelector('.LandAndTravel_numberInput__Re9sf');
        const triggerBox = document.querySelector('.LandAndTravel_option__P_QSA');
        if (!input || !triggerBox) return;

        setTimeout(() => {
            triggerBox.click();
            input.focus();
            input.click();
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, farmLand);
            input.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                if (input.value === farmLand) {
                    const confirmButton = document.querySelector('.LandAndTravel_optionButtons__5tDIJ button');
                    if (confirmButton) {
                        confirmButton.click();
                        clearTable();
                    }
                }
            }, 500);
        }, 500);
    };
    WINDOW.setInputValue = setInputValue;

    const fetchTimers = async () => {
        if (!featureOneEnabled) return;
        const pid = WINDOW.pga?.helpers?.getReduxValue()?.game?.player?.core?.mid || '';
        try {
            const res = await fetch('https://api-pixels.guildpal.com/stats-api/timers/gettimers', {
                method: 'GET',
                headers: { 'x-atomrigs-pga-pid': pid, 'x-atomrigs-pga-version': '1.1.4' }
            });
            const data = await res.json();
            if (data?.data?.timers) {
                const decoded = decodeTimers(data.data.timers);
                if (decoded) setInputValue(filterMineTimers(decoded));
            }
        } catch (err) {
            //console.error('Fetch timers failed:', err);
        }
    };

    const fetchEntMine = async () => {
        if (!featureTwoEnabled) return;
        try {
            const res = await fetch('https://industry.guildpal.com/v2/entities/ent_mine_04?landtypes=space&count=5&includeHouse=false');
            const data = await res.json();
            processEntMineData(data);
        } catch (err) {
            //console.error('Fetch ent_mine failed:', err);
        }
    };

    // Observer Setup
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf')) {
                    if (featureOneEnabled) fetchTimers();
                    if (featureTwoEnabled) fetchEntMine();
                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf') && featureTwoEnabled) {
                    clearTable();
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', createToggleUI);
    createToggleButton();
    observeForTaskPanel();
})();
