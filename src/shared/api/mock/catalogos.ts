export type Departamento = {
  codigo: string;
  nombre: string;
  proveedores: number;
  dispensadores: number;
  ips: number;
  medicos: number;
  pacientes: number;
};

export const DEPARTAMENTOS: readonly Departamento[] = [
  { codigo: "05", nombre: "Antioquia", proveedores: 554, dispensadores: 147, ips: 9, medicos: 2588, pacientes: 177751 },
  { codigo: "76", nombre: "Valle del Cauca", proveedores: 465, dispensadores: 137, ips: 11, medicos: 2171, pacientes: 152358 },
  { codigo: "19", nombre: "Cauca", proveedores: 420, dispensadores: 49, ips: 4, medicos: 601, pacientes: 53688 },
  { codigo: "52", nombre: "Nariño", proveedores: 384, dispensadores: 46, ips: 3, medicos: 509, pacientes: 49335 },
  { codigo: "17", nombre: "Caldas", proveedores: 295, dispensadores: 44, ips: 3, medicos: 518, pacientes: 42080 },
  { codigo: "66", nombre: "Risaralda", proveedores: 268, dispensadores: 41, ips: 3, medicos: 451, pacientes: 37727 },
  { codigo: "68", nombre: "Santander", proveedores: 264, dispensadores: 62, ips: 4, medicos: 985, pacientes: 75453 },
  { codigo: "63", nombre: "Quindío", proveedores: 241, dispensadores: 31, ips: 2, medicos: 342, pacientes: 29746 },
  { codigo: "15", nombre: "Boyacá", proveedores: 237, dispensadores: 52, ips: 4, medicos: 718, pacientes: 59492 },
  { codigo: "08", nombre: "Atlántico", proveedores: 206, dispensadores: 98, ips: 7, medicos: 1211, pacientes: 95768 },
  { codigo: "50", nombre: "Meta", proveedores: 201, dispensadores: 36, ips: 3, medicos: 434, pacientes: 35550 },
  { codigo: "41", nombre: "Huila", proveedores: 192, dispensadores: 34, ips: 2, medicos: 401, pacientes: 33374 },
  { codigo: "13", nombre: "Bolívar", proveedores: 179, dispensadores: 40, ips: 2, medicos: 610, pacientes: 45707 },
  { codigo: "73", nombre: "Tolima", proveedores: 174, dispensadores: 67, ips: 4, medicos: 818, pacientes: 69649 },
  { codigo: "25", nombre: "Cundinamarca", proveedores: 161, dispensadores: 168, ips: 8, medicos: 1753, pacientes: 134220 },
  { codigo: "11", nombre: "Bogotá D.C.", proveedores: 85, dispensadores: 224, ips: 14, medicos: 3507, pacientes: 203144 },
  { codigo: "23", nombre: "Córdoba", proveedores: 116, dispensadores: 29, ips: 1, medicos: 317, pacientes: 27570 },
  { codigo: "20", nombre: "Cesar", proveedores: 107, dispensadores: 27, ips: 1, medicos: 284, pacientes: 24667 },
  { codigo: "47", nombre: "Magdalena", proveedores: 98, dispensadores: 25, ips: 1, medicos: 267, pacientes: 23216 },
  { codigo: "54", nombre: "Norte de Santander", proveedores: 94, dispensadores: 32, ips: 2, medicos: 392, pacientes: 31923 },
  { codigo: "70", nombre: "Sucre", proveedores: 76, dispensadores: 18, ips: 1, medicos: 184, pacientes: 15961 },
  { codigo: "44", nombre: "La Guajira", proveedores: 62, dispensadores: 15, ips: 1, medicos: 159, pacientes: 13785 },
  { codigo: "27", nombre: "Chocó", proveedores: 58, dispensadores: 13, ips: 1, medicos: 125, pacientes: 10883 },
  { codigo: "85", nombre: "Casanare", proveedores: 54, dispensadores: 14, ips: 1, medicos: 150, pacientes: 13059 },
  { codigo: "18", nombre: "Caquetá", proveedores: 49, dispensadores: 11, ips: 1, medicos: 117, pacientes: 10157 },
  { codigo: "86", nombre: "Putumayo", proveedores: 45, dispensadores: 10, ips: 1, medicos: 100, pacientes: 8706 },
  { codigo: "81", nombre: "Arauca", proveedores: 36, dispensadores: 8, ips: 1, medicos: 84, pacientes: 7255 },
  { codigo: "99", nombre: "Vichada", proveedores: 23, dispensadores: 6, ips: 1, medicos: 58, pacientes: 5079 },
  { codigo: "95", nombre: "Guaviare", proveedores: 20, dispensadores: 5, ips: 1, medicos: 50, pacientes: 4353 },
  { codigo: "91", nombre: "Amazonas", proveedores: 16, dispensadores: 4, ips: 1, medicos: 42, pacientes: 3628 },
  { codigo: "94", nombre: "Guainía", proveedores: 11, dispensadores: 4, ips: 1, medicos: 29, pacientes: 2539 },
  { codigo: "97", nombre: "Vaupés", proveedores: 9, dispensadores: 3, ips: 1, medicos: 25, pacientes: 2177 },
];

export const TOTALES_NACIONALES = {
  proveedores: 5200,
  dispensadores: 1500,
  ips: 100,
  medicos: 20000,
  pacientes: 1500000,
} as const;

export const ETAPAS_PROCESO = [
  { clave: "cultivo", etiqueta: "Cultivo", valor: 300000, unidad: "plantas en pie", detalle: "1.284 predios con licencia vigente" },
  { clave: "bodega", etiqueta: "Bodega", valor: 150000, unidad: "kg de biomasa", detalle: "Almacenamiento certificado BPM" },
  { clave: "dispensario", etiqueta: "Dispensario", valor: 1200000, unidad: "unidades", detalle: "Producto terminado disponible" },
  { clave: "ips", etiqueta: "IPS", valor: 500000, unidad: "fórmulas", detalle: "Prescripciones activas del período" },
  { clave: "entregado", etiqueta: "Destino", valor: 2000000, unidad: "dosis", detalle: "Droguerías, IPS y pacientes con fórmula" },
] as const;

export const TIPOS_PRODUCTO = [
  "Flor seca no psicoactiva",
  "Flor seca psicoactiva",
  "Biomasa vegetal",
  "Extracto de espectro completo",
  "Aceite estandarizado CBD",
  "Aceite estandarizado THC:CBD",
  "Fórmula magistral",
  "Semilla certificada",
] as const;

export const VARIEDADES = [
  "Charlotte's Angel",
  "ACDC Colombia",
  "Cannatonic CO",
  "Harlequin Andina",
  "Sativa Tolima 04",
  "Índica Cauca 11",
  "Ruderalis Alt-2600",
] as const;

export const ESPECIALIDADES = [
  "Medicina del dolor",
  "Neurología",
  "Oncología",
  "Psiquiatría",
  "Medicina interna",
  "Cuidado paliativo",
  "Reumatología",
  "Neuropediatría",
] as const;

export const DIAGNOSTICOS = [
  { codigo: "G40.9", nombre: "Epilepsia refractaria" },
  { codigo: "M79.7", nombre: "Fibromialgia" },
  { codigo: "G35", nombre: "Esclerosis múltiple" },
  { codigo: "R52.2", nombre: "Dolor crónico no oncológico" },
  { codigo: "C79.9", nombre: "Dolor oncológico" },
  { codigo: "G20", nombre: "Enfermedad de Parkinson" },
  { codigo: "F51.0", nombre: "Insomnio no orgánico" },
] as const;

export const NOMBRES = [
  "María Inés Cardona", "Ricardo Sandoval", "Lida Almeciga", "Flor Castiblanco", "Sebastián Rueda",
  "Jesús Avendaño", "Rubén Eduardo Rodríguez", "Olga Patricia Santander", "Edilma Rodríguez Aparicio",
  "Camilo Andrés Peña", "Diana Marcela Ortiz", "Hernán Darío Gómez", "Luz Adriana Bermúdez",
  "Fabián Alberto Cruz", "Yolanda Restrepo", "Néstor Iván Quintero", "Sandra Milena Chávez",
  "Gustavo Adolfo Mejía", "Paula Andrea Lozano", "Jairo Enrique Villamil", "Claudia Liliana Pardo",
  "Óscar Mauricio Arias", "Nubia Esperanza Rojas", "Álvaro José Betancur",
] as const;

export const RAZONES_SOCIALES = [
  "Cultivos Andinos del Tolima", "Verde Pacífico", "Farmacannabis Colombia", "BioSativa del Cauca",
  "Laboratorios Fitomed", "Agrícola La Esperanza", "Cannalab Antioquia", "Semillas del Quindío",
  "Distrifarma Caribe", "Hacienda El Retiro", "Naturmed Andina", "Extractos del Magdalena",
  "Dispensario Salud Verde", "IPS Alivio Integral", "Clínica del Dolor Bogotá", "Cultivos Altiplano",
  "Bioterapias del Valle", "Fitofarma Santander", "Agroindustrias Cannalia", "Dispensa Vida",
] as const;
