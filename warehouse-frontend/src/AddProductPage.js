import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function AddProductPage() {
  const [products, setProducts] = useState([]);
  const [ชื่อสินค้า, setชื่อสินค้า] = useState('');
  const [จำนวน, setจำนวน] = useState('');
  const [result, setResult] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);
  const [addStockId, setAddStockId] = useState(null);
  const [addStockValue, setAddStockValue] = useState('');
  const [reduceMode, setReduceMode] = useState(false);
  const [search, setSearch] = useState('');

  // โหลดสินค้าทั้งหมด
  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://172.20.10.5:3000/api/products');
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // เพิ่มชนิดสินค้าใหม่
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setResult('');
    setResultSuccess(false);
    try {
      await axios.post('http://172.20.10.5:3000/api/add-product', { ชื่อสินค้า, จำนวน: Number(จำนวน) });
      setResult('เพิ่มสินค้าเรียบร้อย');
      setResultSuccess(true);
      setชื่อสินค้า('');
      setจำนวน('');
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // เพิ่มจำนวนสินค้าในคลังทั้งหมด
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://172.20.10.5:3000/api/add-stock', { สินค้า_id: addStockId, จำนวน: Number(addStockValue) });
      setResult('เพิ่มจำนวนสินค้าในคลังทั้งหมดเรียบร้อย');
      setResultSuccess(true);
      setAddStockId(null);
      setAddStockValue('');
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // ลบสินค้า
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) return;
    try {
      await axios.delete(`http://172.20.10.5:3000/api/products/${id}`);
      setResult('ลบสินค้าเรียบร้อย');
      setResultSuccess(true);
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // ลดจำนวนสินค้าในคลังทั้งหมด
  const handleReduceStock = async (e) => {
    e.preventDefault();
    const qty = Number(addStockValue);
    if (!qty || qty < 1) return;
    try {
      await axios.post('http://172.20.10.5:3000/api/add-stock', { สินค้า_id: addStockId, จำนวน: -qty });
      setResult('ลดจำนวนสินค้าในคลังทั้งหมดเรียบร้อย');
      setResultSuccess(true);
      setAddStockId(null);
      setAddStockValue('');
      setReduceMode(false);
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // ฟิลเตอร์สินค้า
  const filteredProducts = products.filter(p =>
    p.ชื่อสินค้า.toLowerCase().includes(search.toLowerCase()) ||
    (p.SKU && p.SKU.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="main-container">
      <div className="card" style={{ maxWidth: 480, margin: '32px auto 0', padding: 32 }}>
        <h2 className="page-title">เพิ่มชนิดสินค้า</h2>
        <form className="add-product-form" onSubmit={handleAddProduct}>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#312e81' }}>ชื่อสินค้า</label>
            <input
              value={ชื่อสินค้า}
              onChange={e => setชื่อสินค้า(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}
              placeholder="กรอกชื่อสินค้า เช่น น้ำดื่ม"
            />
          </div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#312e81' }}>จำนวนเริ่มต้น</label>
            <input
              type="number"
              min="1"
              value={จำนวน}
              onChange={e => setจำนวน(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}
              placeholder="กรอกจำนวนเริ่มต้น"
            />
          </div>
          <button
            type="submit"
            className="btn-primary add-product-btn"
          >
            {/* <span style={{marginRight:8, fontWeight:700, fontSize:18}}>+</span> */}
            เพิ่มสินค้าใหม่
          </button>
        </form>
        <div className={`result-message ${resultSuccess ? 'success' : 'error'}`}>{result}</div>
      </div>

      <div className="divider" />

      <div className="card" style={{ margin: '32px auto', padding: 32 }}>
        <h3 className="section-title">รายการสินค้าทั้งหมด</h3>
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
        <div className="table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ชื่อสินค้า</th>
                <th style={{ textAlign: 'center' }}>SKU</th>
                <th style={{ textAlign: 'center' }}>จำนวนในคลังสำรอง</th>
                <th style={{ textAlign: 'center' }}>คลังทั้งหมด</th>
                <th style={{ textAlign: 'center' }}>เพิ่ม/ลด</th>
                <th style={{ textAlign: 'center' }}>ลบสินค้า</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td data-label="ชื่อสินค้า">
                    <span
                      className="product-link"
                      style={{ fontWeight: 500, color: '#6366f1', cursor: 'pointer' }}
                      onClick={() => { setAddStockId(p.id); setAddStockValue(''); }}
                    >
                      {p.ชื่อสินค้า}
                    </span>
                  </td>
                  <td data-label="SKU" style={{ textAlign: 'center' }}>{p.SKU}</td>
                  <td data-label="จำนวนในคลังสำรอง" style={{ textAlign: 'center' }}>
                    {p.จำนวนในคลังสำรอง}
                  </td>
                  <td data-label="คลังทั้งหมด" style={{ textAlign: 'center' }}>
                    {p.จำนวนรวมทั้งหมด}
                  </td>
                  <td data-label="เพิ่ม/ลด" style={{ textAlign: 'center' }}>
                    {addStockId === p.id ? (
                      <form
                        onSubmit={reduceMode ? handleReduceStock : handleAddStock}
                        style={{ display: 'flex', gap: 4, justifyContent: 'center' }}
                      >
                        <input
                          type="number"
                          min="1"
                          value={addStockValue}
                          onChange={e => setAddStockValue(e.target.value)}
                          required
                          style={{ width: 60, borderRadius: 6, border: '1px solid #c7d2fe', padding: 6 }}
                          placeholder="จำนวน"
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '4px 12px', borderRadius: 6 }}>
                          {reduceMode ? 'ลด' : 'เพิ่ม'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ borderRadius: 6 }}
                          onClick={() => { setAddStockId(null); setAddStockValue(''); setReduceMode(false); }}
                        >
                          ยกเลิก
                        </button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          className="btn-secondary"
                          style={{ color: '#dc2626', borderColor: '#fca5a5', fontWeight: 700, borderRadius: 6 }}
                          onClick={() => { setAddStockId(p.id); setAddStockValue(''); setReduceMode(true); }}
                          title="ลดจำนวน"
                        >-</button>
                        <button
                          className="btn-secondary"
                          onClick={() => { setAddStockId(p.id); setAddStockValue(''); setReduceMode(false); }}
                          style={{ fontWeight: 700, borderRadius: 6 }}
                          title="เพิ่มจำนวน"
                        >+</button>
                      </div>
                    )}
                  </td>
                  <td data-label="ลบสินค้า" style={{ textAlign: 'center' }}>
                    <button
                      className="btn-secondary"
                      style={{ color: 'red', borderColor: '#fca5a5', borderRadius: 6 }}
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AddProductPage;