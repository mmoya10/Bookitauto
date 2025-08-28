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

// NUEVO: Guard por rol (lista blanca)
function RequireRole({ allow, children }) {
  const { user } = useAuth();
  if (!user) return null; // lo gestiona RequireAuth
  if (Array.isArray(allow) && !allow.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Mantiene ver/gestión por permisos (si además quieres bloquear por permiso concreto)
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

              {/* ================= EMPRESA (solo empresa) ================= */}
              <Route
                path="/panel"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireRole allow={["Admin", "Gestor"]}>
                      {/* opcional: además por permiso de empresa */}
                      <RequireFeature feature="Tickets">
                        <PanelPage />
                      </RequireFeature>
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              {/* Ejemplos (descomenta si creas las páginas):
              <Route
                path="/cuentas"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireRole allow={["Admin","Gestor"]}>
                      <RequireFeature feature="Cuentas">
                        <CuentasPage />
                      </RequireFeature>
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="/estadisticas"
                element={
                  <RequireOrgType mustBe="empresa">
                    <RequireRole allow={["Admin","Gestor"]}>
                      <RequireFeature feature="Personal">
                        <EstadisticasPage />
                      </RequireFeature>
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              */}

              {/* ================= CLIENTES (solo clientes) ================= */}
              {/* Nota: aquí dejo ejemplos de rol. Ajusta allow si quieres endurecer: */}
              <Route
                path="perfil"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <ProfilePage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="informes"
                element={
                  <RequireOrgType mustBe="cliente">
                    {/* p.ej. Informes para todos; si quieres, limítalo a Admin* */}
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <ReportsPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="calendarios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <CalendarsPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="calendarios/gestion"
                element={
                  <RequireOrgType mustBe="cliente">
                    {/* gestión normalmente NO para 'Personal' si quieres ser estricto */}
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <CalendarManagementPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="facturacion"
                element={
                  <RequireOrgType mustBe="cliente">
                    {/* ejemplo más estricto */}
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <BillingPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="caja"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      {/* además, bloquea por permiso de VER */}
                      <RequireFeature feature="Ver Caja">
                        <CashPage />
                      </RequireFeature>
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="stock"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <StockPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="productos"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <ProductsPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="personal"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <StaffPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="usuarios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <UsersPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="espacios"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <SpacesPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="contacto"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <ContactsPage />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="marketing"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal", "Personal"]}>
                      <Marketing />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="negocio"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <Negocio />
                    </RequireRole>
                  </RequireOrgType>
                }
              />
              <Route
                path="schedule"
                element={
                  <RequireOrgType mustBe="cliente">
                    <RequireRole allow={["Admin General", "Admin Sucursal"]}>
                      <Schedule />
                    </RequireRole>
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
