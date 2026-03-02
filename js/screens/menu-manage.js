/**
 * Menu Management Screen — เปิด/ปิดเมนู, แก้ไขราคา, เพิ่มเมนูใหม่
 */
window.POS = window.POS || {};

POS.MenuManageScreen = {
    _container: null,
    _modal: null,

    // หมวดหมู่ที่ใช้ได้
    CATEGORIES: [
        { label: 'แนะนำ', value: 'แนะนำ' },
        { label: 'ครัวอีสาน', value: 'ครัวอีสาน' },
        { label: 'ครัวไทย', value: 'ครัวไทย' },
        { label: 'ตามสั่ง', value: 'ตามสั่ง' },
        { label: 'เครื่องดื่ม', value: 'เครื่องดื่ม' }
    ],

    render: function(container) {
        this._container = container;
        POS.setHeaderInfo('จัดการเมนู');

        container.innerHTML = '';
        var wrapper = POS.createElement('div', 'menu-manage');

        // Toolbar
        var toolbar = POS.createElement('div', 'menu-manage__toolbar');

        var leftGroup = POS.createElement('div', '');
        leftGroup.style.display = 'flex';
        leftGroup.style.alignItems = 'center';
        leftGroup.style.gap = '12px';
        var title = POS.createElement('h2', 'menu-manage__title', 'จัดการเมนู');
        var addBtn = POS.createElement('button', 'menu-manage__add-btn', '+ เพิ่มเมนู');
        var self = this;
        addBtn.addEventListener('click', function() {
            self._showCreateModal();
        });
        leftGroup.appendChild(title);
        leftGroup.appendChild(addBtn);

        var backBtn = POS.createElement('button', 'btn btn--secondary', '← กลับ');
        backBtn.addEventListener('click', function() {
            POS.Router.navigate('/');
        });
        toolbar.appendChild(leftGroup);
        toolbar.appendChild(backBtn);
        wrapper.appendChild(toolbar);

        // Build category sections
        this._renderGrid(wrapper);

        container.appendChild(wrapper);
    },

    _renderGrid: function(wrapper) {
        // Remove old grid if exists
        var existingGrid = wrapper.querySelector('.menu-manage__grid');
        if (existingGrid) existingGrid.remove();

        var DS = POS.DataService;
        var allItems = DS.getMenuItems ? DS.getMenuItems() : [];
        var allForToggle = POS.MOCK_MENU_ITEMS || allItems;

        if (DS.getAllMenuItems) {
            allForToggle = DS.getAllMenuItems();
        } else if (DS.cache && DS.cache.menuItems && DS.cache.menuItems.length > 0) {
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
            var catHeader = POS.createElement('div', 'menu-manage__cat-header', catName + ' (' + items.length + ')');
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
    },

    _createItemRow: function(item) {
        var isActive = item.is_active === true || item.is_active === 'TRUE' || item.is_active === 1 || item.is_active === 'true';

        var row = POS.createElement('div', 'menu-manage__row' + (isActive ? '' : ' menu-manage__row--off'));
        row.setAttribute('data-menu-id', item.menu_id);

        var info = POS.createElement('div', 'menu-manage__row-info');
        var name = POS.createElement('span', 'menu-manage__row-name', item.name_th);

        // Show price info
        var priceText = '฿' + item.base_price;
        if (item.price_json) {
            try {
                var variants = typeof item.price_json === 'string' ? JSON.parse(item.price_json) : item.price_json;
                var variantCount = Object.keys(variants).length;
                if (variantCount > 0) {
                    priceText += ' (+' + variantCount + ' ตัวเลือก)';
                }
            } catch (e) { /* ignore */ }
        }
        var price = POS.createElement('span', 'menu-manage__row-price', priceText);
        info.appendChild(name);
        info.appendChild(price);

        // Action buttons (edit + toggle)
        var actions = POS.createElement('div', 'menu-manage__actions');

        // Edit button
        var editBtn = POS.createElement('button', 'menu-manage__edit-btn');
        editBtn.innerHTML = '&#9998;'; // ✎ pencil
        editBtn.setAttribute('data-menu-id', item.menu_id);
        editBtn.setAttribute('title', 'แก้ไขราคา');
        var self = this;
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var menuId = this.getAttribute('data-menu-id');
            self._showEditModal(menuId);
        });

        // Toggle button
        var toggle = POS.createElement('button', 'menu-manage__toggle' + (isActive ? ' menu-manage__toggle--on' : ''));
        toggle.textContent = isActive ? 'เปิด' : 'ปิด';
        toggle.setAttribute('data-menu-id', item.menu_id);

        toggle.addEventListener('click', function() {
            var menuId = this.getAttribute('data-menu-id');
            var btn = this;
            var parentRow = btn.closest('.menu-manage__row');

            var currentlyOn = btn.classList.contains('menu-manage__toggle--on');
            var newActive = !currentlyOn;

            btn.textContent = newActive ? 'เปิด' : 'ปิด';
            if (newActive) {
                btn.classList.add('menu-manage__toggle--on');
                parentRow.classList.remove('menu-manage__row--off');
            } else {
                btn.classList.remove('menu-manage__toggle--on');
                parentRow.classList.add('menu-manage__row--off');
            }

            self._updateLocalCache(menuId, newActive);

            if (POS.DataService.isOnline && POS.DataService.isOnline()) {
                POS.ApiClient.postAsync('toggleMenuItem', {
                    menu_id: menuId,
                    is_active: newActive
                });
            }

            POS.showToast((newActive ? 'เปิด' : 'ปิด') + 'เมนูแล้ว');
        });

        actions.appendChild(editBtn);
        actions.appendChild(toggle);

        row.appendChild(info);
        row.appendChild(actions);

        return row;
    },

    // ========== Edit Modal ==========

    _showEditModal: function(menuId) {
        var DS = POS.DataService;
        var item = DS.getMenuItemById(menuId);
        if (!item) {
            POS.showToast('ไม่พบเมนู', true);
            return;
        }

        var self = this;

        // Parse existing variants
        var variants = [];
        if (item.price_json) {
            try {
                var parsed = typeof item.price_json === 'string' ? JSON.parse(item.price_json) : item.price_json;
                var keys = Object.keys(parsed);
                for (var i = 0; i < keys.length; i++) {
                    variants.push({ name: keys[i], price: parsed[keys[i]] });
                }
            } catch (e) { /* ignore */ }
        }

        this._showModal({
            title: 'แก้ไข: ' + item.name_th,
            mode: 'edit',
            data: {
                menu_id: item.menu_id,
                name_th: item.name_th,
                base_price: item.base_price,
                variants: variants
            },
            onSave: function(formData) {
                var updates = {
                    base_price: Number(formData.base_price) || 0
                };

                // Build price_json from variants
                if (formData.variants && formData.variants.length > 0) {
                    var priceObj = {};
                    for (var i = 0; i < formData.variants.length; i++) {
                        var v = formData.variants[i];
                        if (v.name && v.name.trim()) {
                            priceObj[v.name.trim()] = Number(v.price) || 0;
                        }
                    }
                    updates.price_json = Object.keys(priceObj).length > 0 ? JSON.stringify(priceObj) : '';
                } else {
                    updates.price_json = '';
                }

                DS.updateMenuItem(menuId, updates);
                POS.showToast('บันทึกราคาแล้ว');

                // Re-render to show updated prices
                self._refreshGrid();
            }
        });
    },

    // ========== Create Modal ==========

    _showCreateModal: function() {
        var self = this;
        var DS = POS.DataService;

        this._showModal({
            title: 'เพิ่มเมนูใหม่',
            mode: 'create',
            data: {
                name_th: '',
                category_app: 'แนะนำ',
                base_price: 0,
                variants: []
            },
            onSave: function(formData) {
                if (!formData.name_th || !formData.name_th.trim()) {
                    POS.showToast('กรุณาใส่ชื่อเมนู', true);
                    return false; // Don't close modal
                }
                if (!formData.base_price || Number(formData.base_price) <= 0) {
                    POS.showToast('กรุณาใส่ราคา', true);
                    return false;
                }

                var itemData = {
                    name_th: formData.name_th.trim(),
                    category_app: formData.category_app,
                    base_price: Number(formData.base_price) || 0,
                    price_json: ''
                };

                // Build price_json
                if (formData.variants && formData.variants.length > 0) {
                    var priceObj = {};
                    for (var i = 0; i < formData.variants.length; i++) {
                        var v = formData.variants[i];
                        if (v.name && v.name.trim()) {
                            priceObj[v.name.trim()] = Number(v.price) || 0;
                        }
                    }
                    if (Object.keys(priceObj).length > 0) {
                        itemData.price_json = JSON.stringify(priceObj);
                    }
                }

                DS.createMenuItem(itemData);
                POS.showToast('เพิ่มเมนู "' + itemData.name_th + '" แล้ว');

                // Re-render
                self._refreshGrid();
            }
        });
    },

    // ========== Generic Modal Builder ==========

    _showModal: function(opts) {
        // Remove existing modal
        this._closeModal();

        var self = this;
        var mode = opts.mode; // 'edit' or 'create'
        var data = opts.data;

        // Overlay
        var overlay = POS.createElement('div', 'menu-modal-overlay');
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) self._closeModal();
        });

        // Modal container
        var modal = POS.createElement('div', 'menu-modal');

        // Header
        var header = POS.createElement('div', 'menu-modal__header');
        var title = POS.createElement('h3', 'menu-modal__title', opts.title);
        header.appendChild(title);
        modal.appendChild(header);

        // Body
        var body = POS.createElement('div', 'menu-modal__body');

        // --- Name field (create mode only) ---
        if (mode === 'create') {
            var nameField = POS.createElement('div', 'menu-modal__field');
            var nameLabel = POS.createElement('label', 'menu-modal__label', 'ชื่อเมนู');
            var nameInput = POS.createElement('input', 'menu-modal__input');
            nameInput.type = 'text';
            nameInput.placeholder = 'เช่น ผัดกะเพราหมู';
            nameInput.value = data.name_th || '';
            nameInput.id = 'modal-name-th';
            nameField.appendChild(nameLabel);
            nameField.appendChild(nameInput);
            body.appendChild(nameField);

            // --- Category field ---
            var catField = POS.createElement('div', 'menu-modal__field');
            var catLabel = POS.createElement('label', 'menu-modal__label', 'หมวดหมู่');
            var catSelect = document.createElement('select');
            catSelect.className = 'menu-modal__select';
            catSelect.id = 'modal-category';
            for (var c = 0; c < self.CATEGORIES.length; c++) {
                var opt = document.createElement('option');
                opt.value = self.CATEGORIES[c].value;
                opt.textContent = self.CATEGORIES[c].label;
                if (data.category_app === self.CATEGORIES[c].value) opt.selected = true;
                catSelect.appendChild(opt);
            }
            catField.appendChild(catLabel);
            catField.appendChild(catSelect);
            body.appendChild(catField);
        }

        // --- Price field ---
        var priceField = POS.createElement('div', 'menu-modal__field');
        var priceLabel = POS.createElement('label', 'menu-modal__label', 'ราคาพื้นฐาน (บาท)');
        var priceInput = POS.createElement('input', 'menu-modal__input');
        priceInput.type = 'number';
        priceInput.min = '0';
        priceInput.step = '5';
        priceInput.placeholder = '0';
        priceInput.value = data.base_price || '';
        priceInput.id = 'modal-base-price';
        priceField.appendChild(priceLabel);
        priceField.appendChild(priceInput);
        body.appendChild(priceField);

        // --- Variants section ---
        var varSection = POS.createElement('div', 'menu-modal__field');

        var varHeader = POS.createElement('div', 'menu-modal__variants-header');
        var varLabel = POS.createElement('label', 'menu-modal__label', 'ตัวเลือก (Variants)');
        var varAddBtn = POS.createElement('button', 'menu-modal__variant-add', '+ เพิ่มตัวเลือก');
        varHeader.appendChild(varLabel);
        varHeader.appendChild(varAddBtn);
        varSection.appendChild(varHeader);

        var varRows = POS.createElement('div', 'menu-modal__variant-rows');
        varRows.id = 'modal-variant-rows';

        // Populate existing variants
        if (data.variants && data.variants.length > 0) {
            for (var v = 0; v < data.variants.length; v++) {
                var vRow = self._createVariantRow(data.variants[v].name, data.variants[v].price);
                varRows.appendChild(vRow);
            }
        }

        varSection.appendChild(varRows);
        body.appendChild(varSection);

        // Add variant button handler
        varAddBtn.addEventListener('click', function() {
            var newRow = self._createVariantRow('', '');
            varRows.appendChild(newRow);
            // Focus the name input
            var inputs = newRow.querySelectorAll('input');
            if (inputs[0]) inputs[0].focus();
        });

        modal.appendChild(body);

        // Footer
        var footer = POS.createElement('div', 'menu-modal__footer');

        var cancelBtn = POS.createElement('button', 'menu-modal__btn menu-modal__btn--cancel', 'ยกเลิก');
        cancelBtn.addEventListener('click', function() {
            self._closeModal();
        });

        var saveBtn = POS.createElement('button', 'menu-modal__btn menu-modal__btn--save', 'บันทึก');
        saveBtn.addEventListener('click', function() {
            // Collect form data
            var formData = {};

            if (mode === 'create') {
                var nameEl = modal.querySelector('#modal-name-th');
                var catEl = modal.querySelector('#modal-category');
                formData.name_th = nameEl ? nameEl.value : '';
                formData.category_app = catEl ? catEl.value : 'แนะนำ';
            }

            var priceEl = modal.querySelector('#modal-base-price');
            formData.base_price = priceEl ? priceEl.value : 0;

            // Collect variants
            formData.variants = [];
            var vRowEls = varRows.querySelectorAll('.menu-modal__variant-row');
            for (var r = 0; r < vRowEls.length; r++) {
                var inputs = vRowEls[r].querySelectorAll('input');
                if (inputs.length >= 2) {
                    var vName = inputs[0].value;
                    var vPrice = inputs[1].value;
                    if (vName && vName.trim()) {
                        formData.variants.push({ name: vName.trim(), price: Number(vPrice) || 0 });
                    }
                }
            }

            var result = opts.onSave(formData);
            // If onSave returns false, don't close modal
            if (result !== false) {
                self._closeModal();
            }
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        modal.appendChild(footer);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this._modal = overlay;

        // Focus first input
        setTimeout(function() {
            var firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    },

    _createVariantRow: function(name, price) {
        var row = POS.createElement('div', 'menu-modal__variant-row');

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'ชื่อตัวเลือก';
        nameInput.value = name || '';

        var priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.min = '0';
        priceInput.step = '5';
        priceInput.placeholder = 'ราคา';
        priceInput.value = price || '';

        var removeBtn = POS.createElement('button', 'menu-modal__variant-remove');
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', function() {
            row.remove();
        });

        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(removeBtn);

        return row;
    },

    _closeModal: function() {
        if (this._modal) {
            this._modal.remove();
            this._modal = null;
        }
    },

    _refreshGrid: function() {
        if (!this._container) return;
        var wrapper = this._container.querySelector('.menu-manage');
        if (wrapper) {
            this._renderGrid(wrapper);
        }
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

        // Update via DataService
        if (POS.DataService.updateMenuItem) {
            POS.DataService.updateMenuItem(menuId, { is_active: isActive });
        } else {
            // Fallback: direct cache update
            var DS = POS.DataService;
            if (DS.cache && DS.cache.menuItems) {
                for (var j = 0; j < DS.cache.menuItems.length; j++) {
                    if (DS.cache.menuItems[j].menu_id === menuId) {
                        DS.cache.menuItems[j].is_active = isActive;
                        break;
                    }
                }
                if (DS.saveToLocal) DS.saveToLocal();
            }
        }
    },

    unmount: function() {
        this._closeModal();
        this._container = null;
    }
};
