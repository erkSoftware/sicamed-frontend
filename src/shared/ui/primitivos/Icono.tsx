export type NombreIcono =
  | "tablero"
  | "directorio"
  | "vitrina"
  | "organizacion"
  | "produccion"
  | "inventario"
  | "ruedas"
  | "licencias"
  | "trazabilidad"
  | "reportes"
  | "pacientes"
  | "agenda"
  | "teleconsulta"
  | "buscar"
  | "campana"
  | "salir"
  | "menu"
  | "cerrar"
  | "flecha"
  | "chevron"
  | "mas"
  | "descargar"
  | "subir"
  | "filtro"
  | "alerta"
  | "check"
  | "hoja"
  | "edificio"
  | "mapa"
  | "escudo"
  | "pausa"
  | "reproducir"
  | "reloj"
  | "usuario"
  | "mundo"
  | "candado"
  | "medico"
  | "documento"
  | "cadena"
  | "luna"
  | "sol"
  | "paleta"
  | "comando"
  | "capas"
  | "sonido"
  | "silencio"
  | "microfono"
  | "ojo"
  | "ojo-cerrado";

const TRAZOS: Record<NombreIcono, string> = {
  tablero: "M3 3h7v8H3zM14 3h7v5h-7zM14 11h7v10h-7zM3 14h7v7H3z",
  directorio: "M3 4h6v6H3zM15 4h6v6h-6zM3 14h6v6H3zM15 14h6v6h-6z",
  vitrina: "M4 9V5h16v4M4 9l-1 3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0l-1-3M5 14v6h14v-6",
  organizacion: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 11h.01M15 11h.01",
  produccion: "M12 21V9M12 9c0-3 2-6 6-6 0 4-3 6-6 6zM12 12c0-3-2-5-5-5 0 3 2 5 5 5zM4 21h16",
  inventario: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  ruedas: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4",
  licencias: "M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2zM9 8h6M9 12h6",
  trazabilidad: "M6 4h6l2 2h4v5H6zM6 13h12v7H6zM10 9v4M14 16h.01",
  reportes: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  pacientes: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
  agenda: "M3 6h18v15H3zM3 10h18M8 3v4M16 3v4M8 15h3",
  teleconsulta: "M3 5h13v10H3zM16 9l5-3v10l-5-3M7 19h8",
  buscar: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  campana: "M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0",
  salir: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M3 6h18M3 12h18M3 18h18",
  cerrar: "M6 6l12 12M18 6L6 18",
  flecha: "M5 12h14M13 6l6 6-6 6",
  chevron: "M6 9l6 6 6-6",
  mas: "M12 5v14M5 12h14",
  descargar: "M12 3v12M7 11l5 5 5-5M4 21h16",
  subir: "M12 21V9M7 13l5-5 5 5M4 3h16",
  filtro: "M3 5h18l-7 8v6l-4 2v-8z",
  alerta: "M12 3l9 16H3zM12 9v5M12 17h.01",
  check: "M4 12l5 5L20 6",
  hoja: "M12 21V11M12 11c0-4 3-8 8-8 0 5-4 8-8 8zM12 14c0-3-3-6-7-6 0 4 3 6 7 6z",
  edificio: "M4 21V4h9v17M13 9h7v12M7 8h3M7 12h3M7 16h3M16 13h1M16 17h1M2 21h20",
  mapa: "M9 3L3 6v15l6-3 6 3 6-3V3l-6 3zM9 3v15M15 6v15",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  pausa: "M9 5v14M15 5v14",
  reproducir: "M7 4l13 8-13 8z",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0",
  mundo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18",
  candado: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v3",
  medico: "M9 3v6a3 3 0 0 0 6 0V3M6 3h3M15 3h3M12 12v3a4 4 0 0 0 8 0v-2M20 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  documento: "M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6",
  cadena: "M9 15l6-6M8 8H6a4 4 0 0 0 0 8h2M16 8h2a4 4 0 0 1 0 8h-2",
  luna: "M21 13a8.5 8.5 0 0 1-10-10 8.5 8.5 0 1 0 10 10z",
  sol: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  paleta: "M12 21a9 9 0 1 1 0-18c4.9 0 9 3.4 9 7.5 0 2.5-2 4.5-4.5 4.5H14a2 2 0 0 0-1.4 3.4A1.8 1.8 0 0 1 12 21zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01",
  comando: "M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z",
  capas: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  sonido: "M4 9h4l5-4v14l-5-4H4zM16.5 9.5a3.5 3.5 0 0 1 0 5M19 7a7 7 0 0 1 0 10",
  silencio: "M4 9h4l5-4v14l-5-4H4zM17 10l4 4M21 10l-4 4",
  microfono: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8",
  ojo: "M2 12s3.6-6.8 10-6.8S22 12 22 12s-3.6 6.8-10 6.8S2 12 2 12zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  "ojo-cerrado": "M3 3l18 18M10.1 10.1a2.6 2.6 0 0 0 3.8 3.8M9.6 5.4A9.9 9.9 0 0 1 12 5.2c6.4 0 10 6.8 10 6.8a17.6 17.6 0 0 1-3.4 4.3M6.1 6.6A17.4 17.4 0 0 0 2 12s3.6 6.8 10 6.8c1.4 0 2.7-.3 3.8-.8",
};

type Props = {
  nombre: NombreIcono;
  tamano?: number;
  titulo?: string;
  className?: string;
};

export const Icono = ({ nombre, tamano = 18, titulo, className }: Props) => (
  <svg
    width={tamano}
    height={tamano}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={titulo ? "img" : undefined}
    aria-hidden={titulo ? undefined : true}
    focusable="false"
  >
    {titulo ? <title>{titulo}</title> : null}
    <path d={TRAZOS[nombre]} />
  </svg>
);
