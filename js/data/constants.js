/**
 * Constants — สถานะ + labels ภาษาไทย
 */
window.POS = window.POS || {};

POS.ORDER_STATUS = {
    OPEN: 'OPEN',
    COOKING: 'COOKING',
    READY: 'READY',
    SERVED: 'SERVED',
    PAID: 'PAID'
};

POS.LINE_STATUS = {
    PENDING: 'PENDING',
    DONE: 'DONE'
};

POS.ORDER_STATUS_LABELS = {
    OPEN: '\u0E23\u0E2D\u0E17\u0E33',
    COOKING: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33',
    READY: '\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F',
    SERVED: '\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E41\u0E25\u0E49\u0E27',
    PAID: '\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27'
};

POS.LINE_STATUS_LABELS = {
    PENDING: '\u0E23\u0E2D',
    DONE: '\u0E40\u0E2A\u0E23\u0E47\u0E08'
};

// สีสถานะ (ใช้กับ CSS class)
POS.ORDER_STATUS_COLORS = {
    OPEN: 'danger',
    COOKING: 'warning',
    READY: 'success',
    SERVED: 'info',
    PAID: 'muted'
};
