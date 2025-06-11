import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NAV = [
  { key: 'delivery', label: 'เติมคลัง delivery' },
  { key: 'storefront', label: 'เติมคลังหน้าร้าน' },
  { key: 'return', label: 'คืนคลังสำรอง' }
];

// กำหนด mapping id → ชื่อคลัง
const warehouseNames = {
  1: 'คลังสำรอง',
  2: 'คลัง delivery',
  3: 'คลังหน้าร้าน'
};

// กำหนด mapping สถานะ
const statusMap = {
  pending: { label: 'รอดำเนินการ', color: '#f59e42' },
  picked: { label: 'หยิบของแล้ว', color: '#3b82f6' },
  completed: { label: 'เสร็จสมบูรณ์', color: '#22c55e' }
};

function App() {
  const [nav, setNav] = useState('delivery');
  const [สินค้า_id, setสินค้า_id] = useState('');
  const [จำนวน, setจำนวน] = useState('');
  const [คืนจากคลัง, setคืนจากคลัง] = useState('2');
  const [result, setResult] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);
  const [tasks, setTasks] = useState([]);

  // โหลดใบงานค้าง
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/transfer-tasks');
      setTasks(res.data.filter(t => t.สถานะ !== 'completed'));
    } catch (err) {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // สร้างใบงาน
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult('');
    setResultSuccess(false);
    let body = { สินค้า_id: Number(สินค้า_id), จำนวน: Number(จำนวน) };
    let url = 'http://localhost:3000/api/transfer-tasks';
    let from = 1, to = 2;

    if (nav === 'delivery') {
      from = 1; to = 2;
    } else if (nav === 'storefront') {
      from = 1; to = 3;
    } else if (nav === 'return') {
      from = Number(คืนจากคลัง); to = 1;
    }

    try {
      const res = await axios.post(url, { ...body, จากคลัง_id: from, ไปยังคลัง_id: to });
      setResult('สำเร็จ');
      setResultSuccess(true);
      fetchTasks();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // ฟังก์ชันสำหรับ pick
  const handlePick = async (id) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/transfer-tasks/${id}/pick`);
      setResult(`ใบงาน #${id}: ${res.data.message}`);
      setResultSuccess(true);
      fetchTasks();
    } catch (err) {
      setResult(`ใบงาน #${id}: ${err.response?.data?.error || 'เกิดข้อผิดพลาด'}`);
      setResultSuccess(false);
    }
  };

  // ฟังก์ชันสำหรับ complete
  const handleComplete = async (id) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/transfer-tasks/${id}/complete`);
      setResult(`ใบงาน #${id}: ${res.data.message}`);
      setResultSuccess(true);
      fetchTasks();
    } catch (err) {
      setResult(`ใบงาน #${id}: ${err.response?.data?.error || 'เกิดข้อผิดพลาด'}`);
      setResultSuccess(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <header style={{
        background: '#312e81',
        color: '#fff',
        padding: '24px 0',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(49,46,129,0.08)'
      }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: '2.5rem', letterSpacing: '2px' }}>
          Warehouse Management
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.85 }}>
          ระบบจัดการโอนย้ายสินค้าในคลัง (Demo)
        </p>
      </header>
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        margin: '32px 0 0 0'
      }}>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => { setNav(item.key); setResult(''); setResultSuccess(false); }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: nav === item.key ? '2px solid #312e81' : '1px solid #c7d2fe',
              background: nav === item.key ? '#6366f1' : '#fff',
              color: nav === item.key ? '#fff' : '#312e81',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main style={{
        maxWidth: 480,
        margin: '32px auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(49,46,129,0.10)',
        padding: 32
      }}>
        {/* ฟอร์มแต่ละหน้า */}
        {nav === 'delivery' && (
          <>
            <h2>เติมคลัง delivery</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label>สินค้า_id: </label>
                <input value={สินค้า_id} onChange={e => setสินค้า_id(e.target.value)} required />
              </div>
              <div>
                <label>จำนวน: </label>
                <input value={จำนวน} onChange={e => setจำนวน(e.target.value)} required />
              </div>
              <button type="submit" style={{ marginTop: 16 }}>สร้างใบงาน</button>
            </form>
            <div style={{ marginTop: 12, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>{result}</div>
          </>
        )}
        {nav === 'storefront' && (
          <>
            <h2>เติมคลังหน้าร้าน</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label>สินค้า_id: </label>
                <input value={สินค้า_id} onChange={e => setสินค้า_id(e.target.value)} required />
              </div>
              <div>
                <label>จำนวน: </label>
                <input value={จำนวน} onChange={e => setจำนวน(e.target.value)} required />
              </div>
              <button type="submit" style={{ marginTop: 16 }}>สร้างใบงาน</button>
            </form>
            <div style={{ marginTop: 12, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>{result}</div>
          </>
        )}
        {nav === 'return' && (
          <>
            <h2>คืนคลังสำรอง</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label>คืนจากคลัง: </label>
                <select value={คืนจากคลัง} onChange={e => setคืนจากคลัง(e.target.value)}>
                  <option value="2">คลัง delivery</option>
                  <option value="3">คลังหน้าร้าน</option>
                </select>
              </div>
              <div>
                <label>สินค้า_id: </label>
                <input value={สินค้า_id} onChange={e => setสินค้า_id(e.target.value)} required />
              </div>
              <div>
                <label>จำนวน: </label>
                <input value={จำนวน} onChange={e => setจำนวน(e.target.value)} required />
              </div>
              <button type="submit" style={{ marginTop: 16 }}>สร้างใบงาน</button>
            </form>
            <div style={{ marginTop: 12, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>{result}</div>
          </>
        )}

        {/* แสดงใบงานค้าง */}
        <div style={{ marginTop: 32 }}>
          <h3>สถานะใบงานที่ค้าง</h3>
          <ul>
            {tasks.length === 0 && <li>ไม่มีใบงานค้าง</li>}
            {tasks.map(t => (
              <li key={t.id} style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 600, color: '#312e81' }}>#{t.id}</span>
                {' | '}
                <span>จาก <b>{warehouseNames[t.จากคลัง_id]}</b> → <b>{warehouseNames[t.ไปยังคลัง_id]}</b></span>
                {' | '}
                <span style={{
                  color: statusMap[t.สถานะ]?.color || '#000',
                  fontWeight: 600
                }}>
                  {statusMap[t.สถานะ]?.label || t.สถานะ}
                </span>
                {/* ปุ่ม action ตามสถานะ */}
                {t.สถานะ === 'pending' && (
                  <button
                    style={{ marginLeft: 16, background: '#f59e42', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 16px', cursor: 'pointer' }}
                    onClick={() => handlePick(t.id)}
                  >
                    ทำการ Pick
                  </button>
                )}
                {t.สถานะ === 'picked' && (
                  <button
                    style={{ marginLeft: 16, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 16px', cursor: 'pointer' }}
                    onClick={() => handleComplete(t.id)}
                  >
                    ทำการ Complete
                  </button>
                )}
              </li>
            ))}
          </ul>
          {/* แสดงผลลัพธ์ action */}
          {result && (
            <div style={{ marginTop: 16, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>
              {result}
            </div>
          )}
        </div>
      </main>
      <footer style={{
        textAlign: 'center',
        color: '#6b7280',
        padding: '16px 0',
        fontSize: '0.95rem'
      }}>
        &copy; {new Date().getFullYear()} Warehouse Demo | Powered by React
      </footer>
    </div>
  );
}

export default App;