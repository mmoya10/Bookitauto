// src/components/calendar/EventContent.js
export default function eventContent({ event }) {
  const isFree = event.extendedProps?.isFreeSlot;
  const isAbs  = event.extendedProps?.type === "ausencia";
  const staffName = event.extendedProps?.staffName || "";
  const payKind   = event.extendedProps?.paymentKind || "";
  const wrap = document.createElement("div");
  wrap.style.display = "grid"; wrap.style.gap = "2px"; wrap.style.padding = "2px 4px"; wrap.style.fontSize = "12px";

  const title = document.createElement("div");
  title.style.fontWeight = "600"; title.style.lineHeight = "1.1";
  title.textContent = isAbs ? `Ausencia · ${staffName || "Personal"}`
                 : isFree ? "Hueco"
                          : (event.title || "");
  wrap.appendChild(title);

  if (!isAbs && !isFree && payKind) {
    const badge = document.createElement("div");
    badge.textContent = payKind === "online" ? "Online" : payKind;
    badge.style.fontSize = "10px"; badge.style.padding = "1px 6px"; badge.style.borderRadius = "9999px"; badge.style.width = "fit-content";
    badge.style.background = payKind === "online" ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.25)";
    badge.style.color      = payKind === "online" ? "#d1fae5" : "#ede9fe";
    wrap.appendChild(badge);
  }
  return { domNodes: [wrap] };
}
