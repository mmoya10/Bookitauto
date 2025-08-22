import clsx from "clsx";

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm " +
  "text-zinc-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-white/20 " +
  "hover:bg-white/15 transition appearance-none"; // 👈 appearance-none para inputs nativos

const selectBase =
  "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm " +
  "text-zinc-100 outline-none focus:ring-1 focus:ring-white/20 hover:bg-white/15 " +
  "transition appearance-none pr-9"; // 👈 espacio para el chevron

export function Input({ className, style, ...props }) {
  return (
    <input
      className={clsx(inputBase, "ui-input", className)}
      // color-scheme le dice al navegador que renderice los widgets en dark
      style={{ colorScheme: "dark", ...style }}
      {...props}
    />
  );
}

export function Select({ className, style, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={clsx(selectBase, "ui-select", className)}
        style={{ colorScheme: "dark", ...style }}
        {...props}
      >
        {children}
      </select>

      {/* Chevron blanco (decorativo, sin eventos) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-80 text-zinc-100"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
