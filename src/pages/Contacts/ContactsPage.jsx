import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchBusinessContact, sendContactMessage } from "../../api/contacts";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import clsx from "clsx";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function ContactsPage() {
  const { data: c } = useQuery({ queryKey: ["biz-contact"], queryFn: fetchBusinessContact });

  const waLink = useMemo(() => {
    if (!c?.whatsapp) return null;
    const digits = (c.whatsapp || "").replace(/[^\d]/g, "");
    const txt = encodeURIComponent("Hola, tengo una consulta sobre mi cita / facturación.");
    return `https://wa.me/${digits}?text=${txt}`;
  }, [c]);

  const qrSrc = waLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waLink)}`
    : null;

  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Contacto</h1>
        <p className="text-sm text-slate-300">
          ¿Dudas o incidencias? Aquí tienes nuestros datos y un formulario de contacto.
        </p>
      </header>

      {/* Datos de contacto */}
      <section className={clsx(glassCard, "p-4")}>
        {c ? (
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard title="Negocio" value={c.businessName} />
            <InfoCard title="Email" value={c.email} />
            <InfoCard title="Teléfono" value={c.phone} />
            <InfoCard title="Dirección" value={c.address} />
            <InfoCard title="Horario" value={c.hours} />
            <InfoCard title="Web" value={c.website} />
          </div>
        ) : (
          <div className="text-sm text-slate-300">Cargando…</div>
        )}
      </section>

      {/* WhatsApp + QR */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-2 text-sm font-semibold">WhatsApp</div>
            <p className="text-sm text-slate-300">
              Escanea el QR o pulsa el botón para abrir una conversación directa en WhatsApp.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => waLink && window.open(waLink, "_blank")}>
                Abrir WhatsApp
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!waLink) return;
                  navigator.clipboard?.writeText(waLink);
                  alert("Enlace copiado al portapapeles");
                }}
              >
                Copiar enlace
              </Button>
            </div>
          </div>
          <div className="grid place-items-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              {qrSrc ? (
                <img src={qrSrc} alt="QR WhatsApp" className="h-44 w-44" />
              ) : (
                <div className="text-sm text-slate-300">Sin número de WhatsApp.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de contacto */}
      <ContactForm />
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-300">{title}</div>
      <div className="text-sm font-semibold break-words">{value}</div>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const m = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: () => {
      alert("Mensaje enviado. Te responderemos pronto.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
  });

  return (
    <section className={clsx(glassCard, "p-4")}>
      <div className="mb-2 text-sm font-semibold">Formulario de contacto</div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            alert("Nombre, email y mensaje son obligatorios.");
            return;
          }
          m.mutate(form);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Nombre *">
            <Input value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={(e)=>setForm(f=>({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e)=>setForm(f=>({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Asunto">
            <Input value={form.subject} onChange={(e)=>setForm(f=>({ ...f, subject: e.target.value }))} />
          </Field>
        </div>
        <Field label="Mensaje *">
          <textarea
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 outline-none"
            value={form.message}
            onChange={(e)=>setForm(f=>({ ...f, message: e.target.value }))}
          />
        </Field>
        <div>
          <Button variant="primary" type="submit" disabled={m.isPending}>
            {m.isPending ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}
