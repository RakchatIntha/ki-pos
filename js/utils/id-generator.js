/**
 * Simple ID generation utilities
 */
window.POS = window.POS || {};

POS.generateId = function(prefix) {
    prefix = prefix || '';
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substring(2, 8);
    return prefix ? (prefix + '_' + timestamp + '_' + random) : (timestamp + '_' + random);
};
