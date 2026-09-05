export const CLASE_SENALADA = "aurora-senalado";

const DURACION = 4200;

let vigente: { elemento: Element; ficha: number } | null = null;

export const apagarSenal = (): void => {
  if (!vigente) return;
  window.clearTimeout(vigente.ficha);
  vigente.elemento.classList.remove(CLASE_SENALADA);
  vigente = null;
};

export const senalarElemento = (elemento: Element | null | undefined): boolean => {
  if (!elemento) return false;
  apagarSenal();

  elemento.classList.add(CLASE_SENALADA);
  if (elemento instanceof HTMLElement) {
    elemento.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  const ficha = window.setTimeout(() => {
    elemento.classList.remove(CLASE_SENALADA);
    vigente = null;
  }, DURACION);
  vigente = { elemento, ficha };
  return true;
};
