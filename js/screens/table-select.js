/**
 * Table Selection Screen — 4x3 grid of 12 tables with status colors
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;
    var _unsubscribe = null;
    var _container = null;

    function getStatusClass(status) {
        switch (status) {
            case 'AVAILABLE': return 'table-card--available';
            case 'OPEN': return 'table-card--open';
            case 'COOKING': return 'table-card--cooking';
            case 'READY': return 'table-card--ready';
            case 'SERVED': return 'table-card--served';
            default: return 'table-card--available';
        }
    }

    function getStatusLabel(status) {
        if (status === 'AVAILABLE') return '\u0E27\u0E48\u0E32\u0E07';
        return POS.ORDER_STATUS_LABELS[status] || status;
    }

    function renderGrid(container) {
        var DS = POS.DataService;
        var tableStatuses = DS.getTableStatuses();
        var tableCount = DS.getTableCount();

        var wrapper = el('div', 'table-screen');
        var title = el('h2', 'table-screen__title', '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E15\u0E4A\u0E30');
        wrapper.appendChild(title);

        var grid = el('div', 'table-grid');

        for (var i = 1; i <= tableCount; i++) {
            var info = tableStatuses[i] || { status: 'AVAILABLE' };
            var statusClass = getStatusClass(info.status);
            var card = el('button', 'table-card ' + statusClass);
            card.dataset.tableNo = i;
            if (info.orderId) card.dataset.orderId = info.orderId;

            card.appendChild(el('span', 'table-card__number', '\u0E42\u0E15\u0E4A\u0E30 ' + i));
            card.appendChild(el('span', 'table-card__status', getStatusLabel(info.status)));

            grid.appendChild(card);
        }

        wrapper.appendChild(grid);
        container.appendChild(wrapper);

        // Event delegation
        grid.addEventListener('click', function(e) {
            var card = e.target.closest('.table-card');
            if (!card) return;

            var tableNo = Number(card.dataset.tableNo);
            var DS = POS.DataService;
            var existingOrder = DS.getOpenOrderByTable(tableNo);
            var role = POS.RoleService ? POS.RoleService.getCurrentRole() : 'FRONT';

            POS.AppState.setTable(tableNo);

            if (existingOrder) {
                POS.AppState.setOrder(existingOrder.order_id);
            } else {
                // Create new order only if FRONT role
                if (role === 'CHECKOUT') {
                    POS.showToast('\u0E42\u0E15\u0E4A\u0E30\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C', true);
                    return;
                }
                var newOrder = DS.createOrder(tableNo);
                POS.AppState.setOrder(newOrder.order_id);
            }

            // Navigate based on role
            if (role === 'CHECKOUT') {
                POS.Router.navigate('/checkout');
            } else {
                POS.Router.navigate('/order');
            }
        });
    }

    POS.TableSelectScreen = {
        render: function(container) {
            _container = container;
            POS.setHeaderInfo('');
            renderGrid(container);

            // Subscribe to sync updates
            if (POS.SyncService) {
                _unsubscribe = POS.SyncService.onUpdate(function() {
                    _container.innerHTML = '';
                    renderGrid(_container);
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
