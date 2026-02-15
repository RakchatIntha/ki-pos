/**
 * localStorage wrapper with KI_ namespace prefix
 * Falls back to in-memory storage when localStorage is blocked (file:// protocol)
 */
window.POS = window.POS || {};

(function() {
    var PREFIX = 'KI_';

    // Test if localStorage is available
    var useLocalStorage = false;
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        useLocalStorage = true;
    } catch (e) {
        console.warn('[POS] localStorage not available, using in-memory storage');
    }

    // In-memory fallback
    var memoryStore = {};

    POS.Storage = {
        _PREFIX: PREFIX,

        get: function(key) {
            try {
                var raw;
                if (useLocalStorage) {
                    raw = localStorage.getItem(PREFIX + key);
                } else {
                    raw = memoryStore[PREFIX + key] || null;
                }
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },

        set: function(key, value) {
            var json = JSON.stringify(value);
            if (useLocalStorage) {
                try {
                    localStorage.setItem(PREFIX + key, json);
                } catch (e) {
                    memoryStore[PREFIX + key] = json;
                }
            } else {
                memoryStore[PREFIX + key] = json;
            }
        },

        remove: function(key) {
            if (useLocalStorage) {
                try { localStorage.removeItem(PREFIX + key); } catch (e) {}
            }
            delete memoryStore[PREFIX + key];
        },

        has: function(key) {
            if (useLocalStorage) {
                try {
                    return localStorage.getItem(PREFIX + key) !== null;
                } catch (e) {
                    return (PREFIX + key) in memoryStore;
                }
            }
            return (PREFIX + key) in memoryStore;
        },

        clearAll: function() {
            if (useLocalStorage) {
                try {
                    var keysToRemove = [];
                    for (var i = 0; i < localStorage.length; i++) {
                        var k = localStorage.key(i);
                        if (k && k.indexOf(PREFIX) === 0) {
                            keysToRemove.push(k);
                        }
                    }
                    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
                } catch (e) {}
            }
            // Clear memory store too
            var keys = Object.keys(memoryStore);
            for (var j = 0; j < keys.length; j++) {
                if (keys[j].indexOf(PREFIX) === 0) {
                    delete memoryStore[keys[j]];
                }
            }
        }
    };
})();
