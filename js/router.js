/**
 * Simple hash-based SPA router with role-based guards
 */
window.POS = window.POS || {};

(function() {
    var routes = {};
    var currentScreen = null;

    POS.Router = {
        register: function(path, screenModule) {
            routes[path] = screenModule;
        },

        navigate: function(path) {
            window.location.hash = path;
        },

        start: function() {
            var self = this;
            window.addEventListener('hashchange', function() { self._handleRoute(); });
            this._handleRoute();
        },

        _handleRoute: function() {
            var hash = window.location.hash.slice(1) || '/';

            // Role guard: redirect to role-select if no role chosen
            if (POS.RoleService) {
                var role = POS.RoleService.getCurrentRole();
                if (!role && hash !== '/role-select') {
                    this.navigate('/role-select');
                    return;
                }

                // Check route access (skip for role-select page)
                if (role && hash !== '/role-select' && !POS.RoleService.canAccessRoute(hash)) {
                    POS.showToast('\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49', true);
                    this.navigate(POS.RoleService.getHomeRoute());
                    return;
                }
            }

            var screen = routes[hash];

            if (!screen) {
                this.navigate('/');
                return;
            }

            if (currentScreen && currentScreen.unmount) {
                currentScreen.unmount();
            }

            var container = document.getElementById('app-content');
            container.innerHTML = '';
            screen.render(container);
            currentScreen = screen;
        }
    };
})();
