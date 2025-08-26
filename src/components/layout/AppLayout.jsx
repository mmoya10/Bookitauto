// src/components/layout/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useLocalStorage from "../../hooks/useLocalStorage";
import NotifyBell from "../notifications/NotifyBell";

import { fetchBusiness, fetchBranches } from "../../api/business";
import { menu } from "./menuConfig";

import Sidebar from "./Sidebar";
import TopbarMobile from "./TopbarMobile";
import MobileDrawer from "./MobileDrawer";

export default function AppLayout() {
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
    const ok = branches.find(b => b.id === activeBranchId);
    return ok ? ok.id : branches[0].id;
  }, [branches, activeBranchId]);

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-[100svh] flex flex-col md:grid md:grid-cols-[auto_1fr] text-zinc-100 bg-fixed bg-no-repeat
bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.40),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.40),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)]"
    >
      {/* Sidebar desktop */}
      <Sidebar
        menu={menu}
        business={business}
        branches={branches}
        branchMode={!!business?.branchMode}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
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
          <Outlet />
        </main>
      </div>

      {/* Drawer móvil */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        menu={menu}
        business={business}
        branchMode={!!business?.branchMode}
        branches={branches}
        activeBranchId={resolvedActiveBranchId}
        setActiveBranchId={setActiveBranchId}
      />

      {/* Notificaciones flotantes */}
      <NotifyBell />
    </div>
  );
}
