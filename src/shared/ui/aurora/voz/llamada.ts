import type { SesionAsistente } from "../../../api/clienteAsistente";

export type PlanDeLlamada = {
  llamadaId: string;
  duracionSegundos: number | null;
  avisoSegundos: number | null;
  frase: string;
};

export const planDeLlamada = (sesion: SesionAsistente): PlanDeLlamada => {
  const duracion = sesion.duracionMaximaSegundos ?? 0;
  const aviso = sesion.avisoEnSegundos ?? 0;
  const frase = (sesion.mensajeAviso ?? "").trim();
  const avisoUtil = aviso > 0 && frase !== "" && (duracion === 0 || aviso < duracion);

  return {
    llamadaId: sesion.llamadaId ?? "",
    duracionSegundos: duracion > 0 ? duracion : null,
    avisoSegundos: avisoUtil ? aviso : null,
    frase,
  };
};

export const mensajeDeAviso = (frase: string): string =>
  JSON.stringify({
    type: "response.create",
    response: { instructions: `Diga exactamente esto y siga atendiendo: "${frase}"` },
  });
