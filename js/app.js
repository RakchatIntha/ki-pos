/**
 * App entry point — initialization, state, and route registration
 */
window.POS = window.POS || {};

// Global application state
POS.AppState = {
    currentTable: null,
    currentOrderId: null,

    setTable: function(tableNo) {
        this.currentTable = tableNo;
        this.currentOrderId = null;
    },

    setOrder: function(orderId) {
        this.currentOrderId = orderId;
    },

    clear: function() {
        this.currentTable = null;
        this.currentOrderId = null;
    }
};

function showLoading() {
    var content = document.getElementById('app-content');
    if (content) {
        content.innerHTML = '<div class="loading-screen">' +
            '<div class="loading-screen__spinner"></div>' +
            '<p>\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D...</p></div>';
    }
}

function updateHeaderRole() {
    if (!POS.RoleService) return;
    var role = POS.RoleService.getCurrentRole();
    var badge = document.getElementById('app-role-badge');
    var changeBtn = document.getElementById('btn-change-role');

    if (badge) {
        if (role) {
            var def = POS.RoleService.ROLES[role];
            badge.textContent = def.icon + ' ' + def.label;
            badge.className = 'role-badge role-badge--' + role.toLowerCase();
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    }

    if (changeBtn) {
        changeBtn.style.display = role ? '' : 'none';
        // Remove old listener by replacing element
        var newBtn = changeBtn.cloneNode(true);
        changeBtn.parentNode.replaceChild(newBtn, changeBtn);
        newBtn.addEventListener('click', function() {
            POS.RoleService.clearRole();
            POS.AppState.clear();
            if (POS.SyncService) POS.SyncService.stop();
            POS.Router.navigate('/role-select');
            updateHeaderRole();
        });
    }
}

// Make updateHeaderRole available globally
POS.updateHeaderRole = updateHeaderRole;

function init() {
    try {
        showLoading();
        console.log('[POS] Starting initialization...');

        POS.DataService.initialize(function() {
            console.log('[POS] DataService initialized');

            // Register all routes
            POS.Router.register('/role-select', POS.RoleSelectScreen);
            POS.Router.register('/', POS.TableSelectScreen);
            POS.Router.register('/order', POS.OrderScreen);
            POS.Router.register('/checkout', POS.CheckoutScreen);
            POS.Router.register('/receipt', POS.ReceiptScreen);
            POS.Router.register('/kitchen', POS.KitchenScreen);
            POS.Router.register('/menu-manage', POS.MenuManageScreen);
            console.log('[POS] Routes registered');

            // Start sync service (if online)
            if (POS.SyncService && POS.DataService.isOnline()) {
                POS.SyncService.start();
                console.log('[POS] SyncService started');
            }

            // Start router
            POS.Router.start();
            console.log('[POS] Router started');

            // Update header
            updateHeaderRole();
        });
    } catch (err) {
        console.error('[POS] Init error:', err);
        var content = document.getElementById('app-content');
        if (content) {
            content.innerHTML = '<div style="padding:20px;color:red;font-size:18px;">' +
                '<h2>Error:</h2><pre>' + err.message + '\n\n' + err.stack + '</pre></div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
