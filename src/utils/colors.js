// Utilidades de color HEX y RGBA (sin dependencias)

export function hexToRgb(hex) {
  let h = String(hex || "#64748b").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num) || h.length !== 6) return { r: 100, g: 116, b: 139 }; // slate-500 fallback
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mixRgb(a, b, t) {
  const lerp = (x, y, p) => x + (y - x) * p;
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

export function mixHex(h1, h2, t) {
  const a = hexToRgb(h1);
  const b = hexToRgb(h2);
  const m = mixRgb(a, b, clamp01(t));
  return rgbToHex(m.r, m.g, m.b);
}

export function tintHex(hex, t) {
  return mixHex(hex, "#ffffff", clamp01(t));
} // mezcla con blanco (0..1)

export function shadeHex(hex, t) {
  return mixHex(hex, "#000000", clamp01(t));
} // mezcla con negro (0..1)

export function rgbaFromHex(hex, a = 1) {
  const { r, g, b } = hexToRgb(hex);
  const alpha = Math.max(0, Math.min(1, Number(a)));
  return `rgba(${r},${g},${b},${alpha})`;
}

function clamp01(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
