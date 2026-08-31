import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FichaSolicitud } from "./FichaSolicitud";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { SolicitudRegistro } from "../../../shared/api/mock/tipos";

vi.mock("../../../shared/api/clienteComercial", () => ({
  apiComercial: {
    solicitud: vi.fn(),
    archivoDeSoporte: vi.fn(),
    requisitosDeActor: vi.fn(),
  },
}));

const leerSolicitud = vi.mocked(apiComercial.solicitud);
const leerArchivo = vi.mocked(apiComercial.archivoDeSoporte);
const leerRequisitos = vi.mocked(apiComercial.requisitosDeActor);

const SOLICITUD: SolicitudRegistro = {
  id: "SOL-1",
  nit: "900123456-8",
  organizacion: "Erk Software",
  tipoActor: "CULTIVADOR",
  departamento: "76",
  municipio: "76001",
  representante: "Cristian Machado Mosquera",
  correo: "registro@erk.co",
  telefono: "3001234567",
  estado: "RECIBIDA",
  recibida: "2026-08-30T14:03:11Z",
  expedienteId: null,
  motivoRechazo: null,
  documentos: [],
  huella: "",
};

const DETALLE = {
  ...SOLICITUD,
  organizacionId: null,
  declarados: [
    { tipo: "LICENCIA_CULTIVO", nombre: "licencia-cultivo.pdf", soporteId: "SOP-1" },
    { tipo: "PLAN_MANEJO_AMBIENTAL", nombre: "plan-ambiental.docx", soporteId: "SOP-2" },
    { tipo: "CEDULA_REPRESENTANTE", nombre: "cedula.png", soporteId: "SOP-3" },
  ],
};

const ARCHIVOS: Record<string, { url: string; mime: string; bytes: number }> = {
  "SOP-1": { url: "https://almacen/licencia.pdf", mime: "application/pdf", bytes: 240_000 },
  "SOP-2": {
    url: "https://almacen/plan.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: 51_200,
  },
  "SOP-3": { url: "https://almacen/cedula.png", mime: "image/png", bytes: 1024 },
};

const montar = (solicitud: SolicitudRegistro | null = SOLICITUD) => {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  );
  return render(<FichaSolicitud solicitud={solicitud} onCerrar={() => undefined} />, {
    wrapper: envoltorio,
  });
};

beforeEach(() => {
  leerSolicitud.mockReset().mockResolvedValue(DETALLE);
  leerArchivo
    .mockReset()
    .mockImplementation((soporteId: string) =>
      Promise.resolve(ARCHIVOS[soporteId] ?? { url: "", mime: "", bytes: 0 }),
    );
  leerRequisitos.mockReset().mockResolvedValue({
    tipoActor: "CULTIVADOR",
    documentos: [
      {
        tipo: "LICENCIA_CULTIVO",
        etiqueta: "Licencia de cultivo de la autoridad competente",
        obligatorio: true,
      },
    ],
  });
});

describe("FichaSolicitud", () => {
  it("no pide nada mientras no haya solicitud abierta", () => {
    montar(null);
    expect(leerSolicitud).not.toHaveBeenCalled();
  });

  it("traduce los códigos DIVIPOLA a nombres en vez de enseñar el número", async () => {
    montar();
    expect(await screen.findByText("Cali, Valle del Cauca")).toBeInTheDocument();
    expect(screen.getByText("900123456-8")).toBeInTheDocument();
  });

  it("rotula cada soporte con la etiqueta del catálogo y humaniza la que no está", async () => {
    montar();
    expect(
      await screen.findByText("Licencia de cultivo de la autoridad competente"),
    ).toBeInTheDocument();
    expect(screen.getByText("Plan manejo ambiental")).toBeInTheDocument();
    expect(screen.getByText("Cedula representante")).toBeInTheDocument();
  });

  it("da descarga directa a cada archivo con su nombre", async () => {
    montar();
    const descargas = await screen.findAllByRole("link", { name: /Descargar/ });
    expect(descargas).toHaveLength(3);
    expect(descargas[0]).toHaveAttribute("href", "https://almacen/licencia.pdf");
    expect(descargas[0]).toHaveAttribute("download", "licencia-cultivo.pdf");
  });

  it("abre la imagen a pantalla grande y deja ampliarla", async () => {
    montar();
    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[2] as HTMLElement);

    const imagen = await screen.findByAltText("Cedula representante");
    expect(imagen).toHaveAttribute("src", "https://almacen/cedula.png");
    expect(screen.getByRole("button", { name: "Ampliar la imagen" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ampliar la imagen" }));
    expect(screen.getByRole("button", { name: "Ajustar la imagen a la ventana" })).toBeInTheDocument();
  });

  it("no finge una vista del .docx: dice qué es y ofrece descargarlo", async () => {
    montar();
    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[1] as HTMLElement);

    expect(await screen.findByText(/documentos de Word no se dibujan/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("dice cuál es el paso siguiente cuando el servidor no publicó la dirección", async () => {
    leerArchivo.mockResolvedValue({ url: "", mime: "", bytes: 0 });
    montar();

    const filas = await screen.findAllByRole("button", { name: "Ver" });
    expect(await screen.findAllByText("El servidor no publicó una dirección")).toHaveLength(3);

    await userEvent.click(filas[0] as HTMLElement);
    expect(
      await screen.findByText(/no publicó una dirección para este soporte/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Descargar/ })).not.toBeInTheDocument();
  });

  it("recorre los tres soportes desde el visor sin volver a la ficha", async () => {
    montar();
    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[0] as HTMLElement);

    expect(await screen.findByText("1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Archivo siguiente" }));
    expect(await screen.findByText("2 de 3")).toBeInTheDocument();
  });
});
