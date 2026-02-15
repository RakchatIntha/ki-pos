/**
 * API Client — HTTP wrapper สำหรับเรียก Google Apps Script Web App
 */
window.POS = window.POS || {};

(function() {

    POS.ApiClient = {
        _baseUrl: '',
        _timeout: 15000,

        init: function(baseUrl, timeout) {
            this._baseUrl = baseUrl || '';
            if (timeout) this._timeout = timeout;
        },

        isConfigured: function() {
            return !!this._baseUrl;
        },

        /**
         * GET request
         * @param {string} action - API action name
         * @param {object} params - Query parameters
         * @param {function} callback - function(error, data)
         */
        get: function(action, params, callback) {
            if (!this._baseUrl) {
                callback(new Error('API not configured'));
                return;
            }

            var url = this._baseUrl + '?action=' + encodeURIComponent(action);
            var keys = Object.keys(params || {});
            for (var i = 0; i < keys.length; i++) {
                url += '&' + encodeURIComponent(keys[i]) + '=' + encodeURIComponent(params[keys[i]]);
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = this._timeout;

            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            callback(null, response.data);
                        } else {
                            callback(new Error(response.error || 'API error'));
                        }
                    } catch (e) {
                        callback(new Error('Invalid JSON response'));
                    }
                } else {
                    callback(new Error('HTTP ' + xhr.status));
                }
            };

            xhr.onerror = function() {
                callback(new Error('Network error'));
            };

            xhr.ontimeout = function() {
                callback(new Error('Request timeout'));
            };

            xhr.send();
        },

        /**
         * POST request
         * @param {string} action - API action name
         * @param {object} data - Request body
         * @param {function} callback - function(error, data)
         */
        post: function(action, data, callback) {
            if (!this._baseUrl) {
                callback(new Error('API not configured'));
                return;
            }

            var url = this._baseUrl + '?action=' + encodeURIComponent(action);

            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.timeout = this._timeout;
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            callback(null, response.data);
                        } else {
                            callback(new Error(response.error || 'API error'));
                        }
                    } catch (e) {
                        callback(new Error('Invalid JSON response'));
                    }
                } else {
                    callback(new Error('HTTP ' + xhr.status));
                }
            };

            xhr.onerror = function() {
                callback(new Error('Network error'));
            };

            xhr.ontimeout = function() {
                callback(new Error('Request timeout'));
            };

            xhr.send(JSON.stringify(data || {}));
        },

        /**
         * POST แบบ fire-and-forget (ไม่สนใจ response)
         */
        postAsync: function(action, data) {
            this.post(action, data, function(err) {
                if (err) {
                    console.warn('[API] Background POST failed:', action, err.message);
                }
            });
        }
    };

})();
