# 🗡️ El Último Cazador

> *Plata para los muertos. Acero para los hombres.*

Juego web indie en **3D** hecho con **JavaScript** y **Three.js**: exploración tipo **plataformas de desplazamiento lateral** y **batallas por turnos** con cámara cinematográfica al tocar a un enemigo. Ambientación de fantasía oscura: luna, niebla, hogueras, no-muertos y caballeros corrompidos por la ceniza.

| | |
|---|---|
| 🎮 **Jugar en línea** | *Próximamente (subdominio en Hostinger)* |
| 📦 **Repositorio** | https://github.com/ElJavierB0/el-ultimo-cazador |
| 📋 **Tablero de tareas** | GitHub Projects → pestaña *Projects* del repositorio |
| 📄 **Licencia** | [MIT](LICENSE): código libre · modelos 3D CC0 |

---

## 📌 Propuesta

### Concepto
Hace un siglo, la **Orden del Cuervo** protegía el reino de Velmora de las bestias que nacen de la niebla. La orden cayó y solo queda uno: **Kaelen, el último cazador**. Una ceniza negra cae desde el castillo del norte: donde toca, los muertos se levantan y los hombres se corrompen. El jugador recorre tres regiones, combate por turnos y derrota a los tres guardianes para liberar al reino.

### Ficha
| Elemento | Descripción |
|---|---|
| **Género** | Plataformas 2.5D (3D con movimiento lateral) + RPG por turnos |
| **Estilo** | 3D estilizado de fantasía oscura: iluminación nocturna, sombras, niebla, bloom y partículas |
| **Público objetivo** | Jugadores de 12 años en adelante, casuales. Partidas de 10 a 20 minutos |
| **Plataforma** | Web (escritorio y celular, con controles táctiles) |
| **Tecnología** | JavaScript (ES Modules), Three.js (WebGL), HTML/CSS para la interfaz, Web Audio API |
| **Inspiración** | Plataformas clásicos y combates por turnos de los RPG, en un mundo oscuro de cazadores de monstruos |

### Mecánicas principales
1. **Exploración:** correr, saltar con salto variable, recoger monedas y pociones, y encender hogueras (puntos de control que curan).
2. **Batalla por turnos:** al tocar a un enemigo, la cámara pasa a una toma cinematográfica frente a frente:
   - **ESPADA → Acero** (eficaz contra humanos) o **Plata** (eficaz contra no-muertos y criaturas arcanas).
   - **SEÑAL → Ascua** (bola de fuego que ignora defensa y quema) o **Égida** (escudo que reduce el daño a la mitad). Las señales gastan **vigor** (máximo 3, se recupera 1 por turno).
   - **POCIÓN:** cura el 50 % de los PV. **HUIR:** 70 % de probabilidad (no funciona contra guardianes).
3. **Progresión:** experiencia → nivel del cazador (+PV, +ataque). Cada nivel completado desbloquea una **vestimenta** (+defensa y nuevos colores del cazador).
4. **Medallón:** vibra cuando hay un enemigo cerca y en batalla indica su tipo.
5. **Vidas:** 3. Se pierde una al caer al vacío o al agua, o al ser derrotado. Reapareces en la última hoguera.

### Niveles y enemigos (ninguno se repite)
| # | Nivel | Enemigos | Guardián | Música |
|---|---|---|---|---|
| 1 | Bosque de Velmora | Bandido, Saqueador | **Caballero Caído** | Tema del bosque (La menor) |
| 2 | Pantano de Bruma | Esqueleto Errante, Asesino Óseo | **Bruja del Pantano** | Tema del pantano (Re menor, lento) |
| 3 | Castillo de Ceniza | Hechicero Esquelético | **Señor de la Ceniza** | Tema del castillo (Mi frigio) |

### Puntaje (cálculo por eventos)
| Evento | Puntos |
|---|---|
| Moneda | +10 |
| Poción recogida | +25 |
| Hoguera encendida | +50 |
| Golpe certero (arma correcta) | +10 |
| Golpe crítico | +15 |
| Enemigo derrotado | +100 a +220 (guardianes: +1000 / +1500 / +2500) |
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
| Confirmar | Enter / Z | A (o tocar el botón del menú) |
| Regresar | Esc / X | B |
| Pausa | P / Esc | II |
| Sonido on/off | M | — |

---

## 🧱 Estructura y arquitectura (POO)

```
├── index.html              # Página, interfaz HTML (HUD, batalla, pantallas) e importmap de Three.js
├── css/style.css           # Estilo de la interfaz (paneles de fantasía oscura) y controles táctiles
├── assets/models/          # Modelos 3D optimizados (.glb): personajes y escenografía (KayKit, CC0)
└── js/
    ├── main.js             # Carga modelos y arranca el juego
    ├── core/               # Game (bucle y escenas), Input (teclado/táctil), AudioManager (música y efectos)
    ├── three/              # Engine (render + bloom), assets (carga y paletas oscuras), Actor (animaciones)
    ├── world/              # Level (datos y colisiones) y World3D (construye el escenario 3D)
    ├── entities/           # Entity → Player, Enemy (física y comportamiento)
    ├── systems/            # ScoreSystem (puntaje), Hunter (estadísticas del cazador)
    ├── scenes/             # Title, Story, Platform, Battle, LevelClear, GameOver, Victory, Credits, HowTo
    ├── ui/                 # Utilidades de la interfaz HTML
    └── data/               # Niveles, bestiario, historia y créditos
```

- **Lógica y render separados:** la física corre en 2D (colisiones AABB contra una cuadrícula) y los modelos 3D solo copian la posición. Así el juego es preciso como un plataformas clásico pero se ve en 3D.
- **Bucle de paso fijo** (60 actualizaciones/s) para la lógica y render en cada cuadro.
- **Herencia:** `Entity` → `Player` / `Enemy`. **Composición:** cada entidad tiene un `Actor` 3D con su `AnimationMixer`.
- **Batalla asíncrona:** cada turno es una secuencia `async/await` (mensaje → animación → daño → turno enemigo).
- **Paletas oscuras por código:** al cargar un modelo, su textura se recolorea (tono, saturación y luz) para que cada personaje tenga un aspecto propio.
- **Modelos optimizados:** los personajes comparten animaciones y se comprimen con meshopt (de 36 MB a 3.5 MB).
- **Audio 100 % sintetizado** con Web Audio API (6 pistas y más de 20 efectos).

---

## ▶️ Ejecutar localmente

El juego usa módulos ES y carga modelos, así que necesita un servidor local (no funciona abriendo el archivo directamente):

```bash
git clone https://github.com/ElJavierB0/el-ultimo-cazador.git
cd el-ultimo-cazador
python3 -m http.server 8000     # o: npx serve
```

Abre http://localhost:8000 en un navegador moderno (Chrome, Edge, Firefox o Safari).

## 🌐 Despliegue

Es un sitio estático: basta con subir el contenido del repositorio a la carpeta pública del subdominio en Hostinger (`public_html/<subdominio>`). No requiere compilación ni base de datos. Three.js se carga desde su CDN.

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

- Modelos 3D y animaciones: [KayKit](https://kaylousberg.com) por Kay Lousberg, paquetes *Adventurers*, *Skeletons*, *Halloween Bits* y *Dungeon Remastered* ([CC0](https://creativecommons.org/publicdomain/zero/1.0/)). Recoloreados y optimizados para este juego.
- Motor 3D: [Three.js](https://threejs.org) (MIT).
- Tipografías [Cinzel](https://fonts.google.com/specimen/Cinzel) y [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License).
- Música y efectos de sonido: originales, sintetizados por código.
