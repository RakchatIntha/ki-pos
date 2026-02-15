/**
 * Order Service — business logic for orders
 */
window.POS = window.POS || {};

POS.OrderService = {
    getOrderSummary: function(orderId) {
        var DS = POS.DataService;
        var order = DS.getOrder(orderId);
        if (!order) return null;

        var vatRate = DS.getSysVar('VAT_RATE') || 0;
        var serviceCharge = DS.getSysVar('SERVICE_CHARGE') || 0;
        var subtotal = order.subtotal;
        var vatAmount = subtotal * (vatRate / 100);
        var svcAmount = subtotal * (serviceCharge / 100);
        var grandTotal = subtotal + vatAmount + svcAmount;

        return Object.assign({}, order, {
            vat_rate: vatRate,
            vat_amount: vatAmount,
            service_charge_rate: serviceCharge,
            service_charge_amount: svcAmount,
            grand_total: grandTotal,
            item_count: order.lines.reduce(function(sum, l) { return sum + l.qty; }, 0)
        });
    },

    canCheckout: function(orderId) {
        var order = POS.DataService.getOrder(orderId);
        if (!order || order.lines.length === 0) return false;
        // Can checkout when order is OPEN, COOKING, READY, or SERVED
        return ['OPEN', 'COOKING', 'READY', 'SERVED'].indexOf(order.status) >= 0;
    }
};
