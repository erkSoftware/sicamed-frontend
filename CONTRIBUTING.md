# Cómo contribuir a `sicamed-frontend`

Aplican íntegramente las reglas de desarrollo del §8.6 del Blueprint SICAMED v1.1.

## R1 — Sin comentarios en el código

**No se escriben comentarios en ninguna parte del repositorio.** Ni en `src/`, ni en los archivos de configuración, ni en el HTML.

El código se explica con nombres. Si un fragmento necesita un comentario para entenderse, necesita otro nombre o necesita extraerse a una función con nombre propio. La documentación va en Markdown, no en el código.

## R2 — La carpeta `decisiones/` está en `.gitignore`

Las decisiones de arquitectura se sincronizan al repositorio de documentación. Ver `decisiones/README.md`.

## R3 — Convenciones de nombrado

- Todo el código de dominio se nombra en español: `atestacion`, `cultivo`, `lote`, `oferta`.
- Componentes en `PascalCase`, hooks en `useCamelCase`, todo lo demás en `camelCase`.
- Los archivos de componente llevan el nombre del componente.

## R4 — Conventional Commits

```
feat(vitrina): rechazo normativo con cita de la norma
fix(clinico): limpiar el cache al desmontar el modulo
chore(contratos): fijar vitrina en v1.9.0
```

## Antes de abrir un PR

```
npm run check
```

Ejecuta tipos, lint, fronteras y pruebas. Debe salir en verde.

## Definición de terminado

Ningún PR se aprueba sin esto:

- [ ] `npm run check` en verde: tipos, lint, fronteras, tests
- [ ] Cero violaciones de `axe` críticas o serias
- [ ] Navegable completo por teclado, con foco visible
- [ ] Cero comentarios en el código
- [ ] Sin `any`, sin `@ts-ignore` nuevos sin justificar en el PR
- [ ] Si consume un endpoint nuevo: cliente regenerado, no escrito a mano
- [ ] Si muestra un error del backend: usa `ErrorNormativo` y muestra la cita
- [ ] Si añade una ruta: declara su permiso y su zona
- [ ] Si toca `features-salud/`: revisado contra los seis controles del §3 de la guía
- [ ] Estados de carga, error y vacío implementados
- [ ] PR menor a 400 líneas modificadas
- [ ] Un aprobador. **Dos** para `features-salud/`, `shared/auth/` y `publico/`

## Los cinco errores que matarían este frontend

| # | Error | Cómo se detecta |
|---|---|---|
| 1 | Un `QueryClient` único para las dos zonas | Revisión de `src/app/providers/clientesConsulta.ts` |
| 2 | Token o dato clínico en almacenamiento local | Regla de ESLint en `features-salud/` + prueba E2E |
| 3 | Reimplementar una regla de negocio en el cliente | Revisión |
| 4 | Cliente HTTP escrito a mano | Ausencia de `generado/` en el PR |
| 5 | `publico/` importando código autenticado | ESLint `no-restricted-imports` |

El error 1 es el más peligroso porque no produce ningún síntoma visible.
