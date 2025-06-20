import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AddProductPage from './AddProductPage';
import TransferPage from './TransferPage';
import TaskDetail from './TaskDetail';
import WarehouseStockPage from './WarehouseStockPage';

function NavMenu({ className = '' }) {
  const location = useLocation();
  return (
    <nav className={`main-nav ${className}`}>
      <Link
        to="/add-product"
        className={`main-nav-link${location.pathname === '/add-product' ? ' active' : ''}`}
      >
        จัดการสินค้า
      </Link>
      <Link
        to="/transfer"
        className={`main-nav-link${location.pathname === '/transfer' ? ' active' : ''}`}
      >
        เติม/คืนสินค้า
      </Link>
      <Link
        to="/warehouse-stock"
        className={`main-nav-link${location.pathname === '/warehouse-stock' ? ' active' : ''}`}
      >
        ดูคลังสินค้า
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <header className="header">
        <NavMenu className="nav-desktop" />
      </header>
      <Routes>
        <Route path="/add-product" element={<AddProductPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/warehouse-stock" element={<WarehouseStockPage />} />
        <Route path="*" element={<AddProductPage />} />
      </Routes>
      <NavMenu className="nav-mobile" />
      <footer className="footer">
        &copy; {new Date().getFullYear()} Warehouse Demo | Powered by React
      </footer>
    </Router>
  );
}

export default App;