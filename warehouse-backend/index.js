const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dbConfig = {
    user: 'sa',
    password: '12345678Za',
    server: 'localhost',
    database: 'Makro',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// ทดสอบเชื่อมต่อฐานข้อมูล
app.get('/api/test-db', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM คลังสินค้า');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ดูใบงานโอนย้ายทั้งหมด
app.get('/api/transfer-tasks', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM ใบงานโอนย้าย');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// สร้างใบงานโอนย้าย (รับจากคลัง_id, ไปยังคลัง_id จาก body)
app.post('/api/transfer-tasks', async (req, res) => {
    const { สินค้า_id, จำนวน, จากคลัง_id, ไปยังคลัง_id } = req.body;

    try {
        await sql.connect(dbConfig);

        // ตรวจสอบ stock คลังต้นทาง
        const stock = await sql.query`
            SELECT จำนวน FROM สต็อกคลัง
            WHERE คลัง_id = ${จากคลัง_id} AND สินค้า_id = ${สินค้า_id}
        `;
        if (stock.recordset.length === 0 || stock.recordset[0].จำนวน < จำนวน) {
            return res.status(400).json({ error: 'สต็อกไม่เพียงพอในคลังต้นทาง' });
        }

        // สร้างใบงาน
        const taskResult = await sql.query`
            INSERT INTO ใบงานโอนย้าย (จากคลัง_id, ไปยังคลัง_id, สถานะ)
            OUTPUT INSERTED.id
            VALUES (${จากคลัง_id}, ${ไปยังคลัง_id}, N'pending')
        `;
        const ใบงาน_id = taskResult.recordset[0].id;

        // เพิ่มรายการสินค้าในใบงาน
        await sql.query`
            INSERT INTO รายการในใบงาน (ใบงาน_id, สินค้า_id, จำนวน)
            VALUES (${ใบงาน_id}, ${สินค้า_id}, ${จำนวน})
        `;

        res.json({ message: 'สร้างใบงานสำเร็จ', ใบงาน_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// อัปเดตสถานะใบงานเป็น picked (หยิบของออกจากคลังต้นทาง)
app.post('/api/transfer-tasks/:id/pick', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(dbConfig);

        // ตรวจสอบสถานะใบงาน
        const task = await sql.query`SELECT * FROM ใบงานโอนย้าย WHERE id = ${id}`;
        if (!task.recordset.length || task.recordset[0].สถานะ !== 'pending') {
            return res.status(400).json({ error: 'ใบงานไม่ถูกต้องหรือไม่อยู่ในสถานะ pending' });
        }

        // ดึงข้อมูลคลังต้นทาง
        const { จากคลัง_id } = task.recordset[0];

        // ดึงข้อมูลสินค้าและจำนวน
        const item = await sql.query`SELECT * FROM รายการในใบงาน WHERE ใบงาน_id = ${id}`;
        if (!item.recordset.length) {
            return res.status(400).json({ error: 'ไม่พบรายการสินค้าในใบงาน' });
        }
        const { สินค้า_id, จำนวน } = item.recordset[0];

        // หัก stock คลังต้นทาง
        await sql.query`
            UPDATE สต็อกคลัง
            SET จำนวน = จำนวน - ${จำนวน}
            WHERE คลัง_id = ${จากคลัง_id} AND สินค้า_id = ${สินค้า_id}
        `;

        // อัปเดตสถานะใบงาน
        await sql.query`
            UPDATE ใบงานโอนย้าย SET สถานะ = N'picked', วันที่อัปเดต = GETDATE() WHERE id = ${id}
        `;

        res.json({ message: 'หยิบของออกจากคลังต้นทางสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// อัปเดตสถานะใบงานเป็น completed (นำของเข้าคลังปลายทาง)
app.post('/api/transfer-tasks/:id/complete', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(dbConfig);

        // ตรวจสอบสถานะใบงาน
        const task = await sql.query`SELECT * FROM ใบงานโอนย้าย WHERE id = ${id}`;
        if (!task.recordset.length || task.recordset[0].สถานะ !== 'picked') {
            return res.status(400).json({ error: 'ใบงานไม่ถูกต้องหรือยังไม่ได้หยิบของ' });
        }

        // ดึงข้อมูลคลังปลายทาง
        const { ไปยังคลัง_id } = task.recordset[0];

        // ดึงข้อมูลสินค้าและจำนวน
        const item = await sql.query`SELECT * FROM รายการในใบงาน WHERE ใบงาน_id = ${id}`;
        if (!item.recordset.length) {
            return res.status(400).json({ error: 'ไม่พบรายการสินค้าในใบงาน' });
        }
        const { สินค้า_id, จำนวน } = item.recordset[0];

        // เพิ่ม stock คลังปลายทาง
        await sql.query`
            UPDATE สต็อกคลัง
            SET จำนวน = จำนวน + ${จำนวน}
            WHERE คลัง_id = ${ไปยังคลัง_id} AND สินค้า_id = ${สินค้า_id}
        `;

        // อัปเดตสถานะใบงาน
        await sql.query`
            UPDATE ใบงานโอนย้าย SET สถานะ = N'completed', วันที่อัปเดต = GETDATE() WHERE id = ${id}
        `;

        // ลบข้อมูลใน รายการในใบงาน ที่เกี่ยวข้องกับใบงานนี้
        await sql.query`
            DELETE FROM รายการในใบงาน WHERE ใบงาน_id = ${id}
        `;

        res.json({ message: 'โอนย้ายสำเร็จและอัปเดตสต็อกคลังปลายทางแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});