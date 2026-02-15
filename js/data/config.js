/**
 * POS Configuration
 * ตั้งค่า API URL หลัง deploy Google Apps Script Web App
 */
window.POS = window.POS || {};

POS.CONFIG = {
    // ใส่ URL ของ Google Apps Script Web App ที่นี่
    // ตัวอย่าง: 'https://script.google.com/macros/s/AKfycb.../exec'
    API_URL: 'https://script.google.com/macros/s/AKfycbxVI1zdSAKfSL5Ci9R-UvM-hRpHrB1xMuI8irMOyTiLOeyrfmphqo3NSR7AP4EA4yPj/exec',

    // ระยะเวลา polling (มิลลิวินาที) — 3 วินาที
    POLL_INTERVAL: 3000,

    // เปิด polling อัตโนมัติ
    POLL_ENABLED: true,

    // Fallback ไป localStorage/memory ถ้า API ไม่ตอบ
    OFFLINE_FALLBACK: true,

    // Timeout สำหรับ API calls (มิลลิวินาที) — 15 วินาที (Apps Script cold start)
    API_TIMEOUT: 15000
};
