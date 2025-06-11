const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// กำหนด config สำหรับเชื่อมต่อ SQL Server
const dbConfig = {
    user: 'sa',           // ใส่ user ของคุณ
    password: '12345678Za', // ใส่รหัสผ่านของคุณ
    server: 'localhost',
    database: 'Makro',
    options: {
        encrypt: false,   // ถ้าใช้ SQL Server บน Windows ให้เป็น false
        trustServerCertificate: true
    }
};

// ทดสอบเชื่อมต่อฐานข้อมูล
app.get('/api/test-db', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT TOP 1 * FROM warehouses');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ตัวอย่าง API ดูใบงานโอนย้ายทั้งหมด
app.get('/api/transfer-tasks', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM transfer_tasks');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่มต้น server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});