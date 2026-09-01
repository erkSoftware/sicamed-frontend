import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FichaSolicitud } from "./FichaSolicitud";
import { apiComercial } from "../../../shared/api/clienteComercial";
import { ErrorApi } from "../../../shared/api/problemDetails";
import { ContextoAuth } from "../../../shared/auth/contexto";
import type { ValorAuth } from "../../../shared/auth/contexto";
import type { SolicitudRegistro } from "../../../shared/api/mock/tipos";

vi.mock("../../../shared/api/clienteComercial", () => ({
  apiComercial: {
    solicitud: vi.fn(),
    descargaDeSoporte: vi.fn(),
    requisitosDeActor: vi.fn(),
  },
}));

const leerSolicitud = vi.mocked(apiComercial.solicitud);
const pedirDescarga = vi.mocked(apiComercial.descargaDeSoporte);
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

const PERMISOS = ["cumplimiento:solicitud:tramitar"];

const montar = (solicitud: SolicitudRegistro | null = SOLICITUD, permisos = PERMISOS) => {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const autorizacion = {
    estado: "autenticado",
    sesion: null,
    permisos,
  } as unknown as ValorAuth;
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <ContextoAuth.Provider value={autorizacion}>
      <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    </ContextoAuth.Provider>
  );
  return render(<FichaSolicitud solicitud={solicitud} onCerrar={() => undefined} />, {
    wrapper: envoltorio,
  });
};

beforeEach(() => {
  leerSolicitud.mockReset().mockResolvedValue(DETALLE);
  pedirDescarga
    .mockReset()
    .mockImplementation(({ soporteId }: { solicitudId: string; soporteId: string }) => {
      const archivo = ARCHIVOS[soporteId];
      if (!archivo) return Promise.resolve({ soporteId, url: "", mime: "", bytes: 0, nombre: "", expiraEn: "" });
      return Promise.resolve({ ...archivo, soporteId, nombre: soporteId, expiraEn: "" });
    });
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

  it("no firma ninguna dirección al pintar la ficha: espera a que pulsen «Ver»", async () => {
    montar();
    await screen.findAllByRole("button", { name: "Ver" });
    expect(pedirDescarga).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /Descargar/ })).not.toBeInTheDocument();
  });

  it("pide la descarga de un solo soporte y la ata a su solicitud", async () => {
    montar();
    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[0] as HTMLElement);

    await waitFor(() => expect(pedirDescarga).toHaveBeenCalledTimes(1));
    expect(pedirDescarga).toHaveBeenCalledWith({ solicitudId: "SOL-1", soporteId: "SOP-1" });
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

  it("un 404 dice que el documento ya no está y no reintenta", async () => {
    pedirDescarga.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/soporte-desconocido",
        title: "Ese soporte no respalda esta solicitud",
        detail: "No existe, o no es de esta radicación.",
        status: 404,
      }),
    );
    montar();

    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[0] as HTMLElement);

    expect(await screen.findAllByText(/El documento ya no está disponible/)).not.toHaveLength(0);
    await waitFor(() => expect(pedirDescarga).toHaveBeenCalledTimes(1));
  });

  it("una radicación antigua sin archivo detrás no ofrece un botón que daría 404", async () => {
    leerSolicitud.mockResolvedValue({
      ...DETALLE,
      declarados: [{ tipo: "LICENCIA_CULTIVO", nombre: "licencia.pdf", soporteId: "" }],
    });
    montar();

    expect(await screen.findByText(/sin adjuntar nada/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver" })).not.toBeInTheDocument();
    expect(pedirDescarga).not.toHaveBeenCalled();
  });

  it("sin permiso para tramitar no se pinta el botón de abrir el soporte", async () => {
    montar(SOLICITUD, []);

    await screen.findByText("Licencia de cultivo de la autoridad competente");
    expect(screen.queryByRole("button", { name: "Ver" })).not.toBeInTheDocument();
  });

  it("recorre los tres soportes desde el visor sin volver a la ficha", async () => {
    montar();
    const filas = await screen.findAllByRole("button", { name: "Ver" });
    await userEvent.click(filas[0] as HTMLElement);

    expect(await screen.findByText("1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Archivo siguiente" }));
    expect(await screen.findByText("2 de 3")).toBeInTheDocument();
    await waitFor(() => expect(pedirDescarga).toHaveBeenCalledTimes(2));
  });
});
