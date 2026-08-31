import { useEffect, useState } from "react";
import { Dialogo } from "../primitivos/Dialogo";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import {
  claseDeVista,
  extensionDe,
  motivoSinVista,
  pesoLegible,
} from "../../../features/expedientes/soportes";

export type ArchivoVisible = {
  id: string;
  titulo: string;
  nombre: string;
  url: string;
  mime: string;
  bytes: number;
  cargando?: boolean;
};

type Props = {
  abierto: boolean;
  archivos: readonly ArchivoVisible[];
  indice: number;
  onIndice: (indice: number) => void;
  onCerrar: () => void;
};

const Descarga = ({ archivo, bloque }: { archivo: ArchivoVisible; bloque?: boolean }) => (
  <a
    className={`boton boton--secundario${bloque ? " boton--bloque" : ""}`}
    href={archivo.url}
    download={archivo.nombre}
    target="_blank"
    rel="noreferrer"
  >
    <Icono nombre="descargar" tamano={17} />
    Descargar
  </a>
);

const SinVista = ({ archivo, motivo }: { archivo: ArchivoVisible; motivo: string }) => (
  <div className="visor__aviso">
    <Icono nombre="documento" tamano={40} />
    <p className="visor__motivo">{motivo}</p>
    <p className="visor__pista">
      Descárgalo para abrirlo con el programa que le corresponde. El archivo no se altera al pasar
      por aquí.
    </p>
    {archivo.url ? <Descarga archivo={archivo} /> : null}
  </div>
);

const Lienzo = ({ archivo }: { archivo: ArchivoVisible }) => {
  const [ampliada, setAmpliada] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setAmpliada(false);
    setFallo(false);
  }, [archivo.id]);

  if (archivo.cargando) {
    return (
      <div className="visor__aviso">
        <span className="girador" style={{ width: 22, height: 22 }} />
        <p className="visor__pista">Pidiendo el archivo al servidor…</p>
      </div>
    );
  }

  if (archivo.url === "") {
    return (
      <div className="visor__aviso">
        <Icono nombre="alerta" tamano={40} />
        <p className="visor__motivo">El servidor no publicó una dirección para este soporte.</p>
        <p className="visor__pista">
          La solicitud lo declara, pero el archivo no llegó a subirse o el almacenamiento todavía no
          lo expone. El identificador del soporte es <span className="mono">{archivo.id}</span>.
        </p>
      </div>
    );
  }

  const clase = claseDeVista(archivo.nombre, archivo.mime);

  if (clase === "imagen" && !fallo) {
    return (
      <div className={ampliada ? "visor__lienzo visor__lienzo--ampliada" : "visor__lienzo"}>
        <button
          type="button"
          className="visor__zoom"
          aria-label={ampliada ? "Ajustar la imagen a la ventana" : "Ampliar la imagen"}
          onClick={() => setAmpliada((valor) => !valor)}
        >
          <img src={archivo.url} alt={archivo.titulo} onError={() => setFallo(true)} />
        </button>
      </div>
    );
  }

  if (clase === "pdf" && !fallo) {
    return (
      <object className="visor__pdf" data={archivo.url} type="application/pdf" aria-label={archivo.titulo}>
        <SinVista
          archivo={archivo}
          motivo="Este navegador no trae lector de PDF incorporado."
        />
      </object>
    );
  }

  return <SinVista archivo={archivo} motivo={motivoSinVista(archivo.nombre, archivo.mime)} />;
};

export const VisorDeArchivo = ({ abierto, archivos, indice, onIndice, onCerrar }: Props) => {
  const archivo = archivos[indice];

  useEffect(() => {
    if (!abierto || archivos.length < 2) return undefined;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "ArrowLeft" && indice > 0) onIndice(indice - 1);
      if (evento.key === "ArrowRight" && indice < archivos.length - 1) onIndice(indice + 1);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, archivos.length, indice, onIndice]);

  if (!abierto || !archivo) return null;

  const peso = pesoLegible(archivo.bytes);
  const extension = extensionDe(archivo.nombre);

  return (
    <Dialogo
      abierto={abierto}
      titulo={archivo.titulo}
      onCerrar={onCerrar}
      clase="dialogo--pantalla"
      pie={
        <div className="visor__pie">
          <span className="visor__ficha">
            <span className="mono">{archivo.nombre}</span>
            {peso ? <span className="visor__meta">{peso}</span> : null}
            {extension ? <span className="visor__meta">{extension.toUpperCase()}</span> : null}
          </span>
          {archivos.length > 1 ? (
            <span className="visor__pasos">
              <Boton
                variante="fantasma"
                tamano="sm"
                aria-label="Archivo anterior"
                disabled={indice === 0}
                onClick={() => onIndice(indice - 1)}
              >
                ‹
              </Boton>
              <span className="visor__meta">
                {indice + 1} de {archivos.length}
              </span>
              <Boton
                variante="fantasma"
                tamano="sm"
                aria-label="Archivo siguiente"
                disabled={indice === archivos.length - 1}
                onClick={() => onIndice(indice + 1)}
              >
                ›
              </Boton>
            </span>
          ) : null}
          {archivo.url ? <Descarga archivo={archivo} /> : null}
        </div>
      }
    >
      <Lienzo archivo={archivo} />
    </Dialogo>
  );
};
