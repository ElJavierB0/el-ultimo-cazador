# Guion del video explicativo del código (3 a 5 minutos)

> Graba la pantalla con OBS Studio, la herramienta de captura de macOS (Cmd + Shift + 5) o la Xbox Game Bar en Windows.
> Ten abiertos el juego (`python3 -m http.server 8000`) y VS Code con el proyecto.

## 0:00 – 0:20 · Presentación
- "Hola, soy Javier Romo. Este es **El Último Cazador**, un juego web indie hecho con JavaScript puro, sin motores ni librerías."
- Muestra la pantalla de título y menciona el repositorio en GitHub.

## 0:20 – 0:50 · Demo rápida
- Juega unos segundos: correr, saltar, recoger monedas y encender una hoguera.
- Toca un monstruo para que inicie la batalla. Usa ACERO o PLATA y muestra el mensaje "¡Es un golpe certero!".

## 0:50 – 1:30 · Estructura del proyecto
- Abre el árbol de carpetas en VS Code:
  - `core/`: el motor (`Game`, `Input`, `AudioManager`).
  - `entities/`: `Entity`, `Player` y `Enemy`.
  - `scenes/`: cada pantalla del juego es una clase.
  - `data/`: niveles, monstruos e historia separados de la lógica.
- "Usé módulos ES, por eso el juego necesita un servidor local."

## 1:30 – 2:10 · Game loop (`js/core/Game.js`)
- Señala `start()`: "El ciclo usa paso fijo de 1/60 s. Así la física se comporta igual sin importar los FPS."
- Señala `changeScene()`: "Las escenas cambian con un fundido a negro."

## 2:10 – 2:50 · POO y colisiones (`js/entities/Entity.js`)
- "Entity es la clase base: posición, velocidad, gravedad y `moveAndCollide()`, que resuelve colisiones contra los tiles moviendo primero en X y luego en Y."
- "Player hereda de Entity y agrega el salto con *coyote time*. Enemy patrulla y da la vuelta en las orillas."

## 2:50 – 3:40 · Batalla por turnos (`js/scenes/BattleScene.js`)
- Señala `executeTurn()`: "Primero actúa el jugador y luego el monstruo."
- Señala `calcDamage()` y la tabla `EFFECTIVENESS` en `bestiary.js`: "El acero es eficaz contra humanos y la plata contra monstruos."
- "Cada acción se agrega a una cola de pasos (mensaje, animación o función) que se reproduce en orden."

## 3:40 – 4:10 · Puntaje y audio
- `ScoreSystem.js`: "El puntaje se calcula por eventos: moneda +10, monstruo +100, bono de tiempo, etc."
- `AudioManager.js`: "No hay archivos de audio. La música y los efectos se sintetizan con Web Audio API."
- Opcional: muestra un sprite en `sprites.js`: "El pixel art está escrito como texto, una letra por color."

## 4:10 – 4:30 · Cierre
- "El código es libre con licencia MIT y está en GitHub. Gracias."
