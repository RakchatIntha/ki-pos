/**
 * เมนูอาหารครัวอินทรักษ์ — ตามไฟล์ราคาและเมนู.xlsx
 */
window.POS = window.POS || {};

POS.MOCK_MENU_ITEMS = [
    // ═══════════════════════════════════════════
    // 1. เมนูแนะนำ/เมนูพิเศษ (sort_group: 1)
    // ═══════════════════════════════════════════
    { menu_id: 'M001', name_th: 'จิ้งหรีดทอด', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 1, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M002', name_th: 'ปลารากกล้วยทอด', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 2, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M003', name_th: 'กบทอดกระเทียม', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 3, base_price: 250, price_json: null, is_active: true },
    { menu_id: 'M004', name_th: 'หมู/เนื้อแดดเดียว', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 4, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M005', name_th: 'ไข่เจียวไข่ผำ', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 5, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M006', name_th: 'แกงอ่อมไข่ผำ', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 6, base_price: 120, price_json: '{"หมู":120,"เนื้อ":150}', is_active: true },
    { menu_id: 'M007', name_th: 'ผัดไทย', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 7, base_price: 70, price_json: '{"หมู":70,"กุ้ง":80}', is_active: true },
    { menu_id: 'M008', name_th: 'แมงกะพรุนน้ำมันงา/ยำ', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 8, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M009', name_th: 'ต้มแห้งเนื้อรวม', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 9, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M010', name_th: 'ผัดเผ็ดปลากดกุลาใบยี่หร่า', category: 'เมนูแนะนำ/เมนูพิเศษ', category_app: 'แนะนำ', sort_group: 1, sort_order: 10, base_price: 120, price_json: null, is_active: true },

    // ═══════════════════════════════════════════
    // 2. เมนูครัวอีสาน (sort_group: 2)
    // ═══════════════════════════════════════════
    { menu_id: 'M020', name_th: 'ลาบ', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 1, base_price: 80, price_json: '{"เป็ด":100,"หมู":80,"เนื้อ":80}', is_active: true },
    { menu_id: 'M021', name_th: 'ก้อยขม', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 2, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M022', name_th: 'ก้อยคั่ว', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 3, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M023', name_th: 'ต้มขมรวม', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 4, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M024', name_th: 'ต้มขมเนื้อ', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 5, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M025', name_th: 'ต้มแซ่บเนื้อรวม', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 6, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M026', name_th: 'ต้มแซ่บเนื้อ', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 7, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M027', name_th: 'ต้มแซ่บกระดูกอ่อน', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 8, base_price: 100, price_json: '{"ธรรมดา":100,"ใส่ไข่":120}', is_active: true },
    { menu_id: 'M028', name_th: 'แกงหน่อไม้ดอง', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 9, base_price: 100, price_json: '{"ไก่":100,"ปลาดุก":100}', is_active: true },
    { menu_id: 'M029', name_th: 'แกงอ่อม', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 10, base_price: 100, price_json: '{"ไก่":100,"หมู":100,"เนื้อ":100}', is_active: true },
    { menu_id: 'M030', name_th: 'ตำป่า', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 11, base_price: 100, price_json: '{"จาน":100,"ถาด":150}', is_active: true },
    { menu_id: 'M031', name_th: 'ตำซั่ว', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 12, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M032', name_th: 'ตำถั่ว', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 13, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M033', name_th: 'ตำแตง', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 14, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M034', name_th: 'ตำปลาร้า', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 15, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M035', name_th: 'ตำไทย', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 16, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M036', name_th: 'ตำปู', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 17, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M037', name_th: 'ตำหมูยอ', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 18, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M038', name_th: 'ตำปูปลาร้า', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 19, base_price: 60, price_json: null, is_active: true },
    { menu_id: 'M039', name_th: 'ตำกุ้งสด', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 20, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M040', name_th: 'ข้าวสวย', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 21, base_price: 10, price_json: null, is_active: true },
    { menu_id: 'M041', name_th: 'ข้าวเหนียว', category: 'เมนูครัวอีสาน', category_app: 'ครัวอีสาน', sort_group: 2, sort_order: 22, base_price: 10, price_json: null, is_active: true },

    // ═══════════════════════════════════════════
    // 3. เมนูครัวไทย (sort_group: 3)
    // ═══════════════════════════════════════════
    { menu_id: 'M050', name_th: 'ปีกไก่ทอด', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 1, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M051', name_th: 'เอ็นไก่ทอด', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 2, base_price: 120, price_json: null, is_active: true },
    { menu_id: 'M052', name_th: 'ไก่ทอดสมุนไพร', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 3, base_price: 120, price_json: null, is_active: true },
    { menu_id: 'M053', name_th: 'ไก่ทอดเกลือ', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 4, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M054', name_th: 'สามชั้นทอดน้ำปลา', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 5, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M055', name_th: 'ผัดเผ็ดไก่หน่อไม้ดอง', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 6, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M056', name_th: 'ผัดเผ็ดกบ', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 7, base_price: 150, price_json: null, is_active: true },
    { menu_id: 'M057', name_th: 'หมูมะนาว', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 8, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M058', name_th: 'ยำวุ้นเส้น (หมูสับ)', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 9, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'M059', name_th: 'ยำวุ้นเส้นโบราณ', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 10, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M060', name_th: 'ยำกุ้งสด/รวมมิตร', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 11, base_price: 120, price_json: '{"กุ้งสด":120,"รวมมิตร":150}', is_active: true },
    { menu_id: 'M061', name_th: 'ยำแมงกะพรุน', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 12, base_price: 120, price_json: null, is_active: true },
    { menu_id: 'M062', name_th: 'ยำหมูยอหนัง', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 13, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M063', name_th: 'ต้มจืดผักกาดขาวหมูสับ', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 14, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M064', name_th: 'ต้มจืดไข่น้ำ', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 15, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M065', name_th: 'ต้มยำไก่บ้าน', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 16, base_price: 100, price_json: null, is_active: true },
    { menu_id: 'M066', name_th: 'ต้มยำกุ้ง', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 17, base_price: 100, price_json: '{"น้ำใส":100,"น้ำข้น":120}', is_active: true },
    { menu_id: 'M067', name_th: 'แกงป่า', category: 'เมนูครัวไทย', category_app: 'ครัวไทย', sort_group: 3, sort_order: 18, base_price: 150, price_json: '{"หมูสามชั้น":150,"ไก่บ้าน":150,"กุ้ง":150}', is_active: true },

    // ═══════════════════════════════════════════
    // 4. อาหารตามสั่ง (sort_group: 4)
    // ═══════════════════════════════════════════
    { menu_id: 'M070', name_th: 'กะเพรา', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 1, base_price: 60, price_json: '{"หมู":60,"ไก่":60,"กุ้ง":70,"เนื้อ":70}', is_active: true },
    { menu_id: 'M071', name_th: 'ข้าวผัด', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 2, base_price: 60, price_json: '{"หมู":60,"ไก่":60,"กุ้ง":70}', is_active: true },
    { menu_id: 'M072', name_th: 'ข้าวหมูทอดกระเทียม', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 3, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M073', name_th: 'ข้าวไก่ทอดกระเทียม', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 4, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M074', name_th: 'ผัดไทย (ตามสั่ง)', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 5, base_price: 70, price_json: '{"หมู":70,"กุ้ง":80}', is_active: true },
    { menu_id: 'M075', name_th: 'ข้าวต้มหมู', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 6, base_price: 70, price_json: null, is_active: true },
    { menu_id: 'M076', name_th: 'ไข่ดาว', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 7, base_price: 10, price_json: null, is_active: true },
    { menu_id: 'M077', name_th: 'ไข่เจียว', category: 'อาหารตามสั่ง', category_app: 'ตามสั่ง', sort_group: 4, sort_order: 8, base_price: 10, price_json: null, is_active: true },

    // ═══════════════════════════════════════════
    // 5. เครื่องดื่ม (sort_group: 99 — ALWAYS LAST)
    // ═══════════════════════════════════════════
    { menu_id: 'D001', name_th: 'เบียร์สิงห์', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 1, base_price: 85, price_json: null, is_active: true },
    { menu_id: 'D002', name_th: 'เบียร์ช้าง', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 2, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'D003', name_th: 'เบียร์ลีโอ', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 3, base_price: 80, price_json: null, is_active: true },
    { menu_id: 'D004', name_th: 'โซดา', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 4, base_price: 20, price_json: null, is_active: true },
    { menu_id: 'D005', name_th: 'น้ำเปล่า', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 5, base_price: 10, price_json: '{"เล็ก":10,"ใหญ่":30}', is_active: true },
    { menu_id: 'D006', name_th: 'น้ำแข็ง', category: 'เครื่องดื่ม', category_app: 'เครื่องดื่ม', sort_group: 99, sort_order: 6, base_price: 10, price_json: '{"เล็ก":10,"ใหญ่":20}', is_active: true }
];
