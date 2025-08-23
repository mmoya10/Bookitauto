import { useState } from "react";
import {  useMutation } from "@tanstack/react-query";
import { sendContactMessage } from "../../api/contacts";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import clsx from "clsx";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function ContactsPage() {



  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Contacto</h1>
        <p className="text-sm text-slate-300">
          ¿Dudas o incidencias? Aquí tienes nuestros datos y un formulario de contacto.
        </p>
      </header>

      {/* Formulario de contacto */}
      <ContactForm />
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
            className="w-full px-3 py-2 text-sm border outline-none rounded-xl border-white/10 bg-white/10 text-zinc-100"
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
