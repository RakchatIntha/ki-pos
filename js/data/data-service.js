/**
 * DataService — THE single abstraction layer for all data operations.
 *
 * MODE 1 (Online):  API_URL configured → use Google Sheets via Apps Script
 * MODE 2 (Offline): API_URL empty     → use localStorage/memory (mock data)
 *
 * Strategy: Cache-first + Background sync
 *   - initialize() loads ALL data from API (or local mock) into memory cache
 *   - get*() methods read from cache (synchronous — screens don't need to change)
 *   - create/update methods update cache immediately (optimistic) + POST to API in background
 */
window.POS = window.POS || {};

(function() {
    var Storage = POS.Storage;
    var generateId = POS.generateId;
    var formatReceiptDate = POS.formatReceiptDate;

    // In-memory cache
    var cache = {
        menuItems: [],
        sysVars: [],
        orders: [],
        orderLines: [],
        receipts: [],
        payments: []
    };

    var _isOnline = false;
    var _initialized = false;

    var KEYS = {
        MENU_ITEMS: 'MENU_ITEMS',
        SYS_VARS: 'SYS_VARS',
        ORDERS: 'ORDERS',
        ORDER_LINES: 'ORDER_LINES',
        RECEIPTS: 'RECEIPTS',
        PAYMENTS: 'PAYMENTS',
        INITIALIZED: 'INITIALIZED'
    };

    // ========== Cache save to localStorage (backup) ==========

    function saveToLocal() {
        try {
            Storage.set(KEYS.ORDERS, cache.orders);
            Storage.set(KEYS.ORDER_LINES, cache.orderLines);
            Storage.set(KEYS.RECEIPTS, cache.receipts);
            Storage.set(KEYS.PAYMENTS, cache.payments);
        } catch (e) {
            // Silent fail
        }
    }

    // ========== DataService ==========

    POS.DataService = {

        /**
         * Initialize — โหลดข้อมูลทั้งหมด
         * @param {function} callback - เรียกเมื่อโหลดเสร็จ
         */
        initialize: function(callback) {
            var self = this;
            var apiUrl = POS.CONFIG && POS.CONFIG.API_URL;

            if (apiUrl) {
                // MODE 1: Online — โหลดจาก API
                POS.ApiClient.init(apiUrl, POS.CONFIG.API_TIMEOUT);
                console.log('[POS] Loading data from API...');

                POS.ApiClient.get('getAllData', {}, function(err, data) {
                    if (err) {
                        console.warn('[POS] API load failed:', err.message, '— using offline fallback');
                        self._loadFromLocal();
                    } else {
                        _isOnline = true;
                        cache.menuItems = data.menuItems || [];
                        cache.sysVars = data.sysVars || [];
                        cache.orders = data.orders || [];
                        cache.orderLines = data.orderLines || [];
                        cache.receipts = data.receipts || [];
                        cache.payments = data.payments || [];

                        // Save to local as backup
                        Storage.set(KEYS.MENU_ITEMS, cache.menuItems);
                        Storage.set(KEYS.SYS_VARS, cache.sysVars);
                        saveToLocal();

                        console.log('[POS] Data loaded from API (' +
                            cache.menuItems.length + ' menu items, ' +
                            cache.orders.length + ' orders)');
                    }
                    _initialized = true;
                    if (callback) callback();
                });
            } else {
                // MODE 2: Offline — ใช้ mock data
                console.log('[POS] No API configured — using offline mode');
                self._loadFromLocal();
                _initialized = true;
                if (callback) callback();
            }
        },

        _loadFromLocal: function() {
            _isOnline = false;
            if (!Storage.has(KEYS.INITIALIZED)) {
                Storage.set(KEYS.MENU_ITEMS, POS.MOCK_MENU_ITEMS);
                Storage.set(KEYS.SYS_VARS, POS.MOCK_SYS_VARS);
                Storage.set(KEYS.ORDERS, []);
                Storage.set(KEYS.ORDER_LINES, []);
                Storage.set(KEYS.RECEIPTS, []);
                Storage.set(KEYS.PAYMENTS, []);
                Storage.set(KEYS.INITIALIZED, true);
            }
            cache.menuItems = Storage.get(KEYS.MENU_ITEMS) || [];
            cache.sysVars = Storage.get(KEYS.SYS_VARS) || [];
            cache.orders = Storage.get(KEYS.ORDERS) || [];
            cache.orderLines = Storage.get(KEYS.ORDER_LINES) || [];
            cache.receipts = Storage.get(KEYS.RECEIPTS) || [];
            cache.payments = Storage.get(KEYS.PAYMENTS) || [];
        },

        isOnline: function() { return _isOnline; },

        resetAll: function() {
            Storage.clearAll();
            cache = { menuItems: [], sysVars: [], orders: [], orderLines: [], receipts: [], payments: [] };
            this._loadFromLocal();
        },

        /**
         * Merge poll updates into cache
         */
        applyPollUpdates: function(data) {
            if (!data) return;

            if (data.orders && data.orders.length > 0) {
                data.orders.forEach(function(updated) {
                    var idx = cache.orders.findIndex(function(o) { return o.order_id === updated.order_id; });
                    if (idx >= 0) {
                        cache.orders[idx] = updated;
                    } else {
                        cache.orders.push(updated);
                    }
                });
            }

            if (data.lines && data.lines.length > 0) {
                data.lines.forEach(function(updated) {
                    var idx = cache.orderLines.findIndex(function(l) { return l.order_line_id === updated.order_line_id; });
                    if (idx >= 0) {
                        cache.orderLines[idx] = updated;
                    } else {
                        cache.orderLines.push(updated);
                    }
                });
            }

            saveToLocal();
        },

        refreshFromApi: function(callback) {
            if (!_isOnline) { if (callback) callback(); return; }
            POS.ApiClient.get('getAllData', {}, function(err, data) {
                if (!err && data) {
                    cache.menuItems = data.menuItems || [];
                    cache.sysVars = data.sysVars || [];
                    cache.orders = data.orders || [];
                    cache.orderLines = data.orderLines || [];
                    cache.receipts = data.receipts || [];
                    cache.payments = data.payments || [];
                    saveToLocal();
                }
                if (callback) callback();
            });
        },

        // ========== Menu ==========

        getMenuItems: function() {
            return cache.menuItems
                .filter(function(item) { return item.is_active === true || item.is_active === 'TRUE' || item.is_active === 1; })
                .sort(function(a, b) {
                    if (a.sort_group !== b.sort_group) return a.sort_group - b.sort_group;
                    return a.sort_order - b.sort_order;
                });
        },

        getMenuCategories: function() {
            var items = this.getMenuItems();
            var seen = new Map();
            items.forEach(function(item) {
                if (!seen.has(item.category_app)) {
                    seen.set(item.category_app, item.sort_group);
                }
            });
            return Array.from(seen.entries())
                .sort(function(a, b) { return a[1] - b[1]; })
                .map(function(entry) { return entry[0]; });
        },

        getMenuItemsByCategory: function(category) {
            return this.getMenuItems().filter(function(item) { return item.category_app === category; });
        },

        getMenuItemById: function(menuId) {
            return cache.menuItems.find(function(item) { return item.menu_id === menuId; }) || null;
        },

        // ========== System Variables ==========

        getSysVar: function(key) {
            var found = cache.sysVars.find(function(v) { return v.VAR_KEY === key; });
            if (!found) return null;
            if (found.VAR_TYPE === 'NUMBER') return Number(found.VAR_VALUE);
            if (found.VAR_TYPE === 'CSV') return String(found.VAR_VALUE).split(',');
            return found.VAR_VALUE;
        },

        getReceiptPrefix: function() {
            return this.getSysVar('RECEIPT_PREFIX') || 'KI';
        },

        getPaymentMethods: function() {
            return this.getSysVar('PAYMENT_METHODS') || ['CASH', 'QR'];
        },

        getTableCount: function() {
            return this.getSysVar('TABLE_COUNT') || 12;
        },

        // ========== Orders ==========

        createOrder: function(tableNo) {
            var now = new Date().toISOString();
            var order = {
                order_id: generateId('ORD'),
                table_no: tableNo,
                status: 'OPEN',
                subtotal: 0,
                grand_total: 0,
                created_at: now,
                updated_at: now
            };

            cache.orders.push(order);
            saveToLocal();

            if (_isOnline) {
                POS.ApiClient.post('createOrder', { table_no: tableNo }, function(err, serverOrder) {
                    if (!err && serverOrder) {
                        var oldId = order.order_id;
                        var idx = cache.orders.findIndex(function(o) { return o.order_id === oldId; });
                        if (idx >= 0) {
                            cache.orders[idx] = serverOrder;
                            cache.orderLines.forEach(function(l) {
                                if (l.order_id === oldId) l.order_id = serverOrder.order_id;
                            });
                            if (POS.AppState && POS.AppState.currentOrderId === oldId) {
                                POS.AppState.currentOrderId = serverOrder.order_id;
                            }
                            saveToLocal();
                        }
                    }
                });
            }

            return order;
        },

        getOrder: function(orderId) {
            var order = cache.orders.find(function(o) { return o.order_id === orderId; });
            if (!order) return null;
            var lines = this.getOrderLines(orderId);
            return Object.assign({}, order, { lines: lines });
        },

        getOpenOrderByTable: function(tableNo) {
            var order = cache.orders.find(function(o) {
                return o.table_no == tableNo && o.status !== 'PAID';
            });
            if (!order) return null;
            var lines = this.getOrderLines(order.order_id);
            return Object.assign({}, order, { lines: lines });
        },

        getOrderLines: function(orderId) {
            return cache.orderLines.filter(function(l) { return l.order_id === orderId; });
        },

        addOrderLine: function(orderId, menuItem, qty, selectedVariant) {
            var unitPrice = menuItem.base_price;
            var itemName = menuItem.name_th;

            if (selectedVariant && menuItem.price_json) {
                var prices = typeof menuItem.price_json === 'string'
                    ? JSON.parse(menuItem.price_json)
                    : menuItem.price_json;
                unitPrice = prices[selectedVariant] || menuItem.base_price;
                itemName = menuItem.name_th + ' (' + selectedVariant + ')';
            }

            var existingIndex = cache.orderLines.findIndex(function(l) {
                return l.order_id === orderId && l.menu_id === menuItem.menu_id && l.item_name_th === itemName;
            });

            if (existingIndex >= 0) {
                cache.orderLines[existingIndex].qty += qty;
                cache.orderLines[existingIndex].line_total = cache.orderLines[existingIndex].qty * cache.orderLines[existingIndex].unit_price;

                if (_isOnline) {
                    POS.ApiClient.postAsync('updateOrderLineQty', {
                        order_line_id: cache.orderLines[existingIndex].order_line_id,
                        order_id: orderId,
                        new_qty: cache.orderLines[existingIndex].qty
                    });
                }
            } else {
                var now = new Date().toISOString();
                var newLine = {
                    order_line_id: generateId('OL'),
                    order_id: orderId,
                    menu_id: menuItem.menu_id,
                    item_name_th: itemName,
                    qty: qty,
                    unit_price: unitPrice,
                    line_total: unitPrice * qty,
                    line_status: 'PENDING',
                    line_status_updated_at: now
                };
                cache.orderLines.push(newLine);

                if (_isOnline) {
                    POS.ApiClient.postAsync('addOrderLine', {
                        order_id: orderId,
                        menu_id: menuItem.menu_id,
                        item_name_th: itemName,
                        qty: qty,
                        unit_price: unitPrice
                    });
                }
            }

            this._recalcOrderTotals(orderId);
            saveToLocal();
        },

        updateOrderLineQty: function(orderId, lineId, newQty) {
            var idx = cache.orderLines.findIndex(function(l) { return l.order_line_id === lineId; });
            if (idx < 0) return;

            if (newQty <= 0) {
                cache.orderLines.splice(idx, 1);
                if (_isOnline) {
                    POS.ApiClient.postAsync('removeOrderLine', { order_line_id: lineId, order_id: orderId });
                }
            } else {
                cache.orderLines[idx].qty = newQty;
                cache.orderLines[idx].line_total = cache.orderLines[idx].unit_price * newQty;
                if (_isOnline) {
                    POS.ApiClient.postAsync('updateOrderLineQty', {
                        order_line_id: lineId, order_id: orderId, new_qty: newQty
                    });
                }
            }

            this._recalcOrderTotals(orderId);
            saveToLocal();
        },

        removeOrderLine: function(orderId, lineId) {
            this.updateOrderLineQty(orderId, lineId, 0);
        },

        updateOrderStatus: function(orderId, newStatus) {
            var idx = cache.orders.findIndex(function(o) { return o.order_id === orderId; });
            if (idx < 0) return null;

            cache.orders[idx].status = newStatus;
            cache.orders[idx].updated_at = new Date().toISOString();
            saveToLocal();

            if (_isOnline) {
                POS.ApiClient.postAsync('updateOrderStatus', { order_id: orderId, new_status: newStatus });
            }

            return cache.orders[idx];
        },

        updateLineStatus: function(orderLineId, newStatus) {
            var now = new Date().toISOString();
            var idx = cache.orderLines.findIndex(function(l) { return l.order_line_id === orderLineId; });
            if (idx < 0) return;

            cache.orderLines[idx].line_status = newStatus;
            cache.orderLines[idx].line_status_updated_at = now;

            var orderId = cache.orderLines[idx].order_id;

            // Auto status transitions
            var orderLines = this.getOrderLines(orderId);
            var allDone = orderLines.length > 0 && orderLines.every(function(l) { return l.line_status === 'DONE'; });
            var orderIdx = cache.orders.findIndex(function(o) { return o.order_id === orderId; });

            if (allDone && orderIdx >= 0) {
                cache.orders[orderIdx].status = 'READY';
                cache.orders[orderIdx].updated_at = now;
            } else if (orderIdx >= 0 && cache.orders[orderIdx].status === 'OPEN') {
                cache.orders[orderIdx].status = 'COOKING';
                cache.orders[orderIdx].updated_at = now;
            }

            saveToLocal();

            if (_isOnline) {
                POS.ApiClient.postAsync('updateLineStatus', { order_line_id: orderLineId, new_status: newStatus });
            }
        },

        finalizeOrder: function(orderId) {
            this._recalcOrderTotals(orderId);
            return this.updateOrderStatus(orderId, 'PAID');
        },

        getActiveOrders: function() {
            var self = this;
            return cache.orders
                .filter(function(o) { return o.status !== 'PAID'; })
                .sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); })
                .map(function(order) {
                    var lines = self.getOrderLines(order.order_id);
                    return Object.assign({}, order, { lines: lines });
                });
        },

        _recalcOrderTotals: function(orderId) {
            var lines = this.getOrderLines(orderId);
            var subtotal = lines.reduce(function(sum, l) { return sum + l.line_total; }, 0);
            var vatRate = this.getSysVar('VAT_RATE') || 0;
            var serviceCharge = this.getSysVar('SERVICE_CHARGE') || 0;
            var grandTotal = subtotal + subtotal * (vatRate / 100) + subtotal * (serviceCharge / 100);

            var idx = cache.orders.findIndex(function(o) { return o.order_id === orderId; });
            if (idx >= 0) {
                cache.orders[idx].subtotal = subtotal;
                cache.orders[idx].grand_total = grandTotal;
                cache.orders[idx].updated_at = new Date().toISOString();
            }
        },

        // ========== Receipts (IDEMPOTENT) ==========

        getReceiptByOrderId: function(orderId) {
            return cache.receipts.find(function(r) { return r.order_id === orderId; }) || null;
        },

        createReceipt: function(orderId, paidTotal) {
            var existing = this.getReceiptByOrderId(orderId);
            if (existing) return existing;

            var prefix = this.getReceiptPrefix();
            var now = new Date();
            var dateStr = formatReceiptDate(now);
            var counterKey = 'RECEIPT_COUNTER_' + dateStr;

            var currentCount = Storage.get(counterKey) || 0;
            var nextCount = currentCount + 1;
            Storage.set(counterKey, nextCount);

            var seq = String(nextCount).padStart(4, '0');
            var receiptNo = prefix + '-' + dateStr + '-' + seq;

            var receipt = {
                receipt_no: receiptNo,
                order_id: orderId,
                paid_total: paidTotal,
                issued_at: now.toISOString(),
                print_count: 0
            };

            cache.receipts.push(receipt);
            saveToLocal();

            if (_isOnline) {
                POS.ApiClient.postAsync('createReceipt', { order_id: orderId, paid_total: paidTotal });
            }

            return receipt;
        },

        getReceipt: function(receiptNo) {
            return cache.receipts.find(function(r) { return r.receipt_no === receiptNo; }) || null;
        },

        incrementPrintCount: function(receiptNo) {
            var idx = cache.receipts.findIndex(function(r) { return r.receipt_no === receiptNo; });
            if (idx >= 0) {
                cache.receipts[idx].print_count = (cache.receipts[idx].print_count || 0) + 1;
                saveToLocal();
                if (_isOnline) {
                    POS.ApiClient.postAsync('incrementPrintCount', { receipt_no: receiptNo });
                }
            }
        },

        // ========== Payments ==========

        recordPayment: function(receiptNo, method, amount) {
            var payment = {
                payment_id: generateId('PAY'),
                receipt_no: receiptNo,
                method: method,
                amount: amount,
                created_at: new Date().toISOString()
            };
            cache.payments.push(payment);
            saveToLocal();

            if (_isOnline) {
                POS.ApiClient.postAsync('recordPayment', {
                    receipt_no: receiptNo, method: method, amount: amount
                });
            }
            return payment;
        },

        getPaymentsByReceipt: function(receiptNo) {
            return cache.payments.filter(function(p) { return p.receipt_no === receiptNo; });
        },

        // ========== Tables ==========

        getTableStatuses: function() {
            var tableCount = this.getTableCount();
            var statuses = {};
            for (var i = 1; i <= tableCount; i++) {
                var activeOrder = null;
                for (var j = 0; j < cache.orders.length; j++) {
                    if (cache.orders[j].table_no == i && cache.orders[j].status !== 'PAID') {
                        activeOrder = cache.orders[j];
                        break;
                    }
                }
                if (activeOrder) {
                    statuses[i] = {
                        status: activeOrder.status,
                        orderId: activeOrder.order_id
                    };
                } else {
                    statuses[i] = { status: 'AVAILABLE' };
                }
            }
            return statuses;
        }
    };
})();
