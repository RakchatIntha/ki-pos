/**
 * Receipt Service — receipt number generation + idempotency
 */
window.POS = window.POS || {};

POS.ReceiptService = {
    getOrCreateReceipt: function(orderId, paidTotal) {
        return POS.DataService.createReceipt(orderId, paidTotal);
    },

    getReceiptForOrder: function(orderId) {
        return POS.DataService.getReceiptByOrderId(orderId);
    },

    printReceipt: function(receiptNo) {
        POS.DataService.incrementPrintCount(receiptNo);
        window.print();
    },

    getReceiptData: function(orderId) {
        var DS = POS.DataService;
        var receipt = DS.getReceiptByOrderId(orderId);
        if (!receipt) return null;

        return {
            receipt: receipt,
            order: DS.getOrder(orderId),
            payments: DS.getPaymentsByReceipt(receipt.receipt_no),
            shopName: DS.getSysVar('SHOP_NAME') || '\u0E04\u0E23\u0E31\u0E27\u0E2D\u0E34\u0E19\u0E17\u0E23\u0E31\u0E01\u0E29\u0E4C',
            shopAddress: DS.getSysVar('SHOP_ADDRESS') || '',
            shopPhone: DS.getSysVar('SHOP_PHONE') || ''
        };
    }
};
