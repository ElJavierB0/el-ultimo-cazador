# Guion del video explicativo del código (3 a 5 minutos)

> Graba la pantalla con OBS Studio, la herramienta de captura de macOS (Cmd + Shift + 5) o la Xbox Game Bar en Windows.
> Ten abiertos el juego (`python3 -m http.server 8000`) y VS Code con el proyecto.

## 0:00 – 0:20 · Presentación
- "Hola, soy Javier Romo. Este es **El Último Cazador**, un juego web en 3D hecho con JavaScript y Three.js."
- Muestra la pantalla de título con el cazador junto a la hoguera.

## 0:20 – 0:50 · Demo rápida
- Juega unos segundos: correr, saltar, recoger monedas y encender una hoguera.
- Toca a un enemigo para que la cámara pase a la batalla. Usa ACERO o PLATA y muestra el mensaje "¡Es un golpe certero!".

## 0:50 – 1:30 · Estructura del proyecto
- Abre el árbol de carpetas en VS Code:
  - `core/`: el bucle del juego, la entrada y el audio.
  - `three/`: el motor 3D (render, bloom, carga de modelos y animaciones).
  - `world/` y `entities/`: el nivel, la física y los personajes.
  - `scenes/`: cada pantalla del juego es una clase.
  - `data/`: niveles, enemigos e historia separados de la lógica.

## 1:30 – 2:10 · Lógica 2D, imagen 3D (`PlatformScene.js`)
- "La física corre en 2D, sobre una cuadrícula de tiles, como un plataformas clásico."
- Señala `syncActors()`: "Cada cuadro copio la posición lógica al modelo 3D con `toWorld()` y elijo su animación: correr, saltar, reposo."

## 2:10 – 2:50 · POO y colisiones (`Entity.js`, `Actor.js`)
- "Entity es la clase base: gravedad y `moveAndCollide()`, que resuelve colisiones moviendo primero en X y luego en Y."
- "Player y Enemy heredan de Entity. Cada uno tiene un Actor: el modelo 3D con su AnimationMixer."
- En `assets.js`, muestra `recolor()`: "Cada personaje recibe una paleta oscura propia al cargar su textura."

## 2:50 – 3:40 · Batalla por turnos (`BattleScene.js`)
- Señala `runTurn()`: "El turno es una secuencia async/await: primero actúa el jugador y luego el enemigo."
- Señala `calcDamage()` y la tabla `EFFECTIVENESS` en `bestiary.js`: "El acero es eficaz contra humanos y la plata contra no-muertos."
- Muestra `fireball()`: "La señal Ascua crea una esfera con luz propia que viaja hasta el enemigo."

## 3:40 – 4:10 · Puntaje y audio
- `ScoreSystem.js`: "El puntaje se calcula por eventos: moneda +10, enemigo +100, bono de tiempo, etc."
- `AudioManager.js`: "No hay archivos de audio. La música y los efectos se sintetizan con Web Audio API."

## 4:10 – 4:30 · Cierre
- "El código es libre con licencia MIT; los modelos son de KayKit con licencia CC0. Gracias."
