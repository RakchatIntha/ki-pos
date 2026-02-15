/**
 * Kitchen Display Screen — หน้าจอครัว
 * แสดงรายการอาหารที่ต้องทำ + ปุ่มมาร์คเสร็จ
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;
    var DS, _container, _viewMode, _unsubscribe;

    function resetState() {
        DS = POS.DataService;
        _viewMode = 'chronological'; // or 'per-table'
        _unsubscribe = null;
    }

    function renderToolbar(container) {
        var toolbar = el('div', 'kitchen-toolbar');

        var left = el('div', 'kitchen-toolbar__left');
        var title = el('h2', 'kitchen-toolbar__title', '\u0E04\u0E23\u0E31\u0E27 \u2014 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23');
        left.appendChild(title);

        // Order count badge
        var activeOrders = DS.getActiveOrders();
        var pendingCount = 0;
        activeOrders.forEach(function(o) {
            o.lines.forEach(function(l) {
                if (l.line_status !== 'DONE') pendingCount++;
            });
        });
        if (pendingCount > 0) {
            var badge = el('span', 'kitchen-badge', String(pendingCount) + ' \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E2D');
            left.appendChild(badge);
        }
        toolbar.appendChild(left);

        var right = el('div', 'kitchen-toolbar__right');

        // View toggle
        var toggleBtn = el('button', 'kitchen-toggle-btn');
        toggleBtn.textContent = _viewMode === 'chronological'
            ? '\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E42\u0E15\u0E4A\u0E30'
            : '\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E40\u0E27\u0E25\u0E32';
        toggleBtn.addEventListener('click', function() {
            _viewMode = _viewMode === 'chronological' ? 'per-table' : 'chronological';
            refreshKitchen();
        });
        right.appendChild(toggleBtn);

        // Online indicator
        var statusDot = el('span', 'status-dot ' + (DS.isOnline() ? 'status-dot--online' : 'status-dot--offline'));
        right.appendChild(statusDot);

        toolbar.appendChild(right);
        container.appendChild(toolbar);
    }

    function renderOrders(container) {
        var ordersContainer = el('div', 'kitchen-orders');
        var activeOrders = DS.getActiveOrders();

        if (activeOrders.length === 0) {
            var empty = el('div', 'kitchen-empty');
            empty.appendChild(el('div', 'kitchen-empty__icon', '\u2705'));
            empty.appendChild(el('p', 'kitchen-empty__text', '\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E2D'));
            ordersContainer.appendChild(empty);
            container.appendChild(ordersContainer);
            return;
        }

        if (_viewMode === 'per-table') {
            renderPerTable(ordersContainer, activeOrders);
        } else {
            renderChronological(ordersContainer, activeOrders);
        }

        container.appendChild(ordersContainer);
    }

    function renderChronological(container, orders) {
        orders.forEach(function(order) {
            container.appendChild(createOrderCard(order));
        });
    }

    function renderPerTable(container, orders) {
        // Group by table
        var tables = {};
        orders.forEach(function(order) {
            var tableNo = order.table_no;
            if (!tables[tableNo]) tables[tableNo] = [];
            tables[tableNo].push(order);
        });

        var tableNos = Object.keys(tables).sort(function(a, b) { return Number(a) - Number(b); });

        tableNos.forEach(function(tableNo) {
            var header = el('div', 'kitchen-table-header', '\u0E42\u0E15\u0E4A\u0E30 ' + tableNo);
            container.appendChild(header);

            tables[tableNo].forEach(function(order) {
                container.appendChild(createOrderCard(order));
            });
        });
    }

    function createOrderCard(order) {
        var statusClass = 'kitchen-order-card--' + order.status.toLowerCase();
        var card = el('div', 'kitchen-order-card ' + statusClass);
        card.dataset.orderId = order.order_id;

        // Header
        var header = el('div', 'kitchen-order-card__header');
        var tableLabel = el('span', 'kitchen-order-card__table', '\u0E42\u0E15\u0E4A\u0E30 ' + order.table_no);
        header.appendChild(tableLabel);

        var time = el('span', 'kitchen-order-card__time', POS.formatTime(order.created_at));
        header.appendChild(time);

        var statusLabel = POS.ORDER_STATUS_LABELS[order.status] || order.status;
        var statusBadge = el('span', 'kitchen-status-badge kitchen-status-badge--' + order.status.toLowerCase(), statusLabel);
        header.appendChild(statusBadge);

        card.appendChild(header);

        // Lines
        var linesList = el('div', 'kitchen-order-card__lines');

        if (order.lines && order.lines.length > 0) {
            order.lines.forEach(function(line) {
                var isDone = line.line_status === 'DONE';
                var lineEl = el('div', 'kitchen-line-item' + (isDone ? ' kitchen-line-item--done' : ''));
                lineEl.dataset.lineId = line.order_line_id;

                var info = el('div', 'kitchen-line-item__info');
                info.appendChild(el('span', 'kitchen-line-item__name', line.item_name_th));
                info.appendChild(el('span', 'kitchen-line-item__qty', 'x' + line.qty));
                lineEl.appendChild(info);

                if (!isDone) {
                    var doneBtn = el('button', 'kitchen-done-btn', '\u0E40\u0E2A\u0E23\u0E47\u0E08');
                    doneBtn.dataset.lineId = line.order_line_id;
                    doneBtn.dataset.action = 'mark-done';
                    lineEl.appendChild(doneBtn);
                } else {
                    var doneLabel = el('span', 'kitchen-done-label', '\u2705');
                    lineEl.appendChild(doneLabel);
                }

                linesList.appendChild(lineEl);
            });
        }

        card.appendChild(linesList);

        // Serve button (when ALL lines done)
        var allDone = order.lines && order.lines.length > 0 &&
            order.lines.every(function(l) { return l.line_status === 'DONE'; });

        if (allDone && order.status === 'READY') {
            var serveBtn = el('button', 'kitchen-serve-btn', '\u0E2A\u0E48\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27');
            serveBtn.dataset.orderId = order.order_id;
            serveBtn.dataset.action = 'mark-served';
            card.appendChild(serveBtn);
        }

        return card;
    }

    function handleAction(e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.dataset.action;

        if (action === 'mark-done') {
            var lineId = target.dataset.lineId;
            DS.updateLineStatus(lineId, 'DONE');
            POS.showToast('\u0E21\u0E32\u0E23\u0E4C\u0E04\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27');
            refreshKitchen();
        }

        if (action === 'mark-served') {
            var orderId = target.dataset.orderId;
            DS.updateOrderStatus(orderId, 'SERVED');
            POS.showToast('\u0E2A\u0E48\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27');
            refreshKitchen();
        }
    }

    function refreshKitchen() {
        if (!_container) return;
        _container.innerHTML = '';
        renderToolbar(_container);
        renderOrders(_container);

        // Re-attach event delegation
        _container.addEventListener('click', handleAction);
    }

    POS.KitchenScreen = {
        render: function(container) {
            resetState();
            POS.setHeaderInfo('\u0E04\u0E23\u0E31\u0E27');

            var wrapper = el('div', 'kitchen-screen');
            container.appendChild(wrapper);
            _container = wrapper;

            renderToolbar(wrapper);
            renderOrders(wrapper);

            // Event delegation for the whole screen
            wrapper.addEventListener('click', handleAction);

            // Subscribe to sync updates
            if (POS.SyncService) {
                _unsubscribe = POS.SyncService.onUpdate(function() {
                    refreshKitchen();
                });
            }
        },

        unmount: function() {
            if (_unsubscribe) {
                _unsubscribe();
                _unsubscribe = null;
            }
            _container = null;
        }
    };
})();
