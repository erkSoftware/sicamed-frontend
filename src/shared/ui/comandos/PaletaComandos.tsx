import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as EventoTeclado } from "react";
import { useNavigate } from "react-router-dom";
import { Icono } from "../primitivos/Icono";
import type { NombreIcono } from "../primitivos/Icono";
import { useModulosDisponibles } from "../../rbac/useNavegacion";
import { useTema } from "../../tema/almacen";
import { LUMINOSIDADES } from "../../tema/tipos";

type Comando = {
  id: string;
  etiqueta: string;
  contexto: string;
  descripcion: string;
  icono: NombreIcono;
  familia: "Módulos" | "Destinos" | "Apariencia";
  ejecutar: () => void;
};

const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const subsecuencia = (pajar: string, aguja: string): boolean => {
  let cursor = 0;
  for (const letra of aguja) {
    if (letra === " ") continue;
    cursor = pajar.indexOf(letra, cursor);
    if (cursor === -1) return false;
    cursor += 1;
  }
  return true;
};

const puntaje = (comando: Comando, consulta: string): number | null => {
  if (!consulta.trim()) return 0;
  const aguja = normalizar(consulta.trim());
  const etiqueta = normalizar(comando.etiqueta);
  const pajar = normalizar(
    `${comando.etiqueta} ${comando.contexto} ${comando.descripcion} ${comando.familia}`,
  );
  if (etiqueta.startsWith(aguja)) return 0;
  if (etiqueta.includes(aguja)) return 1;
  if (pajar.includes(aguja)) return 2;
  if (subsecuencia(etiqueta, aguja)) return 3;
  if (subsecuencia(pajar, aguja)) return 4;
  return null;
};

type Props = {
  abierta: boolean;
  onCerrar: () => void;
  onIrAModulo: (id: string, ruta: string) => void;
};

export const PaletaComandos = ({ abierta, onCerrar, onIrAModulo }: Props) => {
  const modulos = useModulosDisponibles();
  const navegar = useNavigate();
  const elegirLuminosidad = useTema((estado) => estado.elegirLuminosidad);
  const referencia = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [consulta, setConsulta] = useState("");
  const [resaltado, setResaltado] = useState(0);
  const idLista = useId();

  const comandos = useMemo<readonly Comando[]>(() => {
    const deModulos: Comando[] = modulos.map((modulo) => ({
      id: `modulo:${modulo.id}`,
      etiqueta: modulo.etiqueta,
      contexto: modulo.rotulo,
      descripcion: modulo.descripcion,
      icono: modulo.icono,
      familia: "Módulos",
      ejecutar: () => onIrAModulo(modulo.id, modulo.items[0]?.ruta ?? "/app"),
    }));

    const deDestinos: Comando[] = modulos.flatMap((modulo) =>
      modulo.items.map((item) => ({
        id: `destino:${item.ruta}`,
        etiqueta: item.etiqueta,
        contexto: modulo.etiqueta,
        descripcion: item.descripcion,
        icono: item.icono as NombreIcono,
        familia: "Destinos" as const,
        ejecutar: () => navegar(item.ruta),
      })),
    );

    const deApariencia: Comando[] = [
      ...LUMINOSIDADES.map((ficha) => ({
        id: `luminosidad:${ficha.id}`,
        etiqueta: `Modo ${ficha.nombre}`,
        contexto: "Apariencia",
        descripcion: ficha.descripcion,
        icono: ficha.icono,
        familia: "Apariencia" as const,
        ejecutar: () => elegirLuminosidad(ficha.id),
      })),
    ];

    return [...deModulos, ...deDestinos, ...deApariencia];
  }, [elegirLuminosidad, modulos, navegar, onIrAModulo]);

  const resultados = useMemo(() => {
    const calificados = comandos
      .map((comando, orden) => ({ comando, orden, valor: puntaje(comando, consulta) }))
      .filter((fila): fila is { comando: Comando; orden: number; valor: number } => fila.valor !== null);
    calificados.sort((a, b) => a.valor - b.valor || a.orden - b.orden);
    return calificados.slice(0, 12).map((fila) => fila.comando);
  }, [comandos, consulta]);

  useEffect(() => setResaltado(0), [consulta]);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return;
    if (abierta && !elemento.open) {
      elemento.showModal();
      setConsulta("");
      setResaltado(0);
      campo.current?.focus();
    }
    if (!abierta && elemento.open) elemento.close();
  }, [abierta]);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    const cancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrar();
    };
    const fuera = (evento: MouseEvent) => {
      if (evento.target === elemento) onCerrar();
    };
    elemento.addEventListener("cancel", cancelar);
    elemento.addEventListener("click", fuera);
    return () => {
      elemento.removeEventListener("cancel", cancelar);
      elemento.removeEventListener("click", fuera);
    };
  }, [onCerrar]);

  useEffect(() => {
    const activo = lista.current?.querySelector<HTMLElement>('[data-resaltado="si"]');
    activo?.scrollIntoView({ block: "nearest" });
  }, [resaltado, resultados]);

  const ejecutar = (comando: Comando | undefined) => {
    if (!comando) return;
    comando.ejecutar();
    onCerrar();
  };

  const alTeclear = (evento: EventoTeclado<HTMLInputElement>) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setResaltado((valor) => (resultados.length ? (valor + 1) % resultados.length : 0));
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setResaltado((valor) =>
        resultados.length ? (valor - 1 + resultados.length) % resultados.length : 0,
      );
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      ejecutar(resultados[resaltado]);
    }
  };

  let familiaPrevia = "";

  return (
    <dialog
      ref={referencia}
      className="comandos"
      aria-label="Paleta de comandos"
    >
      <div className="comandos__marco">
        <div className="comandos__campo">
          <Icono nombre="buscar" tamano={18} />
          <input
            ref={campo}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-activedescendant={
              resultados[resaltado] ? `${idLista}-${resultados[resaltado].id}` : undefined
            }
            aria-autocomplete="list"
            aria-label="Buscar módulos, destinos y apariencia"
            placeholder="Ir a un módulo, una pantalla o cambiar la apariencia"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            onKeyDown={alTeclear}
          />
          <kbd className="comandos__tecla">Esc</kbd>
        </div>

        <ul className="comandos__lista" id={idLista} role="listbox" ref={lista}>
          {resultados.map((comando, indice) => {
            const encabeza = comando.familia !== familiaPrevia;
            familiaPrevia = comando.familia;
            return (
              <li key={comando.id} className="comandos__grupo" role="presentation">
                {encabeza ? (
                  <p className="comandos__familia" aria-hidden="true">
                    {comando.familia}
                  </p>
                ) : null}
                <button
                  type="button"
                  id={`${idLista}-${comando.id}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={indice === resaltado}
                  data-resaltado={indice === resaltado ? "si" : "no"}
                  className="comandos__opcion"
                  onMouseEnter={() => setResaltado(indice)}
                  onClick={() => ejecutar(comando)}
                >
                  <span className="comandos__icono">
                    <Icono nombre={comando.icono} tamano={16} />
                  </span>
                  <span className="comandos__texto">
                    <strong>{comando.etiqueta}</strong>
                    <span>{comando.descripcion}</span>
                  </span>
                  <span className="comandos__contexto mono">{comando.contexto}</span>
                </button>
              </li>
            );
          })}
          {resultados.length === 0 ? (
            <li className="comandos__vacio" role="presentation">Nada coincide con «{consulta}»</li>
          ) : null}
        </ul>

        <p className="comandos__pie mono">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navegar
          </span>
          <span>
            <kbd>↵</kbd> abrir
          </span>
          <span>
            <kbd>Esc</kbd> cerrar
          </span>
        </p>
      </div>
    </dialog>
  );
};
