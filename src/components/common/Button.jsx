import clsx from "clsx";

const base =
  "inline-flex items-center justify-center rounded-xl text-sm transition " +
  "active:translate-y-px focus:outline-none focus:ring-1 disabled:opacity-60 disabled:cursor-not-allowed";

const sizes = {
  md: "px-4 py-2",
  sm: "px-2.5 py-1.5 text-xs",
};

const variants = {
  primary:
    "text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] " +
    "hover:shadow-[0_8px_24px_rgba(124,58,237,0.35)] focus:ring-white/30",
  ghost:
    "text-zinc-100 border border-white/10 bg-transparent " +
    "hover:bg-white/10 focus:ring-white/20",
  danger:
    "text-red-100 border border-red-400/30 bg-red-500/15 " +
    "hover:bg-red-500/25 focus:ring-red-300/30",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}
