# 🗡️ El Último Cazador

> *Plata para las bestias. Acero para los hombres.*

Juego web indie minimalista hecho con **JavaScript puro** (sin motores ni librerías): exploración tipo **plataformas 2D** y **batallas por turnos** al tocar a un monstruo. Todo el pixel art y el audio se generan con código.

| | |
|---|---|
| 🎮 **Jugar en línea** | *Próximamente (subdominio en Hostinger)* |
| 📦 **Repositorio** | https://github.com/ElJavierB0/el-ultimo-cazador |
| 📋 **Tablero de tareas** | GitHub Projects → pestaña *Projects* del repositorio |
| 📄 **Licencia** | [MIT](LICENSE): código libre |

---

## 📌 Propuesta

### Concepto
Hace un siglo, la **Orden del Cuervo** protegía el reino de Velmora de las bestias que nacen de la niebla. La orden cayó y solo queda uno: **Kaelen, el último cazador**. Una ceniza negra cae desde el castillo del norte y los monstruos volvieron a los caminos. El jugador recorre tres regiones, combate monstruos por turnos y derrota a los tres guardianes para liberar al reino.

### Ficha
| Elemento | Descripción |
|---|---|
| **Género** | Plataformas 2D + RPG por turnos (híbrido) |
| **Estilo** | Pixel art minimalista, fantasía oscura |
| **Público objetivo** | Jugadores de 12 años en adelante, casuales y fans de lo retro. Partidas de 10 a 20 minutos |
| **Plataforma** | Web (escritorio y celular, con controles táctiles) |
| **Tecnología** | HTML5 Canvas, JavaScript ES Modules, Web Audio API |
| **Inspiración** | Plataformas clásicos de 8/16 bits y combates por turnos de los RPG de bolsillo, ambientado en una fantasía oscura de cazadores de monstruos |

### Mecánicas principales
1. **Exploración (plataformas):** correr, saltar con salto variable, recoger monedas y pociones, y encender hogueras (puntos de control que curan).
2. **Batalla por turnos:** al tocar a un monstruo cambia la pantalla a un combate con menú:
   - **ESPADA → Acero** (eficaz contra humanos) o **Plata** (eficaz contra monstruos y espectros).
   - **SEÑAL → Ascua** (fuego que ignora defensa y quema) o **Égida** (escudo que reduce el daño a la mitad). Las señales gastan **vigor** (máximo 3, se recupera 1 por turno).
   - **POCIÓN:** cura el 50 % de los PV.
   - **HUIR:** 70 % de probabilidad (no funciona contra jefes).
3. **Progresión:** experiencia → nivel del cazador (+PV, +ataque). Al terminar cada nivel se desbloquea una **vestimenta** nueva (+defensa).
4. **Medallón:** el ícono del HUD vibra cuando hay un monstruo cerca y en batalla indica su tipo.
5. **Vidas:** 3 vidas. Se pierde una al caer al vacío o al agua, o al ser derrotado en batalla. Reapareces en la última hoguera.

### Niveles
| # | Nivel | Enemigos | Jefe | Música |
|---|---|---|---|---|
| 1 | Bosque de Velmora | Bandido, Lobo | **Huargo Alfa** | Tema del bosque (La menor) |
| 2 | Pantano de Bruma | Lodoso, Bandido, Espectro | **Bruja del Pantano** | Tema del pantano (Re menor, lento) |
| 3 | Castillo de Ceniza | Bandido, Lodoso, Espectro | **Señor de la Ceniza** | Tema del castillo (Mi frigio) |

### Puntaje (cálculo por eventos)
| Evento | Puntos |
|---|---|
| Moneda | +10 |
| Poción recogida | +25 |
| Hoguera encendida | +50 |
| Golpe certero (arma correcta) | +10 |
| Golpe crítico | +15 |
| Monstruo derrotado | +100 a +200 (jefes: +1000 / +1500 / +2500) |
| Batalla sin recibir daño | +50 |
| Nivel completado | +500 |
| Bono de tiempo | (240 − segundos) × 5 |
| Vidas al terminar el juego | +1000 por vida |
| Huir | −25 |
| Perder una vida | −200 |

El récord se guarda en el navegador (`localStorage`).

---

## 🎮 Controles

| Acción | Teclado | Celular |
|---|---|---|
| Moverse | ← → / A D | Cruceta |
| Saltar | Espacio / ↑ / W | ▲ |
| Confirmar | Enter / Z | A |
| Regresar | Esc / X | B |
| Pausa | P / Esc | II |
| Sonido on/off | M | — |

---

## 🧱 Estructura y arquitectura (POO)

```
├── index.html            # Página del juego y controles táctiles
├── css/style.css         # Escalado pixel-perfect y controles
├── assets/icon.svg       # Ícono
└── js/
    ├── main.js           # Punto de entrada
    ├── core/             # Game (game loop), Input, AudioManager
    ├── entities/         # Entity → Player, Enemy (herencia)
    ├── world/Level.js    # Mapa de tiles, colisiones y objetos
    ├── systems/          # ScoreSystem (puntaje), Hunter (estadísticas)
    ├── scenes/           # Title, Story, Platform, Battle, LevelClear, GameOver, Victory, Credits, HowTo
    ├── gfx/              # Sprites (pixel art en texto) y utilidades de dibujo
    └── data/             # Niveles, bestiario, historia y créditos
```

- **Game loop de paso fijo** (60 actualizaciones/s) independiente de los FPS.
- **Escenas** con interfaz común (`enter`, `update`, `draw`) y transiciones con fundido.
- **Herencia:** `Entity` tiene la física y las colisiones AABB contra tiles; `Player` y `Enemy` extienden su comportamiento.
- **Datos separados de la lógica:** niveles, monstruos y textos se editan en `js/data/` sin tocar el motor.
- **Cola de pasos en batalla:** cada turno genera mensajes, animaciones y acciones que se reproducen en orden.
- **Audio 100 % sintetizado:** secuenciador con planificación anticipada (Web Audio API), 6 pistas y más de 20 efectos.

---

## ▶️ Ejecutar localmente

El juego usa módulos ES, así que necesita un servidor local (no funciona abriendo el archivo directamente):

```bash
git clone https://github.com/ElJavierB0/el-ultimo-cazador.git
cd el-ultimo-cazador
python3 -m http.server 8000     # o: npx serve
```

Abre http://localhost:8000 en el navegador.

## 🌐 Despliegue

Es un sitio estático: basta con subir el contenido del repositorio a la carpeta pública del subdominio en Hostinger (`public_html/<subdominio>`). No requiere compilación ni base de datos.

---

## 🗺️ Plan de trabajo

| Actividad | Entrega | Estado |
|---|---|---|
| **Act 1:** Propuesta | Repositorio, README, juego jugable, GDD, documento técnico, tablero de tarjetas | ✅ |
| **Act 2:** POO / Beta | Tienda (transacciones), guardado, manual de usuario, reporte de pruebas beta, PRs por integrante | ⏳ |
| **Act 3:** Liberación | Release `v1.0.0`, despliegue en Hostinger, capturas, empaque, créditos con fotos, videos | ⏳ |

Flujo Git: rama `main` estable y ramas `feature/<tarea>` por tarjeta, integradas con *Pull Request* revisado por el otro integrante.

---

## 👥 Equipo

| Integrante | Rol | GitHub |
|---|---|---|
| Javier Antonio Romo Bernal | Programación, audio y diseño de niveles | [@ElJavierB0](https://github.com/ElJavierB0) |
| Guadalupe | Diseño de juego, documentación y pruebas | [@Guadalupe-16](https://github.com/Guadalupe-16) |

**Materia:** Creación de Videojuegos · Desarrollo y Gestión de Software Multiplataforma

## 🙏 Créditos

- Tipografía [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) de CodeMan38 (SIL Open Font License).
- Pixel art, música y efectos de sonido: originales, generados por código.
