import React, { useState } from 'react';
import axios from 'axios';

function CreateTransferTask() {
  const [สินค้า_id, setสินค้า_id] = useState('');
  const [จำนวน, setจำนวน] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/transfer-tasks', {
        สินค้า_id: Number(สินค้า_id),
        จำนวน: Number(จำนวน)
      });
      setResult(JSON.stringify(res.data));
    } catch (err) {
      setResult(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div>
      <h2>สร้างใบงานโอนย้าย</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>สินค้า_id: </label>
          <input value={สินค้า_id} onChange={e => setสินค้า_id(e.target.value)} required />
        </div>
        <div>
          <label>จำนวน: </label>
          <input value={จำนวน} onChange={e => setจำนวน(e.target.value)} required />
        </div>
        <button type="submit">สร้างใบงาน</button>
      </form>
      <div>ผลลัพธ์: {result}</div>
    </div>
  );
}

export default CreateTransferTask;