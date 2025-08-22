import { useEffect, useRef, isValidElement, cloneElement } from "react";
import { createPortal } from "react-dom";

// Contador global sencillo para soportar múltiples portales abiertos
let locks = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockBody() {
  const { body, documentElement } = document;
  if (locks === 0) {
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  }
  locks++;
}
function unlockBody() {
  const { body } = document;
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    body.style.overflow = savedOverflow || "";
    body.style.paddingRight = savedPaddingRight || "";
  }
}

function hasOverlayClass(className = "") {
  return /\bfixed\b/.test(className) && /\binset-0\b/.test(className);
}

function mergeClass(a = "", b = "") {
  // evita duplicados simples
  const set = new Set((a + " " + b).trim().split(/\s+/));
  return Array.from(set).join(" ");
}

export default function Portal({
  children,
  onClose,             // para cerrar con ESC o overlay
  lockScroll = true,   // bloquea scroll del body
  trapEscape = true,   // cierra con tecla Escape
  autoEnhance = true,  // mejora/inyecta overlay y clases sin tocar las llamadas
  closeOnOverlay = true,
}) {
  const elRef = useRef(null);
  if (!elRef.current) elRef.current = document.createElement("div");

  useEffect(() => {
    const el = elRef.current;
    el.setAttribute("data-portal-root", "true");
    document.body.appendChild(el);

    if (lockScroll) lockBody();

    const onKey = (e) => {
      if (trapEscape && e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) unlockBody();
      document.body.removeChild(el);
    };
  }, [lockScroll, trapEscape, onClose]);

  let node = children;

  if (autoEnhance && isValidElement(children)) {
    const cls = children.props.className || "";
    const overlayClick = (e) => {
      // solo si pincha en el overlay, no dentro del panel
      if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      // conserva onClick del hijo si lo tenía
      if (typeof children.props.onClick === "function") {
        children.props.onClick(e);
      }
    };

    if (hasOverlayClass(cls)) {
      // Ya es overlay: inyectamos scroll interno invisible
      node = cloneElement(children, {
        className: mergeClass(cls, "overflow-y-auto overscroll-contain no-scrollbar"),
        onClick: overlayClick,
      });
    } else {
      // No es overlay: lo envolvemos con uno
      node = (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4 overflow-y-auto overscroll-contain no-scrollbar"
          onClick={overlayClick}
          aria-modal="true"
          role="dialog"
        >
          {children}
        </div>
      );
    }
  }

  return createPortal(node, elRef.current);
}
