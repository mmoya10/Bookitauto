// src/App.js
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import QueryProvider from "./providers/QueryProvider";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import RequireAuth from "./components/auth/RequireAuth";
import AppLayout from "./components/layout/AppLayout";

// Páginas
import HomePage from "./pages/Home/HomePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import ReportsPage from "./pages/Reports/ReportsPage";
import CalendarsPage from "./pages/Calendars/CalendarsPage";
import CalendarManagementPage from "./pages/Calendars/CalendarManagementPage";
import BillingPage from "./pages/Billing/BillingPage";
import CashPage from "./pages/Cash/CashPage";
import StockPage from "./pages/Stock/StockPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ContactsPage from "./pages/Contacts/ContactsPage";
import StaffPage from "./pages/Staff/StaffPage";
import UsersPage from "./pages/Users/UsersPage";
import SpacesPage from "./pages/Spaces/SpacesPage";
import LoginPage from "./pages/Auth/LoginPage";
import Marketing from "./pages/Marketing/Marketing";
import Negocio from "./pages/Negocio/Negocio";
import Schedule from "./pages/Schedule/SchedulePage";
import BookingSitePublic from "./pages/Booking/BookingSitePublic";
import PanelPage from "./pages/Empresa/PanelPage";

// ===== Guards inline =====
function RequireOrgType({ mustBe, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (mustBe === "empresa" && user?.tipo !== "Staff_Empresa") return <Navigate to="/" replace />;
  if (mustBe === "cliente" && user?.tipo !== "Staff_Clientes") return <Navigate to="/" replace />;
  return children;
}

function RequireFeature({ feature, children }) {
  const { user, hasFeature } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (feature && !hasFeature(feature)) return <Navigate to="/" replace />;
  return children;
}

// Index inteligente: Empresa → /panel, Cliente → HomePage
function HomeIndex() {
  const { user } = useAuth();
  if (user?.tipo === "Staff_Empresa") return <Navigate to="/panel" replace />;
  return <HomePage />;
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/booking/:bizSlug/:branchSlug" element={<BookingSitePublic />} />

            {/* protegidas */}
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              {/* INDEX */}
              <Route index element={<HomeIndex />} />

              {/* EMPRESA (solo empresa) */}
              <Route
                path="/panel"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireFeature feature="Tickets">
                      <PanelPage />
                    </RequireFeature>
                  </RequireOrgType>
                }
              />
              {/* Si añades estas páginas más tarde, descomenta: */}
              {/*
              <Route
                path="/cuentas"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireFeature feature="Cuentas">
                      <CuentasPage />
                    </RequireFeature>
                  </RequireOrgType>
                }
              />
              <Route
                path="/estadisticas"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireFeature feature="Personal">
                      <EstadisticasPage />
                    </RequireFeature>
                  </RequireOrgType>
                }
              />
              */}

              {/* CLIENTES (solo clientes) */}
              <Route
                path="perfil"
                element={
                  <RequireOrgType mustBe="cliente">
                    <ProfilePage />
                  </RequireOrgType>
                }
              />
              <Route
                path="informes"
                element={
                  <RequireOrgType mustBe="cliente">
                    <ReportsPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="calendarios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <CalendarsPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="calendarios/gestion"
                element={
                  <RequireOrgType mustBe="cliente">
                    <CalendarManagementPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="facturacion"
                element={
                  <RequireOrgType mustBe="cliente">
                    <BillingPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="caja"
                element={
                  <RequireOrgType mustBe="cliente">
                    <CashPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="stock"
                element={
                  <RequireOrgType mustBe="cliente">
                    <StockPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="productos"
                element={
                  <RequireOrgType mustBe="cliente">
                    <ProductsPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="personal"
                element={
                  <RequireOrgType mustBe="cliente">
                    <StaffPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="usuarios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <UsersPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="espacios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <SpacesPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="contacto"
                element={
                  <RequireOrgType mustBe="cliente">
                    <ContactsPage />
                  </RequireOrgType>
                }
              />
              <Route
                path="marketing"
                element={
                  <RequireOrgType mustBe="cliente">
                    <Marketing />
                  </RequireOrgType>
                }
              />
              <Route
                path="negocio"
                element={
                  <RequireOrgType mustBe="cliente">
                    <Negocio />
                  </RequireOrgType>
                }
              />
              <Route
                path="schedule"
                element={
                  <RequireOrgType mustBe="cliente">
                    <Schedule />
                  </RequireOrgType>
                }
              />
            </Route>

            {/* comodín */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}
