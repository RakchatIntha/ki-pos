/**
 * Role Service — จัดการ role ของแต่ละเครื่อง (sessionStorage)
 */
window.POS = window.POS || {};

POS.RoleService = {
    ROLES: {
        FRONT: {
            key: 'FRONT',
            label: '\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E49\u0E32\u0E19',
            icon: '\uD83C\uDFEA',
            description: '\u0E23\u0E31\u0E1A\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32',
            routes: ['/', '/order']
        },
        KITCHEN: {
            key: 'KITCHEN',
            label: '\u0E04\u0E23\u0E31\u0E27',
            icon: '\uD83D\uDC68\u200D\uD83C\uDF73',
            description: '\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23 + \u0E21\u0E32\u0E23\u0E4C\u0E04\u0E40\u0E2A\u0E23\u0E47\u0E08',
            routes: ['/kitchen']
        },
        CHECKOUT: {
            key: 'CHECKOUT',
            label: '\u0E04\u0E34\u0E14\u0E40\u0E07\u0E34\u0E19',
            icon: '\uD83D\uDCB0',
            description: '\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19 + \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08',
            routes: ['/', '/checkout', '/receipt']
        }
    },

    getCurrentRole: function() {
        try {
            return sessionStorage.getItem('KI_ROLE') || null;
        } catch (e) {
            return null;
        }
    },

    setRole: function(roleKey) {
        try {
            sessionStorage.setItem('KI_ROLE', roleKey);
        } catch (e) {
            // fallback: store in POS namespace
            POS._currentRole = roleKey;
        }
    },

    clearRole: function() {
        try {
            sessionStorage.removeItem('KI_ROLE');
        } catch (e) {}
        POS._currentRole = null;
    },

    canAccessRoute: function(route) {
        var role = this.getCurrentRole() || POS._currentRole;
        if (!role) return false;
        var def = this.ROLES[role];
        if (!def) return false;
        return def.routes.indexOf(route) >= 0;
    },

    getHomeRoute: function() {
        var role = this.getCurrentRole() || POS._currentRole;
        if (role === 'KITCHEN') return '/kitchen';
        return '/'; // FRONT + CHECKOUT both start at table select
    }
};
