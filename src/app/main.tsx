import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { App } from "./App";
import "../shared/ui/tokens/fuentes.css";
import "../shared/ui/tokens/tokens.css";
import "../shared/ui/tokens/base.css";
import "../shared/ui/tokens/componentes.css";
import "../shared/ui/tokens/aplicacion.css";
import "../shared/ui/tokens/publico.css";

document.documentElement.setAttribute("data-movimiento", "si");

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
