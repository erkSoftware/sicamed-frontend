import { useMemo } from "react";
import qrcode from "qrcode-generator";

type Props = {
  valor: string;
  etiqueta: string;
  tamano?: number;
};

export const CodigoQr = ({ valor, etiqueta, tamano = 200 }: Props) => {
  const modulos = useMemo(() => {
    const codigo = qrcode(0, "M");
    codigo.addData(valor, "Alphanumeric");
    codigo.make();
    const cuenta = codigo.getModuleCount();
    const oscuros: { fila: number; columna: number }[] = [];
    for (let fila = 0; fila < cuenta; fila += 1) {
      for (let columna = 0; columna < cuenta; columna += 1) {
        if (codigo.isDark(fila, columna)) oscuros.push({ fila, columna });
      }
    }
    return { cuenta, oscuros };
  }, [valor]);

  const margen = 2;
  const lado = modulos.cuenta + margen * 2;

  return (
    <svg
      className="codigo-qr"
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${lado} ${lado}`}
      role="img"
      aria-label={etiqueta}
      shapeRendering="crispEdges"
    >
      <rect width={lado} height={lado} fill="var(--qr-fondo)" />
      {modulos.oscuros.map((modulo) => (
        <rect
          key={`${modulo.fila}-${modulo.columna}`}
          x={modulo.columna + margen}
          y={modulo.fila + margen}
          width={1}
          height={1}
          fill="var(--qr-tinta)"
        />
      ))}
    </svg>
  );
};
