import React, { useState, useEffect } from 'react';
import axios from 'axios';

const warehouseList = [
  { id: 1, name: 'คลังสำรอง' },
  { id: 2, name: 'คลัง Delivery' },
  { id: 3, name: 'คลังหน้าร้าน' }
];

function WarehouseStockPage() {
  const [selected, setSelected] = useState(1);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3000/api/warehouse-stock/${selected}`)
      .then(res => setStock(res.data))
      .catch(() => setStock([]))
      .finally(() => setLoading(false));
  }, [selected]);

  // ฟิลเตอร์สินค้า
  const filteredStock = stock.filter(item =>
    item.ชื่อสินค้า?.toLowerCase().includes(search.toLowerCase()) ||
    (item.SKU && item.SKU.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="main-container">
      <div className="card" style={{ maxWidth: 700, margin: '32px auto', padding: 32 }}>
        <h2 className="page-title">แสดงคลังสินค้าแต่ละคลัง</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {warehouseList.map(w => (
            <button
              key={w.id}
              className={`btn-secondary${selected === w.id ? ' active' : ''}`}
              style={{
                background: selected === w.id ? '#6366f1' : undefined,
                color: selected === w.id ? '#fff' : undefined,
                borderColor: selected === w.id ? '#6366f1' : undefined,
                fontWeight: 600
              }}
              onClick={() => setSelected(w.id)}
            >
              {w.name}
            </button>
          ))}
        </div>
        {/* ช่องค้นหา */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU"
            style={{
              width: 220,
              padding: 10,
              borderRadius: 8,
              border: '1.5px solid #c7d2fe',
              fontSize: 16,
              margin: 0,
              display: 'block'
            }}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>กำลังโหลด...</div>
        ) : (
          <div className="table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>ชื่อสินค้า</th>
                  <th>SKU</th>
                  <th>จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map(item => (
                  <tr key={item.id}>
                    <td data-label="ชื่อสินค้า">{item.ชื่อสินค้า}</td>
                    <td data-label="SKU">{item.SKU}</td>
                    <td data-label="จำนวน" style={{ textAlign: 'center' }}>{item.จำนวน}</td>
                  </tr>
                ))}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>ไม่มีข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default WarehouseStockPage;
