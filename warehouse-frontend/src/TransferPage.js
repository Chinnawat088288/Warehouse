import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { key: 'delivery', label: 'เติมคลัง Delivery' },
  { key: 'storefront', label: 'เติมคลังหน้าร้าน' },
  { key: 'return', label: 'คืนคลังสำรอง' }
];

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

function TransferPage() {
  const [nav, setNav] = useState('delivery');
  const [สินค้า_id, setสินค้า_id] = useState('');
  const [จำนวน, setจำนวน] = useState('');
  const [คืนจากคลัง, setคืนจากคลัง] = useState('2');
  const [result, setResult] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/transfer-tasks');
      setTasks(res.data.filter(t => t.สถานะ !== 'completed'));
    } catch (err) {
      setTasks([]);
    }
  };

  useEffect(() => {
    axios.get('http://localhost:3000/api/products').then(res => setProducts(res.data));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredProducts = productSearch
    ? products.filter(p =>
        p.id.toString().includes(productSearch) ||
        (p.ชื่อสินค้า && p.ชื่อสินค้า.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : products;

  const handleSelectProduct = (p) => {
    setสินค้า_id(p.id);
    setProductSearch(p.ชื่อสินค้า + ' (' + p.id + ')');
    setShowDropdown(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      await axios.post(url, { ...body, จากคลัง_id: from, ไปยังคลัง_id: to });
      setResult('สร้างใบงานสำเร็จ');
      setResultSuccess(true);
      fetchTasks();
      setสินค้า_id('');
      setจำนวน('');
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  return (
    <div className="main-container" style={{
      maxWidth: 540,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 18,
      boxShadow: '0 6px 32px rgba(49,46,129,0.13)',
      padding: 36
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => { setNav(item.key); setResult(''); setResultSuccess(false); }}
            className={`main-nav-link${nav === item.key ? ' active' : ''}`}
            style={{
              borderRadius: 8,
              border: nav === item.key ? '2px solid #6366f1' : '1px solid #c7d2fe',
              background: nav === item.key ? '#6366f1' : '#f1f5f9',
              color: nav === item.key ? '#fff' : '#312e81',
              fontWeight: 600,
              fontSize: '1.08rem',
              padding: '10px 28px',
              boxShadow: nav === item.key ? '0 2px 8px #6366f133' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 32 }}>
        {nav === 'delivery' && (
          <>
            <h2 style={{ color: '#312e81', marginBottom: 18 }}>เติมคลัง Delivery</h2>
            <form onSubmit={handleSubmit} style={{
              maxWidth: 400,
              margin: '0 auto',
              background: '#f8fafc',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 8px #6366f122',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              <div className="form-row" ref={searchRef} style={{ position: 'relative', marginBottom: 16, minHeight: 80 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>ค้นหาสินค้า (ID หรือ ชื่อ)</label>
                <input
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                    setสินค้า_id('');
                  }}
                  onFocus={() => setShowDropdown(true)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16, marginBottom: 8 }}
                  placeholder="ค้นหาด้วยรหัสหรือชื่อสินค้า"
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 64,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #c7d2fe',
                    borderRadius: 8,
                    zIndex: 100,
                    maxHeight: 220,
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px #6366f122'
                  }}>
                    {filteredProducts.slice(0, 10).map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#312e81',
                          fontWeight: 500
                        }}
                      >
                        {p.ชื่อสินค้า} <span style={{ color: '#888', fontSize: 13 }}>({p.id})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>จำนวน</label>
                <input
                  type="number"
                  min="1"
                  value={จำนวน}
                  onChange={e => setจำนวน(e.target.value)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}
                  placeholder="กรอกจำนวน"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 17, borderRadius: 8 }}>
                สร้างใบงาน
              </button>
            </form>
          </>
        )}
        {nav === 'storefront' && (
          <>
            <h2 style={{ color: '#312e81', marginBottom: 18 }}>เติมคลังหน้าร้าน</h2>
            <form onSubmit={handleSubmit} style={{
              maxWidth: 400,
              margin: '0 auto',
              background: '#f8fafc',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 8px #6366f122',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              <div className="form-row" ref={searchRef} style={{ position: 'relative', marginBottom: 16, minHeight: 80 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>ค้นหาสินค้า (ID หรือ ชื่อ)</label>
                <input
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                    setสินค้า_id('');
                  }}
                  onFocus={() => setShowDropdown(true)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16, marginBottom: 8 }}
                  placeholder="ค้นหาด้วยรหัสหรือชื่อสินค้า"
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 64,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #c7d2fe',
                    borderRadius: 8,
                    zIndex: 100,
                    maxHeight: 220,
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px #6366f122'
                  }}>
                    {filteredProducts.slice(0, 10).map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#312e81',
                          fontWeight: 500
                        }}
                      >
                        {p.ชื่อสินค้า} <span style={{ color: '#888', fontSize: 13 }}>({p.id})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>จำนวน</label>
                <input
                  type="number"
                  min="1"
                  value={จำนวน}
                  onChange={e => setจำนวน(e.target.value)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}
                  placeholder="กรอกจำนวน"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 17, borderRadius: 8 }}>
                สร้างใบงาน
              </button>
            </form>
          </>
        )}
        {nav === 'return' && (
          <>
            <h2 style={{ color: '#312e81', marginBottom: 18 }}>คืนคลังสำรอง</h2>
            <form onSubmit={handleSubmit} style={{
              maxWidth: 400,
              margin: '0 auto',
              background: '#f8fafc',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 8px #6366f122',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              <div className="form-row">
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>คืนจากคลัง</label>
                <select
                  value={คืนจากคลัง}
                  onChange={e => setคืนจากคลัง(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16, background: '#fff' }}
                >
                  <option value="2">คลัง Delivery</option>
                  <option value="3">คลังหน้าร้าน</option>
                </select>
              </div>
              <div className="form-row" ref={searchRef} style={{ position: 'relative', marginBottom: 16, minHeight: 80 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>ค้นหาสินค้า (ID หรือ ชื่อ)</label>
                <input
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                    setสินค้า_id('');
                  }}
                  onFocus={() => setShowDropdown(true)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16, marginBottom: 8 }}
                  placeholder="ค้นหาด้วยรหัสหรือชื่อสินค้า"
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 64,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #c7d2fe',
                    borderRadius: 8,
                    zIndex: 100,
                    maxHeight: 220,
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px #6366f122'
                  }}>
                    {filteredProducts.slice(0, 10).map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#312e81',
                          fontWeight: 500
                        }}
                      >
                        {p.ชื่อสินค้า} <span style={{ color: '#888', fontSize: 13 }}>({p.id})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <label style={{ fontWeight: 600, marginBottom: 6, color: '#312e81', display: 'block' }}>จำนวน</label>
                <input
                  type="number"
                  min="1"
                  value={จำนวน}
                  onChange={e => setจำนวน(e.target.value)}
                  required
                  className="input"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}
                  placeholder="กรอกจำนวน"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 17, borderRadius: 8 }}>
                สร้างใบงาน
              </button>
            </form>
          </>
        )}
        <div style={{ marginTop: 16, color: resultSuccess ? 'green' : 'red', fontWeight: 600, minHeight: 24 }}>{result}</div>
      </div>

      {/* แสดงใบงานค้าง */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ color: '#312e81', marginBottom: 16 }}>สถานะใบงานที่ค้าง</h3>
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {tasks.length === 0 && <li style={{ color: '#888', textAlign: 'center', padding: 24 }}>ไม่มีใบงานค้าง</li>}
          {tasks.map(t => (
            <li
              key={t.id}
              style={{
                marginBottom: 16,
                padding: 18,
                borderRadius: 12,
                background: '#f8fafc',
                boxShadow: '0 1px 6px #6366f122',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                border: '2px solid #e0e7ff',
                transition: 'background 0.2s, box-shadow 0.2s'
              }}
              onClick={() => navigate(`/task/${t.id}`)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') navigate(`/task/${t.id}`); }}
            >
              <span style={{ fontWeight: 700, color: '#312e81', marginRight: 16, fontSize: '1.1rem' }}>#{t.id}</span>
              <span style={{ marginRight: 16, fontSize: '1.05rem' }}>
                จาก <b>{warehouseNames[t.จากคลัง_id]}</b> → <b>{warehouseNames[t.ไปยังคลัง_id]}</b>
              </span>
              <span style={{
                color: statusMap[t.สถานะ]?.color || '#000',
                fontWeight: 700,
                fontSize: '1.05rem'
              }}>
                {statusMap[t.สถานะ]?.label || t.สถานะ}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TransferPage;