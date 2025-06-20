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

// ดูใบงานโอนย้ายทั้งหมด (เฉพาะที่ยังไม่ completed)
app.get('/api/transfer-tasks', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT * FROM ใบงานโอนย้าย WHERE สถานะ != N'completed'
        `);
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

        // 1. ดึงข้อมูลใบงานและคลังปลายทาง
        const taskRes = await sql.query`
            SELECT r.สินค้า_id, r.จำนวน, t.จากคลัง_id, t.ไปยังคลัง_id
            FROM รายการในใบงาน r
            INNER JOIN ใบงานโอนย้าย t ON r.ใบงาน_id = t.id
            WHERE r.ใบงาน_id = ${id}
        `;
        const tasks = taskRes.recordset;

        // 2. เพิ่มจำนวนเข้าไปในคลังปลายทาง
        for (const t of tasks) {
            const stockRes = await sql.query`
                SELECT id, จำนวน FROM สต็อกคลัง
                WHERE สินค้า_id = ${t.สินค้า_id} AND คลัง_id = ${t.ไปยังคลัง_id}
            `;
            if (stockRes.recordset.length > 0) {
                await sql.query`
                    UPDATE สต็อกคลัง
                    SET จำนวน = จำนวน + ${t.จำนวน}
                    WHERE สินค้า_id = ${t.สินค้า_id} AND คลัง_id = ${t.ไปยังคลัง_id}
                `;
            } else {
                await sql.query`
                    INSERT INTO สต็อกคลัง (สินค้า_id, คลัง_id, จำนวน)
                    VALUES (${t.สินค้า_id}, ${t.ไปยังคลัง_id}, ${t.จำนวน})
                `;
            }
        }

        // 3. ลบรายการในใบงาน
        await sql.query`
            DELETE FROM รายการในใบงาน WHERE ใบงาน_id = ${id}
        `;

        // เช็คว่าตารางว่างหรือไม่
        const countRes = await sql.query`SELECT COUNT(*) AS total FROM รายการในใบงาน`;
        if (countRes.recordset[0].total === 0) {
            await sql.query`DBCC CHECKIDENT (N'รายการในใบงาน', RESEED, 0)`;
        }

        // 4. อัปเดตสถานะใบงานเป็น completed
        await sql.query`
            UPDATE ใบงานโอนย้าย
            SET สถานะ = N'completed'
            WHERE id = ${id}
        `;

        res.json({ message: 'โอนย้ายสำเร็จและอัปเดตสต็อกคลังปลายทางแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ดึงรายการสินค้า พร้อมจำนวนในคลังสำรอง และคลังทั้งหมด
app.get('/api/products', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT 
                p.id,
                p.ชื่อสินค้า,
                p.SKU,
                ISNULL(SUM(CASE WHEN s.คลัง_id = 1 THEN s.จำนวน ELSE 0 END), 0) AS จำนวนในคลังสำรอง,
                ISNULL(SUM(s.จำนวน), 0) AS จำนวนรวมทั้งหมด
            FROM สินค้า p
            LEFT JOIN สต็อกคลัง s ON s.สินค้า_id = p.id
            GROUP BY p.id, p.ชื่อสินค้า, p.SKU
            ORDER BY p.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เพิ่ม/ลด stock สินค้าในคลังสำรอง (คลัง_id = 1)
app.post('/api/add-stock', async (req, res) => {
    const { สินค้า_id, จำนวน } = req.body;
    try {
        await sql.connect(dbConfig);

        // ตรวจสอบว่ามีแถวนี้ในคลังสำรองหรือยัง
        const stockRes = await sql.query`
            SELECT id, จำนวน FROM สต็อกคลัง
            WHERE สินค้า_id = ${สินค้า_id} AND คลัง_id = 1
        `;
        if (stockRes.recordset.length > 0) {
            await sql.query`
                UPDATE สต็อกคลัง
                SET จำนวน = จำนวน + ${จำนวน}
                WHERE สินค้า_id = ${สินค้า_id} AND คลัง_id = 1
            `;
        } else {
            await sql.query`
                INSERT INTO สต็อกคลัง (สินค้า_id, คลัง_id, จำนวน)
                VALUES (${สินค้า_id}, 1, ${จำนวน})
            `;
        }
        res.json({ message: 'อัปเดต stock สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เพิ่มสินค้าใหม่
app.post('/api/add-product', async (req, res) => {
    const { ชื่อสินค้า, จำนวน } = req.body;
    try {
        await sql.connect(dbConfig);

        // ตรวจสอบชื่อสินค้าซ้ำ
        const dupRes = await sql.query`
            SELECT id FROM สินค้า WHERE ชื่อสินค้า = ${ชื่อสินค้า}
        `;
        if (dupRes.recordset.length > 0) {
            return res.status(400).json({ error: 'มีชื่อสินค้าสินค้านี้อยู่แล้ว' });
        }

        // หา SKU ล่าสุดในฐานข้อมูล
        const skuRes = await sql.query`
            SELECT TOP 1 SKU FROM สินค้า
            WHERE ISNUMERIC(SKU) = 1 OR SKU LIKE '00%'
            ORDER BY TRY_CAST(SKU AS INT) DESC
        `;
        let nextSKU = '001';
        if (skuRes.recordset.length > 0) {
            const lastSKU = skuRes.recordset[0].SKU.replace(/^0+/, '');
            nextSKU = (parseInt(lastSKU, 10) + 1).toString().padStart(3, '0');
        }

        // เพิ่มสินค้าใหม่
        const result = await sql.query`
            INSERT INTO สินค้า (ชื่อสินค้า, SKU)
            OUTPUT INSERTED.id
            VALUES (${ชื่อสินค้า}, ${nextSKU})
        `;
        const สินค้า_id = result.recordset[0].id;

        // เพิ่ม stock เริ่มต้นในคลังสำรอง (คลัง_id = 1)
        await sql.query`
            INSERT INTO สต็อกคลัง (สินค้า_id, คลัง_id, จำนวน)
            VALUES (${สินค้า_id}, 1, ${จำนวน})
        `;

        res.json({ message: 'เพิ่มสินค้าใหม่สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ลบสินค้า (และ stock ที่เกี่ยวข้อง)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(dbConfig);

        // ลบ stock ที่เกี่ยวข้องกับสินค้า
        await sql.query`
            DELETE FROM สต็อกคลัง WHERE สินค้า_id = ${id}
        `;

        // ลบสินค้า
        await sql.query`
            DELETE FROM สินค้า WHERE id = ${id}
        `;

        res.json({ message: 'ลบสินค้าสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transfer-tasks/:id/items', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT r.id, r.จำนวน, s.ชื่อสินค้า
            FROM รายการในใบงาน r
            INNER JOIN สินค้า s ON r.สินค้า_id = s.id
            WHERE r.ใบงาน_id = ${id}
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ดึง stock ของคลังตามคลัง_id
app.get('/api/warehouse-stock/:warehouseId', async (req, res) => {
    const { warehouseId } = req.params;
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT 
                p.id,
                p.ชื่อสินค้า,
                p.SKU,
                s.จำนวน
            FROM สินค้า p
            INNER JOIN สต็อกคลัง s ON s.สินค้า_id = p.id
            WHERE s.คลัง_id = ${warehouseId}
            ORDER BY p.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/forecast/:productId/:warehouseId', async (req, res) => {
    const { productId, warehouseId } = req.params;
    try {
        await sql.connect(dbConfig);
        // ดึงจำนวนปัจจุบันในคลังปลายทาง
        const stockRes = await sql.query`
            SELECT ISNULL(จำนวน, 0) AS จำนวน
            FROM สต็อกคลัง
            WHERE สินค้า_id = ${productId} AND คลัง_id = ${warehouseId}
        `;
        const current = stockRes.recordset[0]?.จำนวน || 0;
        // สมมุติพยากรณ์ (เช่น สุ่ม 20-50)
        const forecast = Math.floor(Math.random() * 31) + 20;
        res.json({ forecast, current });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});