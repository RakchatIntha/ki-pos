/**
 * DOM helper utilities
 */
window.POS = window.POS || {};

POS.createElement = function(tag, className, textContent) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined && textContent !== null) el.textContent = textContent;
    return el;
};

POS.showToast = function(message, isError) {
    var container = document.getElementById('toast-container');
    var toast = POS.createElement('div', 'toast' + (isError ? ' toast--error' : ''), message);
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
};

POS.setHeaderInfo = function(text) {
    var info = document.getElementById('app-header-info');
    if (info) info.textContent = text;
};
