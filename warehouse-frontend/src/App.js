import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddProductPage from './AddProductPage';
import TransferPage from './TransferPage';
import TaskDetail from './TaskDetail'; // เพิ่มบรรทัดนี้

function App() {
  return (
    <Router>
      <header className="header">
        <h1 className="header-title">Warehouse Management</h1>
        <nav className="main-nav">
          <Link to="/add-product" className="main-nav-link">จัดการสินค้า</Link>
          <Link to="/transfer" className="main-nav-link">เติม/คืนสินค้า</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/add-product" element={<AddProductPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/task/:id" element={<TaskDetail />} /> {/* เพิ่ม Route นี้ */}
        <Route path="*" element={<AddProductPage />} />
      </Routes>
      <footer className="footer">
        &copy; {new Date().getFullYear()} Warehouse Demo | Powered by React
      </footer>
    </Router>
  );
}

export default App;