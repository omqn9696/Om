(function() {
    'use strict';

    const STORAGE_KEY = 'backlistLand';
    let container = null;

    // Tạo giao diện bảng
    function createBlacklistUI() {
        container = document.createElement('div');
        container.id = 'backlistContainer';
        container.style.position = 'fixed';
        container.style.bottom = '60px';
        container.style.left = '20px';
        container.style.zIndex = '9999';
        container.style.backgroundColor = '#fff';
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.fontSize = '14px';
        container.style.width = '300px';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        container.innerHTML = `
            <h4 style="margin-top:0;">Backlist Land</h4>
            <table id="blacklistTable" border="1" style="width:100%; text-align:left; margin-bottom: 5px;">
              <thead><tr><th>Land</th><th>Xóa</th></tr></thead>
              <tbody></tbody>
            </table>
            <input type="text" id="newLandInput" placeholder="Nhập land..." style="width: 100%; margin-bottom: 5px;">
            <button id="addLandBtn" style="width: 100%;">Thêm back land</button>
        `;
        document.body.appendChild(container);

        const tableBody = container.querySelector('#blacklistTable tbody');
        const input = container.querySelector('#newLandInput');
        const button = container.querySelector('#addLandBtn');

        function loadBlacklist() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        }

        function saveBlacklist(list) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }

        function renderTable() {
            const list = loadBlacklist();
            tableBody.innerHTML = '';
            list.forEach((land, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${land}</td>
                    <td><button data-index="${index}" class="delBtn">X</button></td>
                `;
                tableBody.appendChild(row);
            });

            container.querySelectorAll('.delBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    const list = loadBlacklist();
                    list.splice(index, 1);
                    saveBlacklist(list);
                    renderTable();
                });
            });
        }

        button.addEventListener('click', () => {
            const land = input.value.trim();
            if (land) {
                const list = loadBlacklist();
                if (!list.includes(land)) {
                    list.push(land);
                    saveBlacklist(list);
                    renderTable();
                }
                input.value = '';
            }
        });

        renderTable();
    }

    // Đợi đến khi có nút
    const waitForButton = setInterval(() => {
        const toggleBtn = document.getElementById('blacklistButton');
        if (toggleBtn) {
            clearInterval(waitForButton);
            toggleBtn.addEventListener('click', () => {
                if (document.getElementById('backlistContainer')) {
                    // Nếu đang hiển thị => xóa khỏi DOM
                    container.remove();
                    container = null;
                } else {
                    createBlacklistUI();
                }
            });
        }
    }, 300);
})();
