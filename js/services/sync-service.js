/**
 * Sync Service — Polling สำหรับ real-time updates ระหว่าง 3 เครื่อง
 */
window.POS = window.POS || {};

(function() {
    var _pollTimer = null;
    var _lastSyncTimestamp = null;
    var _listeners = [];

    POS.SyncService = {
        start: function() {
            if (_pollTimer) return; // Already running
            _lastSyncTimestamp = new Date().toISOString();

            var interval = (POS.CONFIG && POS.CONFIG.POLL_INTERVAL) || 3000;
            var self = this;

            _pollTimer = setInterval(function() {
                // Stop polling when tab is hidden (save quota)
                if (document.visibilityState === 'hidden') return;

                self._poll();
            }, interval);

            console.log('[Sync] Started polling every ' + interval + 'ms');
        },

        stop: function() {
            if (_pollTimer) {
                clearInterval(_pollTimer);
                _pollTimer = null;
                console.log('[Sync] Stopped');
            }
        },

        /**
         * Register a listener for updates
         * @param {function} callback - function(data)
         * @returns {function} unsubscribe function
         */
        onUpdate: function(callback) {
            _listeners.push(callback);
            return function() {
                var idx = _listeners.indexOf(callback);
                if (idx >= 0) _listeners.splice(idx, 1);
            };
        },

        /**
         * Force immediate refresh
         */
        forceRefresh: function() {
            this._poll();
        },

        _poll: function() {
            if (!POS.DataService.isOnline()) return;

            POS.ApiClient.get('pollUpdates', {
                since: _lastSyncTimestamp || ''
            }, function(err, data) {
                if (err) {
                    // Silent fail — try again next interval
                    return;
                }

                if (data && data.hasChanges) {
                    // Apply updates to cache
                    POS.DataService.applyPollUpdates(data);

                    // Notify all listeners
                    for (var i = 0; i < _listeners.length; i++) {
                        try {
                            _listeners[i](data);
                        } catch (e) {
                            console.warn('[Sync] Listener error:', e);
                        }
                    }
                }

                // Update timestamp
                if (data && data.serverTimestamp) {
                    _lastSyncTimestamp = data.serverTimestamp;
                }
            });
        }
    };
})();
