/**
 * Menu Management Screen — เปิด/ปิดเมนูที่หมดหรือไม่มีในวันนี้
 */
window.POS = window.POS || {};

POS.MenuManageScreen = {
    _container: null,

    render: function(container) {
        this._container = container;
        POS.setHeaderInfo('จัดการเมนู');

        container.innerHTML = '';
        var wrapper = POS.createElement('div', 'menu-manage');

        // Toolbar
        var toolbar = POS.createElement('div', 'menu-manage__toolbar');
        var title = POS.createElement('h2', 'menu-manage__title', 'เปิด/ปิด เมนู');
        var backBtn = POS.createElement('button', 'btn btn--secondary', '← กลับ');
        backBtn.addEventListener('click', function() {
            POS.Router.navigate('/');
        });
        toolbar.appendChild(title);
        toolbar.appendChild(backBtn);
        wrapper.appendChild(toolbar);

        // Build category sections
        var DS = POS.DataService;
        var allItems = DS.getMenuItems ? DS.getMenuItems() : [];

        // For toggle we need ALL items including inactive
        // In offline mode, use MOCK_MENU_ITEMS directly
        var allForToggle = POS.MOCK_MENU_ITEMS || allItems;

        // If DataService has cache with is_active info, use that
        if (DS.cache && DS.cache.menuItems && DS.cache.menuItems.length > 0) {
            allForToggle = DS.cache.menuItems;
        }

        // Group by category_app
        var categories = {};
        var categoryOrder = [];
        for (var i = 0; i < allForToggle.length; i++) {
            var item = allForToggle[i];
            var cat = item.category_app || item.category || 'อื่นๆ';
            if (!categories[cat]) {
                categories[cat] = [];
                categoryOrder.push(cat);
            }
            categories[cat].push(item);
        }

        // Sort by sort_group
        categoryOrder.sort(function(a, b) {
            var aGroup = categories[a][0].sort_group || 0;
            var bGroup = categories[b][0].sort_group || 0;
            return aGroup - bGroup;
        });

        var grid = POS.createElement('div', 'menu-manage__grid');

        for (var c = 0; c < categoryOrder.length; c++) {
            var catName = categoryOrder[c];
            var items = categories[catName];

            var section = POS.createElement('div', 'menu-manage__section');
            var catHeader = POS.createElement('div', 'menu-manage__cat-header', catName);
            section.appendChild(catHeader);

            var itemList = POS.createElement('div', 'menu-manage__items');

            for (var j = 0; j < items.length; j++) {
                var menuItem = items[j];
                var row = this._createItemRow(menuItem);
                itemList.appendChild(row);
            }

            section.appendChild(itemList);
            grid.appendChild(section);
        }

        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    },

    _createItemRow: function(item) {
        var isActive = item.is_active === true || item.is_active === 'TRUE' || item.is_active === 1 || item.is_active === 'true';

        var row = POS.createElement('div', 'menu-manage__row' + (isActive ? '' : ' menu-manage__row--off'));

        var info = POS.createElement('div', 'menu-manage__row-info');
        var name = POS.createElement('span', 'menu-manage__row-name', item.name_th);
        var price = POS.createElement('span', 'menu-manage__row-price', '฿' + item.base_price);
        info.appendChild(name);
        info.appendChild(price);

        var toggleWrap = POS.createElement('div', 'menu-manage__toggle-wrap');
        var toggle = POS.createElement('button', 'menu-manage__toggle' + (isActive ? ' menu-manage__toggle--on' : ''));
        toggle.textContent = isActive ? 'เปิด' : 'ปิด';
        toggle.setAttribute('data-menu-id', item.menu_id);

        var self = this;
        toggle.addEventListener('click', function() {
            var menuId = this.getAttribute('data-menu-id');
            var btn = this;
            var parentRow = btn.closest('.menu-manage__row');

            // Determine current state from button class
            var currentlyOn = btn.classList.contains('menu-manage__toggle--on');
            var newActive = !currentlyOn;

            // Update UI immediately
            btn.textContent = newActive ? 'เปิด' : 'ปิด';
            if (newActive) {
                btn.classList.add('menu-manage__toggle--on');
                parentRow.classList.remove('menu-manage__row--off');
            } else {
                btn.classList.remove('menu-manage__toggle--on');
                parentRow.classList.add('menu-manage__row--off');
            }

            // Update local cache
            self._updateLocalCache(menuId, newActive);

            // Send to API
            if (POS.DataService.isOnline && POS.DataService.isOnline()) {
                POS.ApiClient.postAsync('toggleMenuItem', {
                    menu_id: menuId,
                    is_active: newActive
                });
            }

            POS.showToast((newActive ? 'เปิด' : 'ปิด') + 'เมนูแล้ว');
        });

        toggleWrap.appendChild(toggle);
        row.appendChild(info);
        row.appendChild(toggleWrap);

        return row;
    },

    _updateLocalCache: function(menuId, isActive) {
        // Update in MOCK_MENU_ITEMS
        if (POS.MOCK_MENU_ITEMS) {
            for (var i = 0; i < POS.MOCK_MENU_ITEMS.length; i++) {
                if (POS.MOCK_MENU_ITEMS[i].menu_id === menuId) {
                    POS.MOCK_MENU_ITEMS[i].is_active = isActive;
                    break;
                }
            }
        }

        // Update in DataService cache
        var DS = POS.DataService;
        if (DS.cache && DS.cache.menuItems) {
            for (var j = 0; j < DS.cache.menuItems.length; j++) {
                if (DS.cache.menuItems[j].menu_id === menuId) {
                    DS.cache.menuItems[j].is_active = isActive;
                    break;
                }
            }
            DS.saveToLocal();
        }
    },

    unmount: function() {
        this._container = null;
    }
};
