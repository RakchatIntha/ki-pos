/**
 * KI POS — Google Apps Script Web App API
 * Owner: rakchatintha@gmail.com
 *
 * Deploy as Web App:
 *   Execute as: Me (rakchatintha@gmail.com)
 *   Who has access: Anyone
 *
 * Spreadsheet tabs: MENU_ITEMS, SYS_VARS, ORDERS, ORDER_LINES, RECEIPTS, PAYMENTS, RECEIPT_COUNTERS
 */

// ==================== CONFIG ====================
var SPREADSHEET_ID = '1pTaPgwoJNcHVSKideXewlDAR5QgKKRhSNRe-RlHs5Uo';

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ==================== HELPERS ====================

function sheetToArray(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }
  return result;
}

function appendRow(sheetName, obj) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

function findRowIndex(sheetName, keyCol, keyVal) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx = headers.indexOf(keyCol);
  if (colIdx < 0) return -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(keyVal)) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

function updateCell(sheetName, rowNum, colName, value) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIdx = headers.indexOf(colName);
  if (colIdx < 0) return;
  sheet.getRange(rowNum, colIdx + 1).setValue(value);
}

function updateCells(sheetName, rowNum, updates) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var colName in updates) {
    var colIdx = headers.indexOf(colName);
    if (colIdx >= 0) {
      sheet.getRange(rowNum, colIdx + 1).setValue(updates[colName]);
    }
  }
}

function generateId(prefix) {
  var ts = Date.now().toString(36);
  var rnd = Math.random().toString(36).substring(2, 8);
  return prefix ? (prefix + '_' + ts + '_' + rnd) : (ts + '_' + rnd);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return jsonResponse({ success: false, error: message });
}

function successResponse(data) {
  return jsonResponse({ success: true, data: data });
}

// ==================== GET HANDLER ====================

function doGet(e) {
  try {
    var action = e.parameter.action;

    switch (action) {
      case 'getMenuItems':
        return successResponse(getMenuItems());

      case 'getAllMenuItems':
        return successResponse(getAllMenuItems());

      case 'getSysVars':
        return successResponse(sheetToArray('SYS_VARS'));

      case 'getSysVar':
        return successResponse(getSysVar(e.parameter.key));

      case 'getOrders':
        return successResponse(getOrders(e.parameter.status));

      case 'getOrder':
        return successResponse(getOrder(e.parameter.id));

      case 'getOrderLines':
        return successResponse(getOrderLines(e.parameter.orderId));

      case 'getTableStatuses':
        return successResponse(getTableStatuses());

      case 'getActiveOrders':
        return successResponse(getActiveOrders());

      case 'getReceiptByOrderId':
        return successResponse(getReceiptByOrderId(e.parameter.id));

      case 'getPaymentsByReceipt':
        return successResponse(getPaymentsByReceipt(e.parameter.no));

      case 'pollUpdates':
        return successResponse(pollUpdates(e.parameter.since));

      case 'getAllData':
        return successResponse(getAllData());

      case 'ping':
        return successResponse({ pong: true, timestamp: new Date().toISOString() });

      default:
        return errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

// ==================== POST HANDLER ====================

function doPost(e) {
  try {
    var params = e.parameter;
    var action = params.action;
    var body = {};

    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Use URL params as fallback
      }
    }

    // Merge URL params into body (URL params take precedence)
    for (var key in params) {
      if (key !== 'action') {
        body[key] = params[key];
      }
    }

    switch (action) {
      case 'createOrder':
        return successResponse(createOrder(body));

      case 'addOrderLine':
        return successResponse(addOrderLine(body));

      case 'updateOrderLineQty':
        return successResponse(updateOrderLineQty(body));

      case 'removeOrderLine':
        return successResponse(removeOrderLine(body));

      case 'updateOrderStatus':
        return successResponse(updateOrderStatus(body));

      case 'updateLineStatus':
        return successResponse(updateLineStatus(body));

      case 'finalizeOrder':
        return successResponse(finalizeOrder(body));

      case 'createReceipt':
        return successResponse(createReceipt(body));

      case 'recordPayment':
        return successResponse(recordPayment(body));

      case 'incrementPrintCount':
        return successResponse(incrementPrintCount(body));

      case 'toggleMenuItem':
        return successResponse(toggleMenuItem(body));

      default:
        return errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

// ==================== GET IMPLEMENTATIONS ====================

function getMenuItems() {
  var items = sheetToArray('MENU_ITEMS');
  return items.filter(function(item) {
    return item.is_active === true || item.is_active === 'TRUE' || item.is_active === 1;
  }).sort(function(a, b) {
    if (a.sort_group !== b.sort_group) return a.sort_group - b.sort_group;
    return a.sort_order - b.sort_order;
  });
}

function getAllMenuItems() {
  var items = sheetToArray('MENU_ITEMS');
  return items.sort(function(a, b) {
    if (a.sort_group !== b.sort_group) return a.sort_group - b.sort_group;
    return a.sort_order - b.sort_order;
  });
}

function getSysVar(key) {
  var vars = sheetToArray('SYS_VARS');
  var found = vars.filter(function(v) { return v.VAR_KEY === key; });
  if (found.length === 0) return null;
  var v = found[0];
  if (v.VAR_TYPE === 'NUMBER') return { key: key, value: Number(v.VAR_VALUE) };
  if (v.VAR_TYPE === 'CSV') return { key: key, value: String(v.VAR_VALUE).split(',') };
  return { key: key, value: v.VAR_VALUE };
}

function getOrders(statusFilter) {
  var orders = sheetToArray('ORDERS');
  if (statusFilter) {
    var statuses = statusFilter.split(',');
    orders = orders.filter(function(o) { return statuses.indexOf(o.status) >= 0; });
  }
  return orders;
}

function getOrder(orderId) {
  var orders = sheetToArray('ORDERS');
  var order = orders.filter(function(o) { return o.order_id === orderId; })[0];
  if (!order) return null;
  order.lines = getOrderLines(orderId);
  return order;
}

function getOrderLines(orderId) {
  var lines = sheetToArray('ORDER_LINES');
  return lines.filter(function(l) { return l.order_id === orderId; });
}

function getTableStatuses() {
  var sysVars = sheetToArray('SYS_VARS');
  var tableCountVar = sysVars.filter(function(v) { return v.VAR_KEY === 'TABLE_COUNT'; })[0];
  var tableCount = tableCountVar ? Number(tableCountVar.VAR_VALUE) : 12;

  var orders = sheetToArray('ORDERS');
  var statuses = {};

  for (var i = 1; i <= tableCount; i++) {
    var activeOrder = null;
    for (var j = 0; j < orders.length; j++) {
      if (orders[j].table_no == i && orders[j].status !== 'PAID') {
        activeOrder = orders[j];
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

function getActiveOrders() {
  var orders = sheetToArray('ORDERS');
  var allLines = sheetToArray('ORDER_LINES');

  var active = orders.filter(function(o) { return o.status !== 'PAID'; });

  active.forEach(function(order) {
    order.lines = allLines.filter(function(l) { return l.order_id === order.order_id; });
  });

  active.sort(function(a, b) {
    return new Date(a.created_at) - new Date(b.created_at);
  });

  return active;
}

function getReceiptByOrderId(orderId) {
  var receipts = sheetToArray('RECEIPTS');
  var found = receipts.filter(function(r) { return r.order_id === orderId; });
  return found.length > 0 ? found[0] : null;
}

function getPaymentsByReceipt(receiptNo) {
  var payments = sheetToArray('PAYMENTS');
  return payments.filter(function(p) { return p.receipt_no === receiptNo; });
}

function pollUpdates(sinceTimestamp) {
  if (!sinceTimestamp) {
    return { hasChanges: false, serverTimestamp: new Date().toISOString() };
  }

  var since = new Date(sinceTimestamp);
  var orders = sheetToArray('ORDERS');
  var allLines = sheetToArray('ORDER_LINES');

  var changedOrders = orders.filter(function(o) {
    return o.updated_at && new Date(o.updated_at) > since;
  });

  var changedLines = allLines.filter(function(l) {
    return l.line_status_updated_at && new Date(l.line_status_updated_at) > since;
  });

  // Also include lines of changed orders
  var changedOrderIds = changedOrders.map(function(o) { return o.order_id; });
  allLines.forEach(function(l) {
    if (changedOrderIds.indexOf(l.order_id) >= 0) {
      var alreadyIncluded = changedLines.some(function(cl) {
        return cl.order_line_id === l.order_line_id;
      });
      if (!alreadyIncluded) {
        changedLines.push(l);
      }
    }
  });

  return {
    hasChanges: changedOrders.length > 0 || changedLines.length > 0,
    orders: changedOrders,
    lines: changedLines,
    serverTimestamp: new Date().toISOString()
  };
}

function getAllData() {
  return {
    menuItems: getMenuItems(),
    sysVars: sheetToArray('SYS_VARS'),
    orders: sheetToArray('ORDERS'),
    orderLines: sheetToArray('ORDER_LINES'),
    receipts: sheetToArray('RECEIPTS'),
    payments: sheetToArray('PAYMENTS'),
    serverTimestamp: new Date().toISOString()
  };
}

// ==================== POST IMPLEMENTATIONS ====================

function createOrder(body) {
  var now = new Date().toISOString();
  var order = {
    order_id: generateId('ORD'),
    table_no: Number(body.table_no),
    status: 'OPEN',
    subtotal: 0,
    grand_total: 0,
    created_at: now,
    updated_at: now
  };
  appendRow('ORDERS', order);
  return order;
}

function addOrderLine(body) {
  var now = new Date().toISOString();
  var line = {
    order_line_id: generateId('OL'),
    order_id: body.order_id,
    menu_id: body.menu_id,
    item_name_th: body.item_name_th,
    qty: Number(body.qty),
    unit_price: Number(body.unit_price),
    line_total: Number(body.unit_price) * Number(body.qty),
    line_status: 'PENDING',
    line_status_updated_at: now
  };
  appendRow('ORDER_LINES', line);

  // Recalc order totals
  recalcOrderTotals(body.order_id);

  return line;
}

function updateOrderLineQty(body) {
  var lineId = body.order_line_id;
  var orderId = body.order_id;
  var newQty = Number(body.new_qty);
  var now = new Date().toISOString();

  if (newQty <= 0) {
    return removeOrderLine(body);
  }

  var rowNum = findRowIndex('ORDER_LINES', 'order_line_id', lineId);
  if (rowNum < 0) return { error: 'Line not found' };

  var sheet = getSpreadsheet().getSheetByName('ORDER_LINES');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];

  var unitPriceIdx = headers.indexOf('unit_price');
  var unitPrice = rowData[unitPriceIdx];

  updateCells('ORDER_LINES', rowNum, {
    qty: newQty,
    line_total: unitPrice * newQty,
    line_status_updated_at: now
  });

  recalcOrderTotals(orderId);

  return { order_line_id: lineId, qty: newQty, line_total: unitPrice * newQty };
}

function removeOrderLine(body) {
  var lineId = body.order_line_id;
  var orderId = body.order_id;

  var sheet = getSpreadsheet().getSheetByName('ORDER_LINES');
  var rowNum = findRowIndex('ORDER_LINES', 'order_line_id', lineId);
  if (rowNum < 0) return { error: 'Line not found' };

  sheet.deleteRow(rowNum);
  recalcOrderTotals(orderId);

  return { removed: lineId };
}

function updateOrderStatus(body) {
  var orderId = body.order_id;
  var newStatus = body.new_status;
  var now = new Date().toISOString();

  var rowNum = findRowIndex('ORDERS', 'order_id', orderId);
  if (rowNum < 0) return { error: 'Order not found' };

  updateCells('ORDERS', rowNum, {
    status: newStatus,
    updated_at: now
  });

  return { order_id: orderId, status: newStatus };
}

function updateLineStatus(body) {
  var lineId = body.order_line_id;
  var newStatus = body.new_status;
  var now = new Date().toISOString();

  var rowNum = findRowIndex('ORDER_LINES', 'order_line_id', lineId);
  if (rowNum < 0) return { error: 'Line not found' };

  updateCells('ORDER_LINES', rowNum, {
    line_status: newStatus,
    line_status_updated_at: now
  });

  // Check if ALL lines of this order are DONE
  var sheet = getSpreadsheet().getSheetByName('ORDER_LINES');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  var orderIdIdx = headers.indexOf('order_id');
  var orderId = rowData[orderIdIdx];

  var allLines = getOrderLines(orderId);
  var allDone = allLines.length > 0 && allLines.every(function(l) {
    return l.line_status === 'DONE';
  });

  if (allDone) {
    updateOrderStatus({ order_id: orderId, new_status: 'READY' });
  } else {
    // If at least one line is being worked on, set order to COOKING
    var orderRow = findRowIndex('ORDERS', 'order_id', orderId);
    if (orderRow > 0) {
      var orderSheet = getSpreadsheet().getSheetByName('ORDERS');
      var orderHeaders = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0];
      var orderData = orderSheet.getRange(orderRow, 1, 1, orderSheet.getLastColumn()).getValues()[0];
      var statusIdx = orderHeaders.indexOf('status');
      var currentStatus = orderData[statusIdx];

      if (currentStatus === 'OPEN') {
        updateOrderStatus({ order_id: orderId, new_status: 'COOKING' });
      }
    }
  }

  return { order_line_id: lineId, line_status: newStatus, order_auto_status: allDone ? 'READY' : null };
}

function finalizeOrder(body) {
  var orderId = body.order_id;

  recalcOrderTotals(orderId);
  updateOrderStatus({ order_id: orderId, new_status: 'PAID' });

  var order = getOrder(orderId);
  return order;
}

function createReceipt(body) {
  var orderId = body.order_id;
  var paidTotal = Number(body.paid_total);

  // IDEMPOTENCY: check if receipt already exists
  var existing = getReceiptByOrderId(orderId);
  if (existing) return existing;

  // Atomic counter with lock
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var now = new Date();
    var yy = String(now.getFullYear()).slice(-2);
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var dd = String(now.getDate()).padStart(2, '0');
    var dateKey = yy + mm + dd;

    // Get or create counter
    var counterSheet = getSpreadsheet().getSheetByName('RECEIPT_COUNTERS');
    var counterRowNum = findRowIndex('RECEIPT_COUNTERS', 'date_key', dateKey);
    var nextCount;

    if (counterRowNum > 0) {
      var currentCount = counterSheet.getRange(counterRowNum, 2).getValue();
      nextCount = Number(currentCount) + 1;
      counterSheet.getRange(counterRowNum, 2).setValue(nextCount);
    } else {
      nextCount = 1;
      counterSheet.appendRow([dateKey, nextCount]);
    }

    // Get receipt prefix from SYS_VARS
    var prefixVar = getSysVar('RECEIPT_PREFIX');
    var prefix = (prefixVar && prefixVar.value) ? prefixVar.value : 'KI';

    var seq = String(nextCount).padStart(4, '0');
    var receiptNo = prefix + '-' + dateKey + '-' + seq;

    var receipt = {
      receipt_no: receiptNo,
      order_id: orderId,
      paid_total: paidTotal,
      issued_at: now.toISOString(),
      print_count: 0
    };

    appendRow('RECEIPTS', receipt);
    return receipt;
  } finally {
    lock.releaseLock();
  }
}

function recordPayment(body) {
  var payment = {
    payment_id: generateId('PAY'),
    receipt_no: body.receipt_no,
    method: body.method,
    amount: Number(body.amount),
    created_at: new Date().toISOString()
  };
  appendRow('PAYMENTS', payment);
  return payment;
}

function incrementPrintCount(body) {
  var receiptNo = body.receipt_no;
  var rowNum = findRowIndex('RECEIPTS', 'receipt_no', receiptNo);
  if (rowNum < 0) return { error: 'Receipt not found' };

  var sheet = getSpreadsheet().getSheetByName('RECEIPTS');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIdx = headers.indexOf('print_count');
  var currentCount = sheet.getRange(rowNum, colIdx + 1).getValue();
  sheet.getRange(rowNum, colIdx + 1).setValue(Number(currentCount) + 1);

  return { receipt_no: receiptNo, print_count: Number(currentCount) + 1 };
}

function toggleMenuItem(body) {
  var menuId = body.menu_id;
  var isActive = body.is_active; // true or false

  var rowNum = findRowIndex('MENU_ITEMS', 'menu_id', menuId);
  if (rowNum < 0) return { error: 'Menu item not found' };

  updateCell('MENU_ITEMS', rowNum, 'is_active', isActive);
  return { menu_id: menuId, is_active: isActive };
}

// ==================== HELPER: Recalc order totals ====================

function recalcOrderTotals(orderId) {
  var lines = getOrderLines(orderId);
  var subtotal = lines.reduce(function(sum, l) { return sum + Number(l.line_total); }, 0);

  var vatVar = getSysVar('VAT_RATE');
  var svcVar = getSysVar('SERVICE_CHARGE');
  var vatRate = (vatVar && vatVar.value) ? Number(vatVar.value) : 0;
  var svcRate = (svcVar && svcVar.value) ? Number(svcVar.value) : 0;

  var grandTotal = subtotal + subtotal * (vatRate / 100) + subtotal * (svcRate / 100);

  var rowNum = findRowIndex('ORDERS', 'order_id', orderId);
  if (rowNum > 0) {
    updateCells('ORDERS', rowNum, {
      subtotal: subtotal,
      grand_total: grandTotal,
      updated_at: new Date().toISOString()
    });
  }
}

// ==================== SETUP: Create sheets with headers ====================

function setupSheets() {
  var ss = getSpreadsheet();

  var sheets = {
    'MENU_ITEMS': ['menu_id', 'name_th', 'category', 'category_app', 'sort_group', 'sort_order', 'base_price', 'price_json', 'is_active'],
    'SYS_VARS': ['VAR_KEY', 'VAR_VALUE', 'VAR_TYPE'],
    'ORDERS': ['order_id', 'table_no', 'status', 'subtotal', 'grand_total', 'created_at', 'updated_at'],
    'ORDER_LINES': ['order_line_id', 'order_id', 'menu_id', 'item_name_th', 'qty', 'unit_price', 'line_total', 'line_status', 'line_status_updated_at'],
    'RECEIPTS': ['receipt_no', 'order_id', 'paid_total', 'issued_at', 'print_count'],
    'PAYMENTS': ['payment_id', 'receipt_no', 'method', 'amount', 'created_at'],
    'RECEIPT_COUNTERS': ['date_key', 'counter']
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // Set headers in row 1
    var headers = sheets[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  Logger.log('All sheets created with headers!');
}

function seedSysVars() {
  var sheet = getSpreadsheet().getSheetByName('SYS_VARS');
  var data = [
    ['VAT_RATE', '0', 'NUMBER'],
    ['SERVICE_CHARGE', '0', 'NUMBER'],
    ['RECEIPT_PREFIX', 'KI', 'STRING'],
    ['PAYMENT_METHODS', 'CASH,QR', 'CSV'],
    ['SHOP_NAME', '\u0E04\u0E23\u0E31\u0E27\u0E2D\u0E34\u0E19\u0E17\u0E23\u0E31\u0E01\u0E29\u0E4C', 'STRING'],
    ['SHOP_ADDRESS', '', 'STRING'],
    ['SHOP_PHONE', '', 'STRING'],
    ['TABLE_COUNT', '12', 'NUMBER']
  ];
  data.forEach(function(row) {
    sheet.appendRow(row);
  });
  Logger.log('SYS_VARS seeded!');
}

function seedMenuItems() {
  var sheet = getSpreadsheet().getSheetByName('MENU_ITEMS');
  // ลบข้อมูลเดิม (เก็บ header ไว้)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  var items = [
    // 1. เมนูแนะนำ/เมนูพิเศษ
    ['M001', 'จิ้งหรีดทอด', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 1, 100, '', true],
    ['M002', 'ปลารากกล้วยทอด', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 2, 150, '', true],
    ['M003', 'กบทอดกระเทียม', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 3, 250, '', true],
    ['M004', 'หมู/เนื้อแดดเดียว', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 4, 150, '', true],
    ['M005', 'ไข่เจียวไข่ผำ', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 5, 150, '', true],
    ['M006', 'แกงอ่อมไข่ผำ', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 6, 120, '{"หมู":120,"เนื้อ":150}', true],
    ['M007', 'ผัดไทย', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 7, 70, '{"หมู":70,"กุ้ง":80}', true],
    ['M008', 'แมงกะพรุนน้ำมันงา/ยำ', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 8, 100, '', true],
    ['M009', 'ต้มแห้งเนื้อรวม', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 9, 150, '', true],
    ['M010', 'ผัดเผ็ดปลากดกุลาใบยี่หร่า', 'เมนูแนะนำ/เมนูพิเศษ', 'แนะนำ', 1, 10, 120, '', true],
    // 2. เมนูครัวอีสาน
    ['M020', 'ลาบ', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 1, 80, '{"เป็ด":100,"หมู":80,"เนื้อ":80}', true],
    ['M021', 'ก้อยขม', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 2, 80, '', true],
    ['M022', 'ก้อยคั่ว', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 3, 80, '', true],
    ['M023', 'ต้มขมรวม', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 4, 100, '', true],
    ['M024', 'ต้มขมเนื้อ', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 5, 100, '', true],
    ['M025', 'ต้มแซ่บเนื้อรวม', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 6, 100, '', true],
    ['M026', 'ต้มแซ่บเนื้อ', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 7, 100, '', true],
    ['M027', 'ต้มแซ่บกระดูกอ่อน', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 8, 100, '{"ธรรมดา":100,"ใส่ไข่":120}', true],
    ['M028', 'แกงหน่อไม้ดอง', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 9, 100, '{"ไก่":100,"ปลาดุก":100}', true],
    ['M029', 'แกงอ่อม', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 10, 100, '{"ไก่":100,"หมู":100,"เนื้อ":100}', true],
    ['M030', 'ตำป่า', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 11, 100, '{"จาน":100,"ถาด":150}', true],
    ['M031', 'ตำซั่ว', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 12, 70, '', true],
    ['M032', 'ตำถั่ว', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 13, 60, '', true],
    ['M033', 'ตำแตง', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 14, 60, '', true],
    ['M034', 'ตำปลาร้า', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 15, 60, '', true],
    ['M035', 'ตำไทย', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 16, 60, '', true],
    ['M036', 'ตำปู', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 17, 60, '', true],
    ['M037', 'ตำหมูยอ', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 18, 80, '', true],
    ['M038', 'ตำปูปลาร้า', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 19, 60, '', true],
    ['M039', 'ตำกุ้งสด', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 20, 100, '', true],
    ['M040', 'ข้าวสวย', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 21, 10, '', true],
    ['M041', 'ข้าวเหนียว', 'เมนูครัวอีสาน', 'ครัวอีสาน', 2, 22, 10, '', true],
    // 3. เมนูครัวไทย
    ['M050', 'ปีกไก่ทอด', 'เมนูครัวไทย', 'ครัวไทย', 3, 1, 100, '', true],
    ['M051', 'เอ็นไก่ทอด', 'เมนูครัวไทย', 'ครัวไทย', 3, 2, 120, '', true],
    ['M052', 'ไก่ทอดสมุนไพร', 'เมนูครัวไทย', 'ครัวไทย', 3, 3, 120, '', true],
    ['M053', 'ไก่ทอดเกลือ', 'เมนูครัวไทย', 'ครัวไทย', 3, 4, 100, '', true],
    ['M054', 'สามชั้นทอดน้ำปลา', 'เมนูครัวไทย', 'ครัวไทย', 3, 5, 100, '', true],
    ['M055', 'ผัดเผ็ดไก่หน่อไม้ดอง', 'เมนูครัวไทย', 'ครัวไทย', 3, 6, 100, '', true],
    ['M056', 'ผัดเผ็ดกบ', 'เมนูครัวไทย', 'ครัวไทย', 3, 7, 150, '', true],
    ['M057', 'หมูมะนาว', 'เมนูครัวไทย', 'ครัวไทย', 3, 8, 100, '', true],
    ['M058', 'ยำวุ้นเส้น (หมูสับ)', 'เมนูครัวไทย', 'ครัวไทย', 3, 9, 80, '', true],
    ['M059', 'ยำวุ้นเส้นโบราณ', 'เมนูครัวไทย', 'ครัวไทย', 3, 10, 100, '', true],
    ['M060', 'ยำกุ้งสด/รวมมิตร', 'เมนูครัวไทย', 'ครัวไทย', 3, 11, 120, '{"กุ้งสด":120,"รวมมิตร":150}', true],
    ['M061', 'ยำแมงกะพรุน', 'เมนูครัวไทย', 'ครัวไทย', 3, 12, 120, '', true],
    ['M062', 'ยำหมูยอหนัง', 'เมนูครัวไทย', 'ครัวไทย', 3, 13, 100, '', true],
    ['M063', 'ต้มจืดผักกาดขาวหมูสับ', 'เมนูครัวไทย', 'ครัวไทย', 3, 14, 100, '', true],
    ['M064', 'ต้มจืดไข่น้ำ', 'เมนูครัวไทย', 'ครัวไทย', 3, 15, 100, '', true],
    ['M065', 'ต้มยำไก่บ้าน', 'เมนูครัวไทย', 'ครัวไทย', 3, 16, 100, '', true],
    ['M066', 'ต้มยำกุ้ง', 'เมนูครัวไทย', 'ครัวไทย', 3, 17, 100, '{"น้ำใส":100,"น้ำข้น":120}', true],
    ['M067', 'แกงป่า', 'เมนูครัวไทย', 'ครัวไทย', 3, 18, 150, '{"หมูสามชั้น":150,"ไก่บ้าน":150,"กุ้ง":150}', true],
    // 4. อาหารตามสั่ง
    ['M070', 'กะเพรา', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 1, 60, '{"หมู":60,"ไก่":60,"กุ้ง":70,"เนื้อ":70}', true],
    ['M071', 'ข้าวผัด', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 2, 60, '{"หมู":60,"ไก่":60,"กุ้ง":70}', true],
    ['M072', 'ข้าวหมูทอดกระเทียม', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 3, 70, '', true],
    ['M073', 'ข้าวไก่ทอดกระเทียม', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 4, 70, '', true],
    ['M074', 'ผัดไทย (ตามสั่ง)', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 5, 70, '{"หมู":70,"กุ้ง":80}', true],
    ['M075', 'ข้าวต้มหมู', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 6, 70, '', true],
    ['M076', 'ไข่ดาว', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 7, 10, '', true],
    ['M077', 'ไข่เจียว', 'อาหารตามสั่ง', 'ตามสั่ง', 4, 8, 10, '', true],
    // 5. เครื่องดื่ม
    ['D001', 'เบียร์สิงห์', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 1, 85, '', true],
    ['D002', 'เบียร์ช้าง', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 2, 80, '', true],
    ['D003', 'เบียร์ลีโอ', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 3, 80, '', true],
    ['D004', 'โซดา', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 4, 20, '', true],
    ['D005', 'น้ำเปล่า', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 5, 10, '{"เล็ก":10,"ใหญ่":30}', true],
    ['D006', 'น้ำแข็ง', 'เครื่องดื่ม', 'เครื่องดื่ม', 99, 6, 10, '{"เล็ก":10,"ใหญ่":20}', true]
  ];
  items.forEach(function(row) {
    sheet.appendRow(row);
  });
  Logger.log('MENU_ITEMS seeded with ' + items.length + ' items!');
}
