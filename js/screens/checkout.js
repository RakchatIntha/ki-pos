/**
 * Checkout Screen — order summary + payment method selection
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;
    var _processing = false;

    function createTotalRow(label, value, isGrand) {
        var row = el('div', 'checkout-total-row' + (isGrand ? ' checkout-total-row--grand' : ''));
        row.appendChild(el('span', 'checkout-total-row__label', label));
        row.appendChild(el('span', 'checkout-total-row__value', value));
        return row;
    }

    POS.CheckoutScreen = {
        render: function(container) {
            var DS = POS.DataService;
            var orderId = POS.AppState.currentOrderId;
            var summary = POS.OrderService.getOrderSummary(orderId);

            if (!summary) { POS.Router.navigate('/'); return; }

            POS.setHeaderInfo('\u0E42\u0E15\u0E4A\u0E30 ' + POS.AppState.currentTable + ' \u2014 \u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19');
            _processing = false;

            var wrapper = el('div', 'checkout-screen');

            // Left: Order summary
            var summaryPanel = el('div', 'checkout-summary');
            summaryPanel.appendChild(el('h2', 'checkout-summary__title', '\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D'));

            var itemsList = el('div', 'checkout-items');
            summary.lines.forEach(function(line) {
                var row = el('div', 'checkout-item');
                var nameCol = el('div', 'checkout-item__name');
                nameCol.appendChild(el('span', '', line.item_name_th));
                nameCol.appendChild(el('span', 'text-muted text-sm', ' x' + line.qty));
                row.appendChild(nameCol);
                row.appendChild(el('span', 'checkout-item__total', POS.formatBaht(line.line_total)));
                itemsList.appendChild(row);
            });
            summaryPanel.appendChild(itemsList);

            var totals = el('div', 'checkout-totals');
            totals.appendChild(createTotalRow('\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21', POS.formatBaht(summary.subtotal)));
            if (summary.vat_rate > 0) {
                totals.appendChild(createTotalRow('VAT (' + summary.vat_rate + '%)', POS.formatBaht(summary.vat_amount)));
            }
            if (summary.service_charge_rate > 0) {
                totals.appendChild(createTotalRow('Service Charge (' + summary.service_charge_rate + '%)', POS.formatBaht(summary.service_charge_amount)));
            }
            totals.appendChild(createTotalRow('\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34', POS.formatBaht(summary.grand_total), true));
            summaryPanel.appendChild(totals);
            wrapper.appendChild(summaryPanel);

            // Right: Payment panel
            var paymentPanel = el('div', 'checkout-payment');
            paymentPanel.appendChild(el('h2', 'checkout-payment__title', '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E34\u0E18\u0E35\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19'));

            var grandDisplay = el('div', 'checkout-grand-total');
            grandDisplay.appendChild(el('span', 'checkout-grand-total__label', '\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E0A\u0E33\u0E23\u0E30'));
            grandDisplay.appendChild(el('span', 'checkout-grand-total__value', POS.formatBaht(summary.grand_total)));
            paymentPanel.appendChild(grandDisplay);

            var methods = DS.getPaymentMethods();
            var methodsContainer = el('div', 'checkout-methods');
            var methodLabels = { CASH: '\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14', QR: 'QR Code' };
            var methodIcons = { CASH: '\uD83D\uDCB5', QR: '\uD83D\uDCF1' };

            methods.forEach(function(method) {
                var btn = el('button', 'method-btn');
                btn.dataset.method = method;
                btn.appendChild(el('span', 'method-btn__icon', methodIcons[method] || ''));
                btn.appendChild(el('span', 'method-btn__label', methodLabels[method] || method));
                methodsContainer.appendChild(btn);
            });
            paymentPanel.appendChild(methodsContainer);

            // Cash section
            var cashSection = el('div', 'cash-section hidden');
            cashSection.id = 'cash-section';
            cashSection.appendChild(el('label', 'cash-section__label', '\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)'));
            var cashInput = el('input', 'cash-section__input');
            cashInput.type = 'number'; cashInput.id = 'cash-input';
            cashInput.min = summary.grand_total; cashInput.placeholder = String(summary.grand_total);
            cashSection.appendChild(cashInput);
            var changeDisplay = el('div', 'cash-section__change');
            changeDisplay.id = 'change-display';
            changeDisplay.textContent = '\u0E40\u0E07\u0E34\u0E19\u0E17\u0E2D\u0E19: \u0E3F0';
            cashSection.appendChild(changeDisplay);
            paymentPanel.appendChild(cashSection);

            var confirmBtn = el('button', 'btn-confirm-payment hidden', '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19');
            confirmBtn.id = 'btn-confirm';
            paymentPanel.appendChild(confirmBtn);

            var backBtn = el('button', 'btn-back-to-order', '\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23');
            paymentPanel.appendChild(backBtn);
            wrapper.appendChild(paymentPanel);
            container.appendChild(wrapper);

            // === Events ===
            var selectedMethod = null;

            methodsContainer.addEventListener('click', function(e) {
                var btn = e.target.closest('.method-btn');
                if (!btn) return;
                selectedMethod = btn.dataset.method;
                methodsContainer.querySelectorAll('.method-btn').forEach(function(b) { b.classList.remove('method-btn--active'); });
                btn.classList.add('method-btn--active');
                if (selectedMethod === 'CASH') {
                    cashSection.classList.remove('hidden');
                    cashInput.value = ''; cashInput.focus();
                } else {
                    cashSection.classList.add('hidden');
                }
                confirmBtn.classList.remove('hidden');
            });

            cashInput.addEventListener('input', function() {
                var received = Number(cashInput.value) || 0;
                var change = received - summary.grand_total;
                var cd = document.getElementById('change-display');
                if (cd) {
                    cd.textContent = '\u0E40\u0E07\u0E34\u0E19\u0E17\u0E2D\u0E19: ' + POS.formatBaht(Math.max(0, change));
                    cd.classList.toggle('text-danger', change < 0);
                }
            });

            confirmBtn.addEventListener('click', function() {
                if (_processing || !selectedMethod) return;
                if (selectedMethod === 'CASH') {
                    var received = Number(cashInput.value) || summary.grand_total;
                    if (received < summary.grand_total) {
                        POS.showToast('\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E44\u0E21\u0E48\u0E1E\u0E2D', true);
                        return;
                    }
                }
                _processing = true;
                confirmBtn.disabled = true;
                confirmBtn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23...';

                var result = POS.PaymentService.processPayment(orderId, selectedMethod, summary.grand_total);
                if (result) {
                    POS.Router.navigate('/receipt');
                } else {
                    POS.showToast('\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48', true);
                    _processing = false;
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19';
                }
            });

            backBtn.addEventListener('click', function() { POS.Router.navigate('/order'); });
        },

        unmount: function() { _processing = false; }
    };
})();
