// src/components/layout/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resetea el scroll al cambiar pathname.
 * - Si pasas `selector`, hace scroll en ese contenedor.
 * - Si no, hace scroll en la ventana.
 */
export default function ScrollToTop({ selector }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (selector) {
      const el = document.querySelector(selector);
      if (el) el.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname, selector]);

  return null;
}
