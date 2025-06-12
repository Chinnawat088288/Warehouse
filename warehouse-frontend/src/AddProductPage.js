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

  // โหลดสินค้าทั้งหมด
  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/products');
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
      await axios.post('http://localhost:3000/api/add-product', { ชื่อสินค้า, จำนวน: Number(จำนวน) });
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
      await axios.post('http://localhost:3000/api/add-stock', { สินค้า_id: addStockId, จำนวน: Number(addStockValue) });
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
      await axios.delete(`http://localhost:3000/api/products/${id}`);
      setResult('ลบสินค้าเรียบร้อย');
      setResultSuccess(true);
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  // ลดจำนวนสินค้าในคลังทั้งหมด
  const handleReduceStock = async (id) => {
    const value = window.prompt('กรอกจำนวนที่ต้องการลด (ตัวเลขบวกเท่านั้น):');
    const qty = Number(value);
    if (!qty || qty < 1) return;
    try {
      await axios.post('http://localhost:3000/api/add-stock', { สินค้า_id: id, จำนวน: -qty });
      setResult('ลดจำนวนสินค้าในคลังทั้งหมดเรียบร้อย');
      setResultSuccess(true);
      fetchProducts();
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
      setResultSuccess(false);
    }
  };

  return (
    <div className="main-container">
      <h2 className="page-title">เพิ่มชนิดสินค้า</h2>
      <form className="add-product-form" onSubmit={handleAddProduct}>
        <div className="form-row">
          <label>ชื่อสินค้า</label>
          <input value={ชื่อสินค้า} onChange={e => setชื่อสินค้า(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>จำนวนเริ่มต้น</label>
          <input type="number" min="1" value={จำนวน} onChange={e => setจำนวน(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">เพิ่มสินค้าใหม่</button>
      </form>
      <div style={{ marginTop: 12, color: resultSuccess ? 'green' : 'red', fontWeight: 600 }}>{result}</div>

      <h3 style={{ marginTop: 32 }}>รายการสินค้าทั้งหมด</h3>
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>ชื่อสินค้า</th>
              <th style={{ textAlign: 'center' }}>SKU</th>
              <th style={{ textAlign: 'center' }}>คลังทั้งหมด</th>
              <th style={{ textAlign: 'center' }}>จำนวน</th>
              <th style={{ textAlign: 'center' }}>ลบสินค้า</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <span
                    className="product-link"
                    onClick={() => { setAddStockId(p.id); setAddStockValue(''); }}
                  >
                    {p.ชื่อสินค้า}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>{p.SKU}</td>
                <td style={{ textAlign: 'center' }}>{p.จำนวนในคลังสำรอง}</td>
                <td style={{ textAlign: 'center' }}>
                  {addStockId === p.id ? (
                    <form onSubmit={handleAddStock} style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="number"
                        min="1"
                        value={addStockValue}
                        onChange={e => setAddStockValue(e.target.value)}
                        required
                        style={{ width: 60 }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '4px 12px' }}>เพิ่ม</button>
                      <button type="button" className="btn-secondary" onClick={() => setAddStockId(null)}>ยกเลิก</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button
                        className="btn-secondary"
                        style={{ color: '#dc2626', borderColor: '#fca5a5', fontWeight: 700 }}
                        onClick={() => handleReduceStock(p.id)}
                        title="ลดจำนวน"
                      >-</button>
                      <button
                        className="btn-secondary"
                        onClick={() => { setAddStockId(p.id); setAddStockValue(''); }}
                        style={{ fontWeight: 700 }}
                        title="เพิ่มจำนวน"
                      >+</button>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn-secondary"
                    style={{ color: 'red', borderColor: '#fca5a5' }}
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
  );
}

export default AddProductPage;