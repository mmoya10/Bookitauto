// src/components/layout/menuConfig.js
import {
  IcProfile,
  IcChart,
  IcCalendar,
  IcFacturacion,
  IcBoxes,
  IcProducts,
  IcUsers,
  IcList,
  IcGrid,
  IcMegaphone,
  IcBusiness,
  IcHorario,
} from "./Icons";

/**
 * Menú principal normal
 */
export const mainMenu = [
  { to: "/calendarios", label: "Calendario", icon: IcCalendar },
  { to: "/productos", label: "Productos", icon: IcProducts },
  { to: "/stock", label: "Stock", icon: IcBoxes },
  { to: "/usuarios", label: "Usuarios", icon: IcList },
  { to: "/marketing", label: "Marketing", icon: IcMegaphone },
  { to: "/espacios", label: "Espacios & Equipos", icon: IcGrid },
  { to: "/informes", label: "Informes", icon: IcChart },
];

/**
 * Menú modo ajustes (solo Perfil y Negocio)
 */
export const settingsMenu = [
  { to: "/perfil", label: "Perfil", icon: IcProfile },
  { to: "/schedule", label: "Horario", icon: IcHorario },
  { to: "/personal", label: "Personal", icon: IcUsers },
  { to: "/negocio", label: "Negocio", icon: IcBusiness, end: true },
  { to: "/facturacion", label: "Facturación", icon: IcFacturacion },
];
