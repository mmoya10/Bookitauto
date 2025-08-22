// src/components/layout/menuConfig.js
import {
  IcUser, IcChart, IcCalendar, IcCredit, IcWallet,
  IcBoxes, IcTag, IcUsers, IcList, IcGrid, IcMail, IcMegaphone
} from "./Icons";

export const menu = [
  { to: "/perfil", label: "Mi Perfil", icon: IcUser },
  { to: "/informes", label: "Informes", icon: IcChart },
  { to: "/calendarios", label: "Calendarios", icon: IcCalendar },
  { to: "/facturacion", label: "Facturación", icon: IcCredit },
  { to: "/caja", label: "Caja", icon: IcWallet },
  { to: "/stock", label: "Stock", icon: IcBoxes },
  { to: "/productos", label: "Productos", icon: IcTag },
  { to: "/personal", label: "Personal", icon: IcUsers },
  { to: "/usuarios", label: "Usuarios", icon: IcList },
  { to: "/espacios", label: "Espacios", icon: IcGrid },
  { to: "/contacto", label: "Contacto", icon: IcMail },
  { to: "/marketing", label: "Marketing", icon: IcMegaphone },
];
