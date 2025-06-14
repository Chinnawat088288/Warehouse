import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const warehouseNames = {
  1: 'คลังสำรอง',
  2: 'คลัง Delivery',
  3: 'คลังหน้าร้าน'
};

const statusMap = {
  pending: { label: 'รอดำเนินการ', color: '#f59e42' },
  picked: { label: 'หยิบของแล้ว', color: '#3b82f6' },
  completed: { label: 'เสร็จสมบูรณ์', color: '#22c55e' }
};

function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [items, setItems] = useState([]);
  const [result, setResult] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:3000/api/transfer-tasks')
      .then(res => {
        const found = res.data.find(t => t.id === Number(id));
        setTask(found);
      });

    axios.get(`http://localhost:3000/api/transfer-tasks/${id}/items`)
      .then(res => setItems(res.data));
  }, [id]);

  const handlePick = async () => {
    try {
      const res = await axios.post(`http://localhost:3000/api/transfer-tasks/${id}/pick`);
      setResult(res.data.message);
      setResultSuccess(true);
      setTask({ ...task, สถานะ: 'picked' });
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await axios.post(`http://localhost:3000/api/transfer-tasks/${id}/complete`);
      setResult(res.data.message);
      setResultSuccess(true);
      setTask({ ...task, สถานะ: 'completed' });
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  if (!task) return <div style={{ padding: 32 }}>กำลังโหลด...</div>;

  return (
    <div className="main-container" style={{
      maxWidth: 480,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(49,46,129,0.10)',
      padding: 32
    }}>
      <h2 style={{ color: '#312e81', marginBottom: 18 }}>รายละเอียดใบงาน #{task.id}</h2>
      {/* ตารางชื่อสินค้าและจำนวน */}
      <table style={{ width: '100%', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>ชื่อสินค้า</th>
            <th style={{ textAlign: 'center' }}>จำนวนที่ต้องเติม</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ color: 'red', fontWeight: 600 }}>{item.ชื่อสินค้า}</td>
              <td style={{ color: 'red', textAlign: 'center', fontWeight: 600 }}>{item.จำนวน}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ข้อมูลจาก, ไปยัง, สถานะ */}
      <p>จาก: <b>{warehouseNames[task.จากคลัง_id]}</b></p>
      <p>ไปยัง: <b>{warehouseNames[task.ไปยังคลัง_id]}</b></p>
      <p>สถานะ: <span style={{
        color: statusMap[task.สถานะ]?.color || '#000',
        fontWeight: 600
      }}>{statusMap[task.สถานะ]?.label || task.สถานะ}</span></p>
      <div style={{ margin: '24px 0' }}>
        {task.สถานะ === 'pending' && (
          <button onClick={handlePick} className="btn-primary" style={{ marginRight: 12 }}>
            ยืนยันหยิบของ (Pick)
          </button>
        )}
        {task.สถานะ === 'picked' && (
          <button onClick={handleComplete} className="btn-primary" style={{ marginRight: 12 }}>
            ยืนยันวางของ (Complete)
          </button>
        )}
        <Link to="/transfer" className="btn-secondary">กลับ</Link>
      </div>
      {result && (
        <div style={{ marginTop: 16, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>
          {result}
        </div>
      )}
    </div>
  );
}

export default TaskDetail;