import type { ReactNode } from "react";

type ConClase = { className?: string };

export const Bulto = ({ className }: ConClase) => (
  <g className={className}>
    <path d="M-14-4v-19a9 9 0 0 1 6-8h16a9 9 0 0 1 6 8v19a4 4 0 0 1-4 4h-20a4 4 0 0 1-4-4z" fill="#D6BC85" />
    <path d="M-8-31q8-6 16 0z" fill="#B99C63" />
    <path d="M-7-32h14v3h-14z" fill="#8A6E3C" />
    <path d="M-14-16h28v6h-28z" fill="#C1A469" />
    <path d="M-5-14h10v7h-10z" fill="#0E5C36" opacity="0.65" />
    <path d="M-14-4v-19a9 9 0 0 1 6-8" fill="none" stroke="#F2E7C7" strokeWidth="1.4" opacity="0.5" />
  </g>
);

export const Caja = ({ className }: ConClase) => (
  <g className={className}>
    <path d="M-17-28h34v28h-34z" fill="#C9A876" />
    <path d="M-17-28h34v7h-34z" fill="#A8874F" />
    <path d="M-2-28h4v28h-4z" fill="#A8874F" opacity="0.8" />
    <image href="/marca/isotipo.svg" x="-8" y="-18" width="16" height="16" />
  </g>
);

export const Contenedor = ({ tono, className }: ConClase & { tono: string }) => (
  <g className={className}>
    <path d="M-28-26h56v26h-56z" fill={tono} />
    <path d="M-28-26h56v4h-56z" fill="#05231A" opacity="0.35" />
    <path d="M-28-8h56v3h-56z" fill="#05231A" opacity="0.25" />
    <path d="M-18-22h36v14h-36z" fill="#EFF4EE" />
    <image href="/marca/isotipo.svg" x="-16" y="-21" width="12" height="12" />
    <path d="M-1-19h15v3h-15zM-1-14h11v3h-11z" fill="#0A4529" />
  </g>
);

export const Frasco = ({ className }: ConClase) => (
  <g className={className}>
    <path d="M-5-20h10v16a5 5 0 0 1-10 0z" fill="#B9E8CB" />
    <path d="M-6-24h12v5h-12z" fill="#8A5A00" />
    <path d="M-5-9h10v5a5 5 0 0 1-10 0z" fill="#35B96A" />
  </g>
);

export const Mata = ({ x, y, e }: { x: number; y: number; e: number }) => (
  <g transform={`translate(${x} ${y}) scale(${e})`}>
    <path d="M0 0v-15" stroke="#0B4A2E" strokeWidth="1.6" />
    <path d="M0-11q-9-2-13-10 9 0 13 6z" fill="#0F6B45" />
    <path d="M0-11q9-2 13-10-9 0-13 6z" fill="#147343" />
    <path d="M0-15q-4-8 0-15 4 7 0 15z" fill="#1E9E52" />
  </g>
);

type PropsPersona = {
  cuerpo: string;
  detalle: string;
  piel: string;
  pelo: string;
  className?: string;
  children?: ReactNode;
};

export const Persona = ({ cuerpo, detalle, piel, pelo, className, children }: PropsPersona) => (
  <g className={className}>
    <ellipse cx="0" cy="2" rx="21" ry="5" fill="#05231A" opacity="0.32" />
    <path d="M-10-48h9l2 42h4v6h-19v-6h4z" fill="#303D35" />
    <path d="M2-48h9l3 42h4v6h-19v-6h4z" fill="#26332B" />
    <path d="M-16-88h32l6 42h-44z" fill={cuerpo} />
    <path d="M-22-58h44l2 12h-48z" fill={detalle} />
    <path d="M-6-92h12v10h-12z" fill={piel} />
    <circle cx="0" cy="-101" r="11" fill={piel} />
    <path d="M-11-103a11 11 0 0 1 22 0q-6-5-11-2-5-3-11 2z" fill={pelo} />
    {children}
  </g>
);

export const Fulgor = ({ x, y }: { x: number; y: number }) => (
  <g className="escena__fulgor">
    <circle cx={x} cy={y} r="26" fill="url(#escena-fulgor)" />
    <circle cx={x} cy={y} r="13" fill="none" stroke="#D9F7A8" strokeWidth="1.4" opacity="0.8" />
    <circle cx={x} cy={y} r="5" fill="#EFFAF3" />
  </g>
);

export const Camion = ({ cargados, ranuras }: { cargados: number; ranuras: readonly { x: number; y: number }[] }) => (
  <g className="escena__camion">
    <ellipse cx="486" cy="446" rx="142" ry="11" fill="#05231A" opacity="0.42" />

    <rect x="374" y="372" width="132" height="30" fill="#0A3A26" />
    <rect x="374" y="372" width="132" height="4" fill="#062A1E" />

    <g className="escena__camion-carga">
      {ranuras.slice(0, cargados).map((sitio) => (
        <g key={`${sitio.x}-${sitio.y}`} transform={`translate(${sitio.x} ${sitio.y})`}>
          <Bulto />
        </g>
      ))}
    </g>

    <rect x="500" y="360" width="10" height="46" fill="#C9D6CB" />
    <rect x="368" y="404" width="238" height="10" rx="2" fill="#1A211C" />

    <rect x="366" y="384" width="140" height="22" rx="2" fill="#EFF4EE" />
    <rect x="366" y="384" width="140" height="3" fill="#C9D6CB" />
    {[404, 440, 476].map((x) => (
      <rect key={x} x={x} y="387" width="2.5" height="19" fill="#DCE4DD" />
    ))}
    <image href="/marca/isotipo.svg" x="370" y="386" width="18" height="18" />
    <text x="393" y="399" className="escena__marca">
      SICAMED
    </text>

    <path d="M508 406v-52q0-10 10-10h50q8 0 11 6l16 30v26z" fill="#EFF4EE" />
    <path d="M518 352h34v24h-34z" fill="#2C4A3C" />
    <path d="M560 352h10l14 24h-24z" fill="#2C4A3C" />
    <path d="M512 348h-9v11h3.5v-7.5h5.5z" fill="#35403A" />
    <rect x="508" y="386" width="84" height="10" fill="#147343" />
    <path d="M556 378v28" stroke="#C2CDC4" strokeWidth="1.6" />
    <rect x="540" y="381" width="9" height="3" rx="1.5" fill="#8B958E" />
    <rect x="584" y="372" width="9" height="9" rx="2" fill="#F3D68B" />
    <rect x="582" y="397" width="20" height="9" rx="2" fill="#C9D6CB" />

    <g className="escena__rueda">
      <circle cx="408" cy="425" r="22" fill="#131A16" />
      <circle cx="408" cy="425" r="10" fill="#3A443D" />
      <circle cx="408" cy="425" r="10" fill="none" stroke="#8B958E" strokeWidth="4" strokeDasharray="7 7" />
      <circle cx="558" cy="425" r="22" fill="#131A16" />
      <circle cx="558" cy="425" r="10" fill="#3A443D" />
      <circle cx="558" cy="425" r="10" fill="none" stroke="#8B958E" strokeWidth="4" strokeDasharray="7 7" />
    </g>
  </g>
);
