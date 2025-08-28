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

  // Active branch (persisted)
  const [activeBranchId, setActiveBranchId] = useLocalStorage("branch:active", "");
  const resolvedActiveBranchId = useMemo(() => {
    if (!branches?.length) return "";
    const ok = branches.find((b) => b.id === activeBranchId);
    return ok ? ok.id : branches[0].id;
  }, [branches, activeBranchId]);

  // Menú activo según tipo de usuario + modo ajustes
  const isEmpresa = user?.tipo === "Staff_Empresa";

  const baseMenu = isEmpresa ? empresaMenu : mainMenu;
  const baseSettingsMenu = isEmpresa ? empresaSettingsMenu ?? [] : settingsMenu;
  const rawMenu = settingsMode ? baseSettingsMenu : baseMenu;

  // Mapa ruta -> permiso (según tipo)
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

  // Filtrado por permisos (en clientes considerar branchId para Admin Sucursal)
  const filteredMenu = rawMenu.filter((item) => {
    const featureKey = routeToFeature[item.to];
    if (!featureKey) return true;
    const opts = isEmpresa ? undefined : { branchId: resolvedActiveBranchId };
    return hasFeature(featureKey, opts);
  });

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-[100svh] flex flex-col md:grid md:grid-cols-[auto_1fr] text-zinc-100 bg-fixed bg-no-repeat
bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.40),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.40),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)]"
    >
      {/* Sidebar desktop */}
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

      {/* Topbar móvil */}
      <TopbarMobile
        onOpenMenu={() => setMobileOpen(true)}
        business={business}
        branchMode={!!business?.branchMode}
        branches={branches}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
      />

      {/* Main */}
      <div className="min-w-0 flex-1">
        <main className="p-6">
          <ScrollToTop />
          <Outlet />
        </main>
      </div>

      {/* Drawer móvil */}
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

      {/* Notificaciones flotantes */}
      <NotifyBell />
    </div>
  );
}
