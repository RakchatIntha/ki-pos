/**
 * Role Selection Screen — เลือกหน้าที่ (หน้าร้าน / ครัว / คิดเงิน)
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;

    POS.RoleSelectScreen = {
        render: function(container) {
            POS.setHeaderInfo('');

            var wrapper = el('div', 'role-screen');

            var title = el('h2', 'role-screen__title', '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48');
            wrapper.appendChild(title);

            var subtitle = el('p', 'role-screen__subtitle', '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49');
            wrapper.appendChild(subtitle);

            var grid = el('div', 'role-grid');

            var roles = POS.RoleService.ROLES;
            var roleKeys = ['FRONT', 'KITCHEN', 'CHECKOUT'];
            var colorClasses = {
                FRONT: 'role-card--front',
                KITCHEN: 'role-card--kitchen',
                CHECKOUT: 'role-card--checkout'
            };

            roleKeys.forEach(function(key) {
                var role = roles[key];
                var card = el('button', 'role-card ' + colorClasses[key]);
                card.dataset.role = key;

                var icon = el('div', 'role-card__icon', role.icon);
                card.appendChild(icon);

                var label = el('div', 'role-card__label', role.label);
                card.appendChild(label);

                var desc = el('div', 'role-card__desc', role.description);
                card.appendChild(desc);

                grid.appendChild(card);
            });

            wrapper.appendChild(grid);

            // Connection status
            var status = el('div', 'role-screen__status');
            if (POS.DataService.isOnline()) {
                status.innerHTML = '<span class="status-dot status-dot--online"></span> \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Google Sheets \u0E41\u0E25\u0E49\u0E27';
            } else {
                status.innerHTML = '<span class="status-dot status-dot--offline"></span> \u0E42\u0E2B\u0E21\u0E14\u0E2D\u0E2D\u0E1F\u0E44\u0E25\u0E19\u0E4C (\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E33\u0E25\u0E2D\u0E07)';
            }
            wrapper.appendChild(status);

            container.appendChild(wrapper);

            // Event delegation
            grid.addEventListener('click', function(e) {
                var card = e.target.closest('.role-card');
                if (!card) return;
                var roleKey = card.dataset.role;
                POS.RoleService.setRole(roleKey);
                POS.updateHeaderRole();

                // Start sync if online
                if (POS.SyncService && POS.DataService.isOnline()) {
                    POS.SyncService.start();
                }

                POS.Router.navigate(POS.RoleService.getHomeRoute());
            });
        },

        unmount: function() {}
    };
})();
