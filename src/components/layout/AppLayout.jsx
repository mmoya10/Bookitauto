// src/components/layout/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useLocalStorage from "../../hooks/useLocalStorage";
import NotifyBell from "../notifications/NotifyBell";

import { fetchBusiness, fetchBranches } from "../../api/business";
import { mainMenu, settingsMenu, empresaMenu, empresaSettingsMenu } from "./menuConfig";
import { useAuth } from "../../hooks/useAuth";

import Sidebar from "./Sidebar";
import TopbarMobile from "./TopbarMobile";
import MobileDrawer from "./MobileDrawer";
import ScrollToTop from "./ScrollToTop";

// ...imports iguales...

export default function AppLayout() {
  const [settingsMode, setSettingsMode] = useState(false);
  const { user, hasFeature } = useAuth();

  // Business + branches
  const { data: business } = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    enabled: !!business,
  });

  // Active branch
  const [activeBranchId, setActiveBranchId] = useLocalStorage("branch:active", "");
  const resolvedActiveBranchId = useMemo(() => {
    if (!branches?.length) return "";
    const ok = branches.find((b) => b.id === activeBranchId);
    return ok ? ok.id : branches[0].id;
  }, [branches, activeBranchId]);

  // Menú por tipo
  const isEmpresa = user?.tipo === "Staff_Empresa";
  const baseMenu = isEmpresa ? empresaMenu : mainMenu;
  const baseSettingsMenu = isEmpresa ? empresaSettingsMenu ?? [] : settingsMenu;
  const rawMenu = settingsMode ? baseSettingsMenu : baseMenu;

  // === Mapeos: Ruta -> Permiso y Ruta -> Roles permitidos ===
  const routeToFeature = isEmpresa
    ? {
        "/panel": "Tickets",
        "/cuentas": "Cuentas",
        "/estadisticas": "Personal",
        "/perfil": "Personal",
      }
    : {
        "/calendarios": "Ver Espacios",
        "/caja": "Ver Caja",
        "/productos": "Ver Productos",
        "/stock": "Ver Stock",
        "/usuarios": "Ver Usuarios",
        "/espacios": "Ver Espacios",
        "/informes": "Ver todos los informes",
        "/perfil": "Gestionar Personal",
        "/negocio": "Gestionar Negocio",
        "/personal": "Gestionar Personal",
        "/schedule": "Gestionar Horario",
        "/facturacion": "Facturación",
        "/marketing": "Ver todos los informes", // ajusta si procede
      };

  // Puedes endurecer aquí las visibilidades por rol:
  const routeToAllowedRoles = isEmpresa
    ? {
        "/panel": ["Admin", "Gestor"],
        "/cuentas": ["Admin", "Gestor"],
        "/estadisticas": ["Admin", "Gestor"],
        "/perfil": ["Admin", "Gestor"],
      }
    : {
        // Clientes: por defecto todos ven, pero endurecemos algunos ejemplos:
        "/calendarios": ["Admin General", "Admin Sucursal", "Personal"],
        "/caja": ["Admin General", "Admin Sucursal", "Personal"],
        "/productos": ["Admin General", "Admin Sucursal", "Personal"],
        "/stock": ["Admin General", "Admin Sucursal", "Personal"],
        "/usuarios": ["Admin General", "Admin Sucursal"], // ejemplo: sólo admins
        "/personal": ["Admin General", "Admin Sucursal"], // ejemplo: sólo admins
        "/negocio": ["Admin General", "Admin Sucursal"],  // ejemplo: sólo admins
        "/schedule": ["Admin General", "Admin Sucursal"], // ejemplo: sólo admins
        "/facturacion": ["Admin General", "Admin Sucursal"], // ejemplo: sólo admins
        "/informes": ["Admin General", "Admin Sucursal", "Personal"],
        "/perfil": ["Admin General", "Admin Sucursal", "Personal"],
        "/espacios": ["Admin General", "Admin Sucursal", "Personal"],
        "/marketing": ["Admin General", "Admin Sucursal", "Personal"],
      };

  // Filtro por ROL + PERMISO
  const filteredMenu = rawMenu.filter((item) => {
    // 1) Rol permitido
    const allowed = routeToAllowedRoles[item.to];
    const roleOk = !allowed || allowed.includes(user?.rol);

    // 2) Permiso funcional
    const featureKey = routeToFeature[item.to];
    const opts = isEmpresa ? undefined : { branchId: resolvedActiveBranchId };
    const featureOk = featureKey ? hasFeature(featureKey, opts) : true;

    return roleOk && featureOk;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-[100svh] flex flex-col md:grid md:grid-cols-[auto_1fr] text-zinc-100 bg-fixed bg-no-repeat
bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.40),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.40),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)]"
    >
      <Sidebar
        menu={filteredMenu}
        business={business}
        branches={branches}
        branchMode={!!business?.branchMode}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
        settingsMode={settingsMode}
        setSettingsMode={setSettingsMode}
      />

      <TopbarMobile
        onOpenMenu={() => setMobileOpen(true)}
        business={business}
        branchMode={!!business?.branchMode}
        branches={branches}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
      />

      <div className="min-w-0 flex-1">
        <main className="p-6">
          <ScrollToTop />
          <Outlet />
        </main>
      </div>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
          setSettingsMode(false);
        }}
        menu={filteredMenu}
        business={business}
        branchMode={!!business?.branchMode}
        branches={branches}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
        settingsMode={settingsMode}
        setSettingsMode={setSettingsMode}
      />

      <NotifyBell />
    </div>
  );
}

