/**
 * Formatting utilities for Thai baht, dates, etc.
 */
window.POS = window.POS || {};

POS.formatBaht = function(amount) {
    var num = Number(amount) || 0;
    return '\u0E3F' + num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

POS.formatThaiDateTime = function(isoString) {
    var d = new Date(isoString);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

POS.formatTime = function(isoString) {
    var d = new Date(isoString);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

POS.formatReceiptDate = function(date) {
    var d = date instanceof Date ? date : new Date(date);
    var yy = String(d.getFullYear()).slice(-2);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yy + mm + dd;
};
