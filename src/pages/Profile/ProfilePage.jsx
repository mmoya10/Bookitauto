import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import api from "../../api/client";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* ===== Page ===== */
export default function ProfilePage() {
  return (
    <div className="space-y-6 text-zinc-100">
      <header className="mb-2">
        <h1 className="text-xl font-semibold">Mi Perfil</h1>
        <p className="text-sm text-slate-300">
          Gestiona tus datos, tu horario y tus ausencias.
        </p>
      </header>

      <ProfileSection />
    </div>
  );
}

/* ===== Sección 1: Datos de usuario ===== */
function ProfileSection() {
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const r = await api.get("/me");
        return r.data;
      } catch {
        return {
          avatarUrl: "",
          firstName: "Marc",
          lastName: "Moya",
          email: "admin@gmail.com",
          phone: "",
          birthdate: "",
        };
      }
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: me,
  });

  useEffect(() => {
    if (me) reset(me);
  }, [me, reset]);

  const [preview, setPreview] = useState("");

  const updateProfile = useMutation({
    mutationFn: (payload) => api.post("/me", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setValue("avatarUrl", url);
  }

  return (
    <section className={clsx(glassCard, "p-5")}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">Datos personales</h2>
        <p className="text-xs text-slate-300">
          Actualiza tu información básica.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((v) => updateProfile.mutate(v))}
        className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={
                preview ||
                watch("avatarUrl") ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${
                  watch("firstName") || "U"
                }`
              }
              alt="avatar"
              className="object-cover border rounded-full size-28 border-white/10 bg-white/10"
            />
            <label className="absolute bottom-0 right-0 grid text-xs border rounded-full cursor-pointer size-8 place-items-center border-white/10 bg-white/20 hover:bg-white/30">
              <input
                type="file"
                onChange={onFileChange}
                className="hidden"
                accept="image/*"
              />
              ✏️
            </label>
          </div>
          <div className="text-[11px] text-slate-400">
            PNG/JPG, máx. 2MB (demo local)
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Nombre">
            <Input placeholder="Nombre" {...register("firstName")} />
          </Field>
          <Field label="Apellidos">
            <Input placeholder="Apellidos" {...register("lastName")} />
          </Field>
          <Field label="Correo">
            <Input
              type="email"
              placeholder="nombre@empresa.com"
              {...register("email")}
            />
          </Field>
          <Field label="Teléfono">
            <Input placeholder="+34 600 000 000" {...register("phone")} />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input type="date" {...register("birthdate")} />
          </Field>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 md:col-start-2">
          <Button
            type="submit"
            variant="primary"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ===== Subcomponentes ===== */
function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}
