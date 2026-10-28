import ProductDetailPage from './pages/buyer/ProductDetailPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* ...other routes... */}
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;