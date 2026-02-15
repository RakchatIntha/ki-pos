/**
 * Payment Service — handles payment recording and receipt creation
 */
window.POS = window.POS || {};

POS.PaymentService = {
    processPayment: function(orderId, method, amount) {
        var DS = POS.DataService;
        var order = DS.finalizeOrder(orderId);
        if (!order) return null;

        var receipt = DS.createReceipt(orderId, amount);
        DS.recordPayment(receipt.receipt_no, method, amount);

        return { order: order, receipt: receipt };
    }
};
