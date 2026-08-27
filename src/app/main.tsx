import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { App } from "./App";
import { cinematicaActiva, limpiarHashIntro } from "../publico/intro/decision";
import { anotar, instalarConsolaIntro } from "../publico/intro/diagnostico";
import "../shared/ui/tokens/fuentes.css";
import "../shared/ui/tokens/tokens.css";
import "../shared/ui/tokens/base.css";
import "../shared/ui/tokens/componentes.css";
import "../shared/ui/tokens/aplicacion.css";
import "../shared/ui/tokens/publico.css";
import "../shared/ui/tokens/cinematica.css";

document.documentElement.setAttribute("data-movimiento", "si");

instalarConsolaIntro();
anotar("arranque", { href: window.location.href });

if (cinematicaActiva()) {
  document.documentElement.setAttribute("data-cinematica", "corriendo");
  document.documentElement.setAttribute("data-intro", "corriendo");
} else {
  document.documentElement.removeAttribute("data-cinematica");
}

limpiarHashIntro();

const raiz = document.getElementById("raiz");

if (raiz) {
  const arbol = (
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
  );

  if (raiz.hasChildNodes()) hydrateRoot(raiz, arbol);
  else createRoot(raiz).render(arbol);
}
