import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QueryProvider from './providers/QueryProvider';
import { AuthProvider } from './hooks/useAuth';
import RequireAuth from './components/auth/RequireAuth';
import AppLayout from './components/layout/AppLayout';

// Páginas
import HomePage from './pages/Home/HomePage';
import ProfilePage from './pages/Profile/ProfilePage';
import ReportsPage from './pages/Reports/ReportsPage';
import CalendarsPage from './pages/Calendars/CalendarsPage';
import CalendarManagementPage from './pages/Calendars/CalendarManagementPage';
import BillingPage from './pages/Billing/BillingPage';
import CashPage from './pages/Cash/CashPage';
import StockPage from './pages/Stock/StockPage';
import ProductsPage from './pages/Products/ProductsPage';
import ContactsPage from './pages/Contacts/ContactsPage';
import StaffPage from './pages/Staff/StaffPage';
import UsersPage from './pages/Users/UsersPage';
import SpacesPage from './pages/Spaces/SpacesPage';
import LoginPage from './pages/Auth/LoginPage';
import Marketing from "./pages/Marketing/Marketing";
import Negocio from "./pages/Negocio/Negocio";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* protegidas */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              {/* Home como index */}
              <Route index element={<HomePage />} />
              {/* resto de páginas */}
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="informes" element={<ReportsPage />} />
              <Route path="calendarios" element={<CalendarsPage />} />
              <Route path="calendarios/gestion" element={<CalendarManagementPage />} />
              <Route path="facturacion" element={<BillingPage />} />
              <Route path="caja" element={<CashPage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="productos" element={<ProductsPage />} />
              <Route path="personal" element={<StaffPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="espacios" element={<SpacesPage />} />
              <Route path="contacto" element={<ContactsPage />} />
              <Route path="marketing" element={<Marketing />} />
               <Route path="negocio" element={<Negocio />} />
            </Route>

            {/* comodín */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}
