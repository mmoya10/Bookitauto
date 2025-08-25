// src/components/layout/menuConfig.js
import {
  IcUser, IcChart, IcCalendar, IcCredit, IcWallet,
  IcBoxes, IcTag, IcUsers, IcList, IcGrid, IcMail, IcMegaphone, IcSettings
} from "./Icons";

export const menu = [
  { to: "/calendarios", label: "Calendarios", icon: IcCalendar },
  { to: "/productos", label: "Productos", icon: IcTag },
  { to: "/caja", label: "Caja", icon: IcWallet },
  { to: "/stock", label: "Stock", icon: IcBoxes },
  { to: "/espacios", label: "Espacios & Equipos", icon: IcGrid },
  { to: "/usuarios", label: "Usuarios", icon: IcList },
  { to: "/informes", label: "Informes", icon: IcChart },
  { to: "/personal", label: "Personal", icon: IcUsers },
  { to: "/marketing", label: "Marketing", icon: IcMegaphone },
  { to: "/facturacion", label: "Facturación", icon: IcCredit },
  { to: "/negocio",     label: "Negocio",     icon: IcSettings, end: true }, // ⬅️ nuevo
  { to: "/perfil", label: "Perfil", icon: IcUser },
  { to: "/contacto", label: "Contacto", icon: IcMail },
];
