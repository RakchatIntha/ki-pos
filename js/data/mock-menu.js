/**
 * Mock menu items — placeholder until user provides real data
 */
window.POS = window.POS || {};

POS.MOCK_MENU_ITEMS = [
    // === อาหารจานเดียว (sort_group: 1) ===
    { menu_id: 'M001', name_th: 'ข้าวผัดหมู', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 1, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M002', name_th: 'ข้าวผัดกุ้ง', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 2, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M003', name_th: 'ข้าวผัดปู', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 3, base_price: 90, price_json: null, is_active: true },
    { menu_id: 'M004', name_th: 'ผัดไทกุ้งสด', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 4, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M005', name_th: 'ข้าวคลุกกะปิ', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 5, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M006', name_th: 'ข้าวหมกไก่', category: 'อาหารจานเดียว', category_app: 'จานเดียว', sort_group: 1, sort_order: 6, base_price: 65, price_json: null, is_active: true },

    // === กับข้าว (sort_group: 2) ===
    { menu_id: 'M010', name_th: 'ต้มยำกุ้ง', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 1, base_price: 120, price_json: '{"ธรรมดา":120,"พิเศษ":150}', is_active: true },
    { menu_id: 'M011', name_th: 'แกงเขียวหวานไก่', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 2, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M012', name_th: 'ผัดกะเพราหมูสับ', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 3, base_price: 60, price_json: '{"หมู":60,"ไก่":60,"กุ้ง":80}', is_active: true },
    { menu_id: 'M013', name_th: 'ยำวุ้นเส้น', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 4, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M014', name_th: 'ปลาทอดน้ำปลา', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 5, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M015', name_th: 'ไข่เจียวหมูสับ', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 6, base_price: 50, price_json: null, is_active: true },
    { menu_id: 'M016', name_th: 'ผัดผักรวมมิตร', category: 'กับข้าว', category_app: 'กับข้าว', sort_group: 2, sort_order: 7, base_price: 60, price_json: null, is_active: true },

    // === ของทานเล่น (sort_group: 3) ===
    { menu_id: 'M020', name_th: 'ปอเปี๊ยะทอด', category: 'ของทานเล่น', category_app: 'ทานเล่น', sort_group: 3, sort_order: 1, base_price: 50, price_json: null, is_active: true },
    { menu_id: 'M021', name_th: 'ไก่ทอดหาดใหญ่', category: 'ของทานเล่น', category_app: 'ทานเล่น', sort_group: 3, sort_order: 2, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M022', name_th: 'เต้าหู้ทอด', category: 'ของทานเล่น', category_app: 'ทานเล่น', sort_group: 3, sort_order: 3, base_price: 40, price_json: null, is_active: true },

    // === ข้าว (sort_group: 4) ===
    { menu_id: 'M030', name_th: 'ข้าวสวย', category: 'ข้าว', category_app: 'ข้าว', sort_group: 4, sort_order: 1, base_price: 10, price_json: null, is_active: true },
    { menu_id: 'M031', name_th: 'ข้าวเหนียว', category: 'ข้าว', category_app: 'ข้าว', sort_group: 4, sort_order: 2, base_price: 10, price_json: null, is_active: true },

    // === เครื่องดื่ม (sort_group: 99 — ALWAYS LAST) ===
    { menu_id: 'D001', name_th: 'น้ำเปล่า', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 1, base_price: 10, price_json: null, is_active: true },
    { menu_id: 'D002', name_th: 'น้ำอัดลม', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 2, base_price: 20, price_json: null, is_active: true },
    { menu_id: 'D003', name_th: 'ชาเย็น', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 3, base_price: 35, price_json: null, is_active: true },
    { menu_id: 'D004', name_th: 'กาแฟเย็น', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 4, base_price: 40, price_json: null, is_active: true },
    { menu_id: 'D005', name_th: 'น้ำมะนาว', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 5, base_price: 25, price_json: null, is_active: true },
    { menu_id: 'D006', name_th: 'โอเลี้ยง', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 6, base_price: 30, price_json: null, is_active: true },
];
