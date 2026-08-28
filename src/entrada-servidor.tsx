import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import type { HelmetServerState } from "react-helmet-async";
import { QueryProviderComercial } from "./app/providers/QueryProviderComercial";
import { seccionPublica } from "./publico/rutas";
import { NoEncontrado } from "./publico/paginas/NoEncontrado";

export type ResultadoRender = {
  html: string;
  cabeza: string;
  atributosHtml: string;
};

export const renderizar = (ruta: string): ResultadoRender => {
  const contexto: { helmet?: HelmetServerState } = {};

  const html = renderToString(
    <HelmetProvider context={contexto}>
      <QueryProviderComercial>
        <StaticRouter location={ruta}>
          <Routes>
            {seccionPublica()}
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </StaticRouter>
      </QueryProviderComercial>
    </HelmetProvider>,
  );

  const casco = contexto.helmet;
  const cabeza = casco
    ? [
        casco.title.toString(),
        casco.meta.toString(),
        casco.link.toString(),
        casco.script.toString(),
      ]
        .filter(Boolean)
        .join("\n    ")
    : "";

  return { html, cabeza, atributosHtml: casco?.htmlAttributes.toString() ?? 'lang="es-CO"' };
};
