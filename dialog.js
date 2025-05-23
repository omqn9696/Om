(function () {
    'use strict';

    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

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

    let intervalId = null;
    let enabled = false;

    const startWatchingTasks = () => {
        if (intervalId) return;

        intervalId = setInterval(() => {
            if (!enabled) return;
            const items = w?.pga?.store?.taskBoard?.items;
            if (!Array.isArray(items)) return;

            const hasFullTasks = items.some(
                (task) =>
                    task?.reward?.type === 'pixel' &&
                    task?.taskItem?.id &&
                    task?.requiredSkill
            );
            if (!hasFullTasks) return;

            processTasks(items);
        }, 1000);
    };

    const stopWatchingTasks = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log('[TASK TRACKER] 🛑 Dừng theo dõi task');
        }
    };

    const observeForTaskPanel = () => {
        const observer = new MutationObserver(() => {
            const taskPanel = document.querySelector('.Store_sell-content-wrapper__MsAMm.commons_scrollArea__dCnqw');
            const items = w?.pga?.store?.taskBoard?.items;

            if (taskPanel && Array.isArray(items) && enabled) {
                console.log('[TASK TRACKER] 🟢 Mở bảng task');
                processTasks(items);
                startWatchingTasks();
            } else {
                stopWatchingTasks();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    const createToggleButton = () => {
        const button = document.createElement('button');
        button.textContent = '🔁 Roll';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.left = '20px';
        button.style.zIndex = '9999';
        button.style.padding = '10px 16px';
        button.style.backgroundColor = '#3b82f6';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

        button.addEventListener('click', () => {
            enabled = !enabled;
            button.style.backgroundColor = enabled ? '#16a34a' : '#3b82f6';
            button.textContent = enabled ? '🟢 Roll (ON)' : '🔁 Roll (OFF)';
            console.log('[TASK TRACKER] Trạng thái:', enabled ? 'BẬT' : 'TẮT');
        });

        document.body.appendChild(button);
    };

    createToggleButton();
    observeForTaskPanel();
})();
(function() {
    'use strict';

    let featureOneEnabled = false; // Tính năng 1 (API timers)
    let featureTwoEnabled = false; // Tính năng 2 (API ent_mine_04)
    let currentLands = []; // Lưu danh sách land để đếm ngược
    let updateInterval = null; // Interval cho đếm ngược

    // Tạo hộp thoại toggle và container cho bảng
    function createToggleUI() {
        const container = document.createElement('div');
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
                <label style="cursor:pointer; display:flex; align-items:center;">
                    <input type="checkbox" id="toggleFeatureOne" style="margin-right:6px; vertical-align:middle;">
                    Bật Nhận
                </label>
            </div>
            <div>
                <label style="cursor:pointer; display:flex; align-items:center;">
                    <input type="checkbox" id="toggleFeatureTwo" style="margin-right:6px; vertical-align:middle;">
                    Bật Đào
                </label>
            </div>
            <div id="landTableContainer" style="margin-top: 12px; max-height: 700px; overflow-y: auto; width: 500px;"></div>
        `;

        document.body.appendChild(container);

        const toggleOne = container.querySelector('#toggleFeatureOne');
        const toggleTwo = container.querySelector('#toggleFeatureTwo');

        toggleOne.addEventListener('change', (e) => {
            if (e.target.checked && featureTwoEnabled) {
                toggleTwo.checked = false;
                featureTwoEnabled = false;
                clearTable();
            }
            featureOneEnabled = e.target.checked;
            console.log('Tính năng Timers API:', featureOneEnabled ? 'Bật' : 'Tắt');
        });

        toggleTwo.addEventListener('change', (e) => {
            if (e.target.checked && featureOneEnabled) {
                toggleOne.checked = false;
                featureOneEnabled = false;
            }
            featureTwoEnabled = e.target.checked;
            if (!featureTwoEnabled) clearTable();
            console.log('Tính năng Ent Mine API:', featureTwoEnabled ? 'Bật' : 'Tắt');
        });
    }

    // Chuyển đổi shortestWaiting sang định dạng mm:ss
    function getTimeFromShortestWaiting(shortestWaiting) {
        const giayTong = Math.floor(shortestWaiting / 1000); // Chuyển mili-giây thành giây
        const phut = Math.floor(giayTong / 60); // Tính số phút
        const giay = giayTong % 60; // Tính số giây còn lại

        let result = '';
        if (phut > 0) {
            result += `${phut}m/`;
        }
        if (giay > 0 || phut === 0) { // Hiển thị giây ngay cả khi là 0, trừ khi có phút
            result += `${giay}s`;
        }

        return result.trim(); // Loại bỏ khoảng trắng thừa
    }

    // Tạo và cập nhật bảng hiển thị (nút Land {landName}, loại bỏ shortestWaiting = 0, đếm ngược)
    function renderLandTable(data) {
    const tableContainer = document.getElementById('landTableContainer');
    if (!tableContainer) return;

    const now = Date.now();

    // Danh sách land cần loại bỏ
    const blacklistLandIds = ['2689'];

    currentLands = (data?.[0]?.public?.filter(land => {
        const landName = land.landName.replace('pixelsNFTFarm-', '');
        return land.shortestWaiting > 0 && !blacklistLandIds.includes(landName);
    }) || [])
        .slice(0, 50)
        .map(land => ({
            landName: land.landName,
            numberOfEntities: land.numberOfEntities,
            numberOfAvailableEntities: land.numberOfAvailableEntities,
            shortestWaiting: land.shortestWaiting,
            startTime: now
        }));

    // Tạo bảng
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        color: white;
        font-size: 16px;
    `;

    // Tạo header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #333;">
            <th style="padding: 6px; border: 1px solid #444;">Land</th>
            <th style="padding: 6px; border: 1px solid #444;">Available|Total Entities</th>
            <th style="padding: 6px; border: 1px solid #444;">Shortest Waiting</th>
        </tr>
    `;
    table.appendChild(thead);

    // Tạo body
    updateLandTable(table);

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // Bắt đầu interval để cập nhật đếm ngược
    if (currentLands.length && !updateInterval) {
        updateInterval = setInterval(() => {
            updateLandTable(table);
        }, 1000);
    }
}

    // Cập nhật bảng với thời gian đếm ngược và nút Land {landName}
    function updateLandTable(table) {
        const tbody = document.createElement('tbody');
        const now = Date.now();

        // Lọc và cập nhật land
        currentLands = currentLands.filter(land => {
            const elapsed = now - land.startTime;
            const remaining = land.shortestWaiting - elapsed;
            return remaining > 0;
        });

        if (currentLands.length) {
            currentLands.forEach(land => {
                const elapsed = now - land.startTime;
                const remaining = Math.max(0, land.shortestWaiting - elapsed);
                const cleanLandName = land.landName.replace('pixelsNFTFarm-', '');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 0px; border: 1px solid #444; text-align: left;" onclick="window.setInputValue('${cleanLandName}')">
                        <button style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;width: 100%;"
                                >Land ${cleanLandName}</button>
                    </td>
                    <td style="padding: 6px; border: 1px solid #444; text-align: center;">
                        ${land.numberOfAvailableEntities}|${land.numberOfEntities}
                    </td>
                    <td style="padding: 6px; border: 1px solid #444; text-align: center;">
                        ${getTimeFromShortestWaiting(remaining)}
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" style="padding: 6px; border: 1px solid #444; text-align: center;">
                    No data available
                </td>
            `;
            tbody.appendChild(row);
        }

        // Thay thế tbody cũ
        const oldTbody = table.querySelector('tbody');
        if (oldTbody) {
            table.replaceChild(tbody, oldTbody);
        } else {
            table.appendChild(tbody);
        }

        // Dừng interval nếu không còn land
        if (!currentLands.length && updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    // Xóa bảng khi tắt tính năng, sau khi chọn, hoặc khi hộp thoại tắt
    function clearTable() {
        const tableContainer = document.getElementById('landTableContainer');
        if (tableContainer) tableContainer.innerHTML = '';
        currentLands = [];
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    // Giải mã Base64 và Gzip cho tính năng 1
    function decodeTimers(base64Str) {
        try {
            const binaryStr = atob(base64Str);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            const decompressed = pako.inflate(bytes, { to: 'string' });
            return JSON.parse(decompressed);
        } catch (error) {
            console.error('Error decoding timers:', error);
            return null;
        }
    }

    // Lọc timers cho tính năng 1
    function filterMineTimers(timersData) {
        try {
            const now = Date.now();
            const usedMapId = localStorage.getItem('lastUsedMapId');

            const filteredTimers = timersData.filter(timer =>
                timer.entity?.startsWith('ent_mine') &&
                timer.mapId &&
                !timer.mapId.startsWith('shareRent') &&
                timer.endTime < now
            );

            if (filteredTimers.length === 0) return '';

            let chosenTimer = filteredTimers.find(t => t.mapId !== usedMapId);
            if (!chosenTimer) {
                chosenTimer = filteredTimers[0];
            } else {
                const differentMapIds = filteredTimers.filter(t => t.mapId !== usedMapId);
                chosenTimer = differentMapIds[Math.floor(Math.random() * differentMapIds.length)];
            }

            const cleanMapId = chosenTimer.mapId.replace("pixelsNFTFarm-", "");
            localStorage.setItem('lastUsedMapId', chosenTimer.mapId);
            return cleanMapId;
        } catch (error) {
            console.error('❌ Lỗi lọc timers:', error);
            return '';
        }
    }

    // Xử lý dữ liệu API ent_mine_04 cho tính năng 2
    function processEntMineData(data) {
        try {
            if (!data?.[0]?.public?.length) return;

            // Chỉ hiển thị bảng, không tự động nhập
            renderLandTable(data);
        } catch (error) {
            console.error('❌ Lỗi xử lý ent_mine data:', error);
        }
    }

    // Điền giá trị vào input và xóa bảng
    function setInputValue(farmLand) {
        const input = document.querySelector('.LandAndTravel_numberInput__Re9sf');
        const triggerBox = document.querySelector('.LandAndTravel_option__P_QSA');

        if (!input || !triggerBox) return;

        setTimeout(() => {
            triggerBox.click();
            input.focus();
            input.click();

            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, farmLand);
            input.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                if (input.value === farmLand) {
                    const confirmButton = document.querySelector('.LandAndTravel_optionButtons__5tDIJ button');
                    if (confirmButton) {
                        confirmButton.click();
                        clearTable(); // Xóa bảng sau khi click confirm
                    }
                }
            }, 500);
        }, 500);
    }

    // Gắn setInputValue vào window để nút Land gọi được
    window.setInputValue = setInputValue;

    // Gọi API cho tính năng 1
    function fetchTimers() {
        if (!featureOneEnabled) return;
const pid = window.pga?.helpers?.getReduxValue()?.game?.player?.core?.mid || '';
        fetch('https://api-pixels.guildpal.com/stats-api/timers/gettimers', {
            method: 'GET',
            headers: {
                'x-atomrigs-pga-pid': pid,
                'x-atomrigs-pga-version': '1.1.4'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data?.data?.timers) {
                const decoded = decodeTimers(data.data.timers);
                if (decoded) {
                    const farmLand = filterMineTimers(decoded);
                    setInputValue(farmLand);
                }
            }
        })
        .catch(err => console.error('❌ Fetch timers failed:', err));
    }

    // Gọi API cho tính năng 2
    function fetchEntMine() {
        if (!featureTwoEnabled) return;

        fetch('https://industry.guildpal.com/v2/entities/ent_mine_04?landtypes=space&count=5&includeHouse=false', {
            method: 'GET'
        })
        .then(res => res.json())
        .then(data => {
            processEntMineData(data);
        })
        .catch(err => console.error('❌ Fetch ent_mine failed:', err));
    }

    // Theo dõi input xuất hiện và biến mất
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Kiểm tra node được thêm
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf')) {
                    if (featureOneEnabled) fetchTimers();
                    if (featureTwoEnabled) fetchEntMine();
                }
            }
            // Kiểm tra node bị xóa
            for (const node of mutation.removedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf')) {
                    if (featureTwoEnabled) clearTable(); // Xóa bảng khi hộp thoại tắt
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('load', createToggleUI);
})();
