/**
 * Order Screen — Split-panel: Menu (left 60%) + Cart (right 40%)
 */
window.POS = window.POS || {};

(function() {
    var el = POS.createElement;
    var DS, _container, _activeCategory, _variantModal;

    function resetState() {
        DS = POS.DataService;
        _activeCategory = null;
        _variantModal = null;
    }

    function renderMenuPanel(container) {
        var panel = el('div', 'menu-panel');
        var categories = DS.getMenuCategories();
        var tabBar = el('div', 'menu-panel__categories');

        var allTab = el('button',
            'category-tab' + (!_activeCategory ? ' category-tab--active' : ''),
            '\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14'
        );
        allTab.dataset.category = '';
        tabBar.appendChild(allTab);

        categories.forEach(function(cat) {
            var tab = el('button',
                'category-tab' + (_activeCategory === cat ? ' category-tab--active' : ''),
                cat
            );
            tab.dataset.category = cat;
            tabBar.appendChild(tab);
        });

        panel.appendChild(tabBar);

        var itemsContainer = el('div', 'menu-panel__items');
        var items = _activeCategory
            ? DS.getMenuItemsByCategory(_activeCategory)
            : DS.getMenuItems();

        if (!_activeCategory) {
            var currentCat = null;
            items.forEach(function(item) {
                if (item.category_app !== currentCat) {
                    currentCat = item.category_app;
                    itemsContainer.appendChild(el('div', 'menu-category-header', currentCat));
                }
                itemsContainer.appendChild(createMenuCard(item));
            });
        } else {
            items.forEach(function(item) {
                itemsContainer.appendChild(createMenuCard(item));
            });
        }

        panel.appendChild(itemsContainer);

        tabBar.addEventListener('click', function(e) {
            var tab = e.target.closest('.category-tab');
            if (!tab) return;
            _activeCategory = tab.dataset.category || null;
            refreshScreen();
        });

        itemsContainer.addEventListener('click', function(e) {
            var card = e.target.closest('.menu-card');
            if (!card) return;
            handleMenuItemClick(card.dataset.menuId);
        });

        container.appendChild(panel);
    }

    function createMenuCard(item) {
        var card = el('button', 'menu-card');
        card.dataset.menuId = item.menu_id;
        card.appendChild(el('span', 'menu-card__name', item.name_th));
        card.appendChild(el('span', 'menu-card__price', POS.formatBaht(item.base_price)));
        if (item.price_json) {
            card.appendChild(el('span', 'menu-card__variant-badge', '\u0E21\u0E35\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01'));
        }
        return card;
    }

    function handleMenuItemClick(menuId) {
        var item = DS.getMenuItemById(menuId);
        if (!item) return;
        if (item.price_json) {
            showVariantModal(item);
        } else {
            addItemToOrder(item, null);
        }
    }

    function showVariantModal(item) {
        var prices = typeof item.price_json === 'string' ? JSON.parse(item.price_json) : item.price_json;

        var overlay = el('div', 'modal-overlay');
        var modal = el('div', 'variant-modal');
        modal.appendChild(el('h3', 'variant-modal__title', item.name_th));
        modal.appendChild(el('p', 'variant-modal__subtitle', '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01'));

        var options = el('div', 'variant-modal__options');
        Object.keys(prices).forEach(function(variant) {
            var btn = el('button', 'variant-btn');
            btn.dataset.variant = variant;
            btn.appendChild(el('span', 'variant-btn__name', variant));
            btn.appendChild(el('span', 'variant-btn__price', POS.formatBaht(prices[variant])));
            options.appendChild(btn);
        });
        modal.appendChild(options);

        var cancelBtn = el('button', 'variant-modal__cancel', '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01');
        modal.appendChild(cancelBtn);
        overlay.appendChild(modal);
        _container.appendChild(overlay);
        _variantModal = overlay;

        options.addEventListener('click', function(e) {
            var btn = e.target.closest('.variant-btn');
            if (!btn) return;
            addItemToOrder(item, btn.dataset.variant);
            closeVariantModal();
        });

        cancelBtn.addEventListener('click', closeVariantModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeVariantModal();
        });
    }

    function closeVariantModal() {
        if (_variantModal) { _variantModal.remove(); _variantModal = null; }
    }

    function addItemToOrder(item, variant) {
        var orderId = POS.AppState.currentOrderId;
        if (!orderId) return;
        DS.addOrderLine(orderId, item, 1, variant);
        refreshCart();
        POS.showToast('\u0E40\u0E1E\u0E34\u0E48\u0E21 ' + item.name_th + ' \u0E41\u0E25\u0E49\u0E27');
    }

    function renderCartPanel(container) {
        var panel = el('div', 'cart-panel');
        var orderId = POS.AppState.currentOrderId;
        var order = DS.getOrder(orderId);
        var tableNo = POS.AppState.currentTable;

        var header = el('div', 'cart-panel__header');
        header.appendChild(el('h3', 'cart-panel__title', '\u0E42\u0E15\u0E4A\u0E30 ' + tableNo));
        var backBtn = el('button', 'cart-panel__back-btn', '\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A');
        header.appendChild(backBtn);
        panel.appendChild(header);

        backBtn.addEventListener('click', function() {
            POS.AppState.clear();
            POS.Router.navigate('/');
        });

        var itemsContainer = el('div', 'cart-panel__items');
        itemsContainer.id = 'cart-items';

        if (order && order.lines.length > 0) {
            order.lines.forEach(function(line) {
                itemsContainer.appendChild(createCartItem(line));
            });
        } else {
            itemsContainer.appendChild(el('div', 'cart-panel__empty', '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'));
        }
        panel.appendChild(itemsContainer);

        var footer = el('div', 'cart-panel__footer');
        footer.id = 'cart-footer';

        var subtotalRow = el('div', 'cart-footer__row');
        subtotalRow.appendChild(el('span', 'cart-footer__label', '\u0E23\u0E27\u0E21'));
        subtotalRow.appendChild(el('span', 'cart-footer__value', POS.formatBaht(order ? order.subtotal : 0)));
        footer.appendChild(subtotalRow);

        var itemCount = order ? order.lines.reduce(function(s, l) { return s + l.qty; }, 0) : 0;
        var countRow = el('div', 'cart-footer__row cart-footer__row--small');
        countRow.appendChild(el('span', 'cart-footer__label text-muted', '\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'));
        countRow.appendChild(el('span', 'cart-footer__value text-muted', itemCount + ' \u0E0A\u0E34\u0E49\u0E19'));
        footer.appendChild(countRow);

        var checkoutBtn = el('button', 'btn-checkout', '\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19');
        if (!order || order.lines.length === 0) checkoutBtn.disabled = true;
        checkoutBtn.addEventListener('click', function() {
            if (order && order.lines.length > 0) POS.Router.navigate('/checkout');
        });
        footer.appendChild(checkoutBtn);
        panel.appendChild(footer);

        itemsContainer.addEventListener('click', function(e) {
            var btn = e.target.closest('.qty-btn');
            if (!btn) return;
            var lineId = btn.dataset.lineId;
            var action = btn.dataset.action;
            var line = order.lines.find(function(l) { return l.order_line_id === lineId; });
            if (!line) return;
            var newQty = action === 'plus' ? line.qty + 1 : line.qty - 1;
            DS.updateOrderLineQty(orderId, lineId, newQty);
            refreshCart();
        });

        container.appendChild(panel);
    }

    function createCartItem(line) {
        var item = el('div', 'cart-item');
        var info = el('div', 'cart-item__info');
        info.appendChild(el('span', 'cart-item__name', line.item_name_th));
        info.appendChild(el('span', 'cart-item__price text-muted', POS.formatBaht(line.unit_price) + ' x ' + line.qty));
        var controls = el('div', 'cart-item__controls');

        var minusBtn = el('button', 'qty-btn qty-btn--minus', '-');
        minusBtn.dataset.lineId = line.order_line_id;
        minusBtn.dataset.action = 'minus';

        var plusBtn = el('button', 'qty-btn qty-btn--plus', '+');
        plusBtn.dataset.lineId = line.order_line_id;
        plusBtn.dataset.action = 'plus';

        controls.appendChild(minusBtn);
        controls.appendChild(el('span', 'cart-item__qty', String(line.qty)));
        controls.appendChild(plusBtn);

        item.appendChild(info);
        item.appendChild(controls);
        item.appendChild(el('span', 'cart-item__total', POS.formatBaht(line.line_total)));
        return item;
    }

    function refreshCart() {
        var orderId = POS.AppState.currentOrderId;
        var order = DS.getOrder(orderId);

        var itemsContainer = document.getElementById('cart-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = '';
            if (order && order.lines.length > 0) {
                order.lines.forEach(function(line) {
                    itemsContainer.appendChild(createCartItem(line));
                });
            } else {
                itemsContainer.appendChild(el('div', 'cart-panel__empty', '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'));
            }
        }

        var footer = document.getElementById('cart-footer');
        if (footer) {
            var val = footer.querySelector('.cart-footer__value');
            if (val) val.textContent = POS.formatBaht(order ? order.subtotal : 0);
            var count = order ? order.lines.reduce(function(s, l) { return s + l.qty; }, 0) : 0;
            var vals = footer.querySelectorAll('.cart-footer__value');
            if (vals[1]) vals[1].textContent = count + ' \u0E0A\u0E34\u0E49\u0E19';
            var btn = footer.querySelector('.btn-checkout');
            if (btn) btn.disabled = !order || order.lines.length === 0;
        }
    }

    function refreshScreen() {
        if (_container) {
            _container.innerHTML = '';
            renderMenuPanel(_container);
            renderCartPanel(_container);
        }
    }

    POS.OrderScreen = {
        render: function(container) {
            resetState();
            _container = container;
            POS.setHeaderInfo('\u0E42\u0E15\u0E4A\u0E30 ' + POS.AppState.currentTable);

            var wrapper = el('div', 'order-screen');
            container.appendChild(wrapper);
            _container = wrapper;

            renderMenuPanel(wrapper);
            renderCartPanel(wrapper);
        },

        unmount: function() {
            closeVariantModal();
            _container = null;
            _activeCategory = null;
        }
    };
})();
