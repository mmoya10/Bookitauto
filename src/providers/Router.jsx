import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/Home/HomePage';
import ProfilePage from '../pages/Profile/ProfilePage';
import ReportsPage from '../pages/Reports/ReportsPage';
import CalendarsPage from '../pages/Calendars/CalendarsPage';
import CalendarManagementPage from '../pages/Calendars/CalendarManagementPage';
import BillingPage from '../pages/Billing/BillingPage';
import CashPage from '../pages/Cash/CashPage';
import StockPage from '../pages/Stock/StockPage';
import ProductsPage from '../pages/Products/ProductsPage';
import ContactsPage from '../pages/Contacts/ContactsPage';
import StaffPage from '../pages/Staff/StaffPage';
import UsersPage from '../pages/Users/UsersPage';
import SpacesPage from '../pages/Spaces/SpacesPage';
import LoginPage from '../pages/Auth/LoginPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage/> },
  {
    path: '/',
    element: <AppLayout/>,
    children: [
      { index: true, element: <HomePage/> },
      { path: 'perfil', element: <ProfilePage/> },
      { path: 'informes', element: <ReportsPage/> },
      { path: 'calendarios', element: <CalendarsPage/> },
      { path: 'calendarios/gestion', element: <CalendarManagementPage/> },
      { path: 'facturacion', element: <BillingPage/> },
      { path: 'caja', element: <CashPage/> },
      { path: 'stock', element: <StockPage/> },
      { path: 'productos', element: <ProductsPage/> },
      { path: 'contacto', element: <ContactsPage/> },
      { path: 'personal', element: <StaffPage/> },
      { path: 'usuarios', element: <UsersPage/> },
      { path: 'espacios', element: <SpacesPage/> },
    ]
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
