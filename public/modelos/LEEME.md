# Modelo de Aurora

`aurora.glb` es el personaje que carga la escena. El archivo actual proviene de Meshy
(`modelo-3d/Meshy_AI_Ivory_Sentinel_0830133107_texture.glb`), 51 018 vértices y tres
texturas de 2048 px.

Requisitos del asset:

- Formato glTF binario (`.glb`), escala en metros, mirando hacia +Z.
- La altura se normaliza sola a 1,72 m y los pies se apoyan en el suelo.

Si el `.glb` ya trae esqueleto humanoide con nombres estándar (Mixamo, VRM o Unity
Humanoid) se usa tal cual:
`Hips`, `Spine`, `Chest`, `Neck`, `Head`, `LeftArm`, `LeftForeArm`, `LeftHand`,
`RightArm`, `RightForeArm`, `RightHand`, `LeftUpLeg`, `LeftLeg`, `RightUpLeg`, `RightLeg`.

Si la malla viene suelta, `autorig.ts` mide la silueta por franjas horizontales, deduce
cuello, hombros, codos, muñecas, entrepierna, rodillas y tobillos, monta ese esqueleto y
calcula los pesos por distancia a cada hueso. Las quince articulaciones de las poses
quedan operativas sin pasar por Blender.

Los morph targets `mouthOpen` y `blink` siguen siendo opcionales: sin ellos el habla y el
parpadeo no se ven, aunque el resto de la animación funciona.

Si el archivo no existe, la escena dibuja la figura procedural de respaldo.
Para apuntar a otra ruta, define `VITE_MODELO_AURORA` en el entorno.
