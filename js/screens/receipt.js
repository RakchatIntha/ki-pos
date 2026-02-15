/**
 * Receipt Screen — displays receipt + print button
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;

    function createReceiptTotalRow(label, value, isGrand) {
        var row = el('div', 'receipt-total-row' + (isGrand ? ' receipt-total-row--grand' : ''));
        row.appendChild(el('span', 'receipt-total-row__label', label));
        row.appendChild(el('span', 'receipt-total-row__value', value));
        return row;
    }

    POS.ReceiptScreen = {
        render: function(container) {
            var orderId = POS.AppState.currentOrderId;
            var data = POS.ReceiptService.getReceiptData(orderId);

            if (!data) { POS.Router.navigate('/'); return; }

            var receipt = data.receipt;
            var order = data.order;
            var payments = data.payments;
            POS.setHeaderInfo('\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 ' + receipt.receipt_no);

            var wrapper = el('div', 'receipt-screen');
            var receiptEl = el('div', 'receipt-container');
            receiptEl.id = 'receipt-printable';

            // Header
            var header = el('div', 'receipt-header');
            header.appendChild(el('h2', 'receipt-shop-name', data.shopName));
            if (data.shopAddress) header.appendChild(el('p', 'receipt-shop-info', data.shopAddress));
            if (data.shopPhone) header.appendChild(el('p', 'receipt-shop-info', '\u0E42\u0E17\u0E23: ' + data.shopPhone));
            header.appendChild(el('div', 'receipt-divider'));
            header.appendChild(el('p', 'receipt-no', '\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48: ' + receipt.receipt_no));
            header.appendChild(el('p', 'receipt-meta', '\u0E42\u0E15\u0E4A\u0E30: ' + order.table_no));
            header.appendChild(el('p', 'receipt-meta', '\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ' + POS.formatThaiDateTime(receipt.issued_at)));
            receiptEl.appendChild(header);

            receiptEl.appendChild(el('div', 'receipt-divider'));

            // Items
            var itemsSection = el('div', 'receipt-items');
            var headerRow = el('div', 'receipt-item-row receipt-item-row--header');
            headerRow.appendChild(el('span', 'receipt-col-name', '\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'));
            headerRow.appendChild(el('span', 'receipt-col-qty', '\u0E08\u0E33\u0E19\u0E27\u0E19'));
            headerRow.appendChild(el('span', 'receipt-col-price', '\u0E23\u0E32\u0E04\u0E32'));
            headerRow.appendChild(el('span', 'receipt-col-total', '\u0E23\u0E27\u0E21'));
            itemsSection.appendChild(headerRow);

            // Read from ORDER LINES (snapshot prices)
            order.lines.forEach(function(line) {
                var row = el('div', 'receipt-item-row');
                row.appendChild(el('span', 'receipt-col-name', line.item_name_th));
                row.appendChild(el('span', 'receipt-col-qty', String(line.qty)));
                row.appendChild(el('span', 'receipt-col-price', POS.formatBaht(line.unit_price)));
                row.appendChild(el('span', 'receipt-col-total', POS.formatBaht(line.line_total)));
                itemsSection.appendChild(row);
            });
            receiptEl.appendChild(itemsSection);

            receiptEl.appendChild(el('div', 'receipt-divider'));

            // Totals
            var totals = el('div', 'receipt-totals');
            totals.appendChild(createReceiptTotalRow('\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21', POS.formatBaht(order.subtotal)));
            totals.appendChild(createReceiptTotalRow('\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34', POS.formatBaht(order.grand_total), true));

            var methodLabels = { CASH: '\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14', QR: 'QR Code' };
            payments.forEach(function(p) {
                totals.appendChild(createReceiptTotalRow(
                    '\u0E0A\u0E33\u0E23\u0E30 (' + (methodLabels[p.method] || p.method) + ')',
                    POS.formatBaht(p.amount)
                ));
            });
            receiptEl.appendChild(totals);

            receiptEl.appendChild(el('div', 'receipt-divider'));

            // Footer
            var footer = el('div', 'receipt-footer');
            footer.appendChild(el('p', 'receipt-thank-you', '\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23'));
            if (receipt.print_count > 0) {
                footer.appendChild(el('p', 'receipt-print-note', '\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48 ' + (receipt.print_count + 1)));
            }
            receiptEl.appendChild(footer);
            wrapper.appendChild(receiptEl);

            // Action buttons
            var actions = el('div', 'receipt-actions no-print');
            var printBtn = el('button', 'btn-print', '\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08');
            printBtn.addEventListener('click', function() {
                POS.ReceiptService.printReceipt(receipt.receipt_no);
            });
            actions.appendChild(printBtn);

            var homeBtn = el('button', 'btn-home', '\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01');
            homeBtn.addEventListener('click', function() {
                POS.AppState.clear();
                POS.Router.navigate('/');
            });
            actions.appendChild(homeBtn);

            wrapper.appendChild(actions);
            container.appendChild(wrapper);
        },

        unmount: function() {}
    };
})();
