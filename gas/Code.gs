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
var SPREADSHEET_ID = ''; // <-- ใส่ ID ของ Google Sheets ที่นี่

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
  var items = [
    ['M001', '\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E2B\u0E21\u0E39', '\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', '\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', 1, 1, 60, '', true],
    ['M002', '\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E44\u0E01\u0E48', '\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', '\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', 1, 2, 60, '', true],
    ['M003', '\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E01\u0E38\u0E49\u0E07', '\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', '\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', 1, 3, 60, '', true],
    ['M004', '\u0E1C\u0E31\u0E14\u0E44\u0E17\u0E22', '\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', '\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', 1, 4, 55, '', true],
    ['M005', '\u0E1A\u0E30\u0E2B\u0E21\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E1A', '\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', '\u0E08\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27', 1, 5, 50, '', true],
    ['M006', '\u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 1, 80, '', true],
    ['M007', '\u0E41\u0E01\u0E07\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2B\u0E27\u0E32\u0E19\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 2, 80, '', true],
    ['M008', '\u0E1C\u0E31\u0E14\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 3, 80, '', true],
    ['M009', '\u0E17\u0E2D\u0E14\u0E21\u0E31\u0E19\u0E2B\u0E21\u0E39', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 4, 70, '', true],
    ['M010', '\u0E1B\u0E25\u0E32\u0E17\u0E31\u0E1A\u0E17\u0E34\u0E21', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 5, 100, '', true],
    ['M011', '\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', '\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27', 2, 6, 70, '', true],
    ['M012', '\u0E1B\u0E2D\u0E40\u0E1B\u0E35\u0E4A\u0E22\u0E30\u0E17\u0E2D\u0E14', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', 3, 1, 45, '', true],
    ['M013', '\u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', 3, 2, 40, '', true],
    ['M014', '\u0E2B\u0E21\u0E39\u0E2A\u0E30\u0E40\u0E15\u0E4A\u0E30', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', 3, 3, 65, '', true],
    ['M015', '\u0E2A\u0E49\u0E21\u0E15\u0E33', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', '\u0E17\u0E32\u0E19\u0E40\u0E25\u0E48\u0E19', 3, 4, 50, '{"3 \u0E0A\u0E34\u0E49\u0E19":50,"5 \u0E0A\u0E34\u0E49\u0E19":80}', true],
    ['M016', '\u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22', '\u0E02\u0E49\u0E32\u0E27', '\u0E02\u0E49\u0E32\u0E27', 4, 1, 15, '', true],
    ['M017', '\u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27', '\u0E02\u0E49\u0E32\u0E27', '\u0E02\u0E49\u0E32\u0E27', 4, 2, 20, '', true],
    ['M018', '\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14', '\u0E02\u0E49\u0E32\u0E27', '\u0E02\u0E49\u0E32\u0E27', 4, 3, 20, '', true],
    ['M019', '\u0E19\u0E49\u0E33\u0E40\u0E1B\u0E25\u0E48\u0E32', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 1, 0, '', true],
    ['M020', '\u0E19\u0E49\u0E33\u0E2D\u0E31\u0E14\u0E25\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 2, 20, '', true],
    ['M021', '\u0E0A\u0E32\u0E40\u0E22\u0E47\u0E19', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 3, 25, '{"R\u0E49\u0E2D\u0E19":25,"\u0E40\u0E22\u0E47\u0E19":30}', true],
    ['M022', '\u0E0A\u0E32\u0E21\u0E30\u0E19\u0E32\u0E27', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 4, 30, '', true],
    ['M023', '\u0E42\u0E2D\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 5, 30, '', true],
    ['M024', '\u0E19\u0E49\u0E33\u0E2A\u0E49\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21', 99, 6, 35, '{"S":25,"M":35,"L":45}', true]
  ];
  items.forEach(function(row) {
    sheet.appendRow(row);
  });
  Logger.log('MENU_ITEMS seeded with ' + items.length + ' items!');
}
