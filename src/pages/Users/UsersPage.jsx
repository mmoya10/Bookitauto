import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../../api/users";
import { Input } from "../../components/common/Input";
import clsx from "clsx";
import { parseISO, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function UsersPage() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  // filtros
  const [qName, setQName] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qEmail, setQEmail] = useState("");

  const filtered = useMemo(() => {
    const name = qName.trim().toLowerCase();
    const phone = qPhone.trim().toLowerCase();
    const email = qEmail.trim().toLowerCase();
    return (data ?? []).filter((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
      const okName = !name || full.includes(name);
      const okPhone = !phone || (u.phone ?? "").toLowerCase().includes(phone);
      const okEmail = !email || (u.email ?? "").toLowerCase().includes(email);
      return okName && okPhone && okEmail;
    });
  }, [data, qName, qPhone, qEmail]);

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <p className="text-sm text-slate-300">
          Consulta y filtra tus usuarios por nombre, teléfono o email.
        </p>
      </header>

      {/* Filtros */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Nombre completo</span>
            <Input
              placeholder="Ej. Juan Pérez"
              value={qName}
              onChange={(e) => setQName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Teléfono</span>
            <Input
              placeholder="+34 …"
              value={qPhone}
              onChange={(e) => setQPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Email</span>
            <Input
              placeholder="usuario@correo.com"
              value={qEmail}
              onChange={(e) => setQEmail(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className={clsx(glassCard, "p-3")}>
        <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Última cita</th>
                <th className="px-3 py-2">Alta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}

              {!filtered.length && (
                <tr>
                  <td className="px-3 py-4 text-slate-400" colSpan={5}>
                    No hay usuarios que cumplan los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ===== Fila usuario ===== */
function UserRow({ user }) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "(Sin nombre)";
  const isNewThisMonth = user.signup ? isSameMonth(parseISO(user.signup), new Date()) : false;

  return (
    <tr className="border-t border-white/10">
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} imageUrl={user.imageUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">{fullName}</div>
              {isNewThisMonth && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-2 py-0.5 text-[11px]">
                  Nuevo
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">{user.phone || "-"}</td>
      <td className="px-3 py-2">{user.email || "-"}</td>
      <td className="px-3 py-2">{formatDateTime(user.lastAppointment) || "-"}</td>
      <td className="px-3 py-2">{formatDate(user.signup) || "-"}</td>
    </tr>
  );
}

/* ===== Avatar: imagen o inicial ===== */
function Avatar({ name, imageUrl }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-10 w-10 object-cover rounded-full border border-white/10"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full grid place-items-center border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.3),rgba(34,211,238,0.25))] text-sm font-semibold">
      {letter}
    </div>
  );
}

/* ===== Utils fecha ===== */
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}
function formatDateTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}
