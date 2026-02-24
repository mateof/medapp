# MedApp

**[Acceder a la aplicación](https://mateof.github.io/medapp/)**

Aplicación web progresiva (PWA) para la gestión personal de medicamentos, interacciones farmacológicas y contraindicaciones. Los datos se almacenan localmente en el navegador mediante IndexedDB, sin necesidad de servidor ni cuenta externa.

## Propósito

MedApp nace para resolver un problema común: llevar un control organizado de los medicamentos que toma una persona y detectar posibles interacciones entre ellos. Resulta especialmente útil para personas polimedicadas, cuidadores o profesionales sanitarios que quieran una herramienta rápida y privada.

## Funcionalidades

- **Búsqueda de medicamentos** a través de la API de CIMA (AEMPS), la base de datos oficial de medicamentos en España
- **Registro de medicamentos** con información detallada: composición, laboratorio, prospecto, principios activos, etc.
- **Detección de interacciones** entre medicamentos mediante inteligencia artificial (Google Gemini), incluyendo niveles de gravedad
- **Contraindicaciones** según enfermedades o condiciones del paciente
- **Dashboard** con estadísticas: medicamentos por enfermedad, actividad reciente, gráficos de evolución
- **Etiquetas** para clasificar medicamentos por enfermedad o síntoma
- **Sistema multiusuario** con PIN de acceso, avatares y datos aislados por usuario
- **Exportar/Importar** datos entre navegadores o dispositivos mediante archivos JSON
- **PWA**: instalable en móvil o escritorio, funciona offline tras la primera carga

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | Vue 3.5 (Composition API, `<script setup>`) |
| UI | Vuetify 3.7 + Material Design Icons |
| Estado | Pinia |
| Base de datos | Dexie 3 (IndexedDB) |
| IA | Google Gemini API |
| Build | Vite 6 |
| PWA | vite-plugin-pwa (Workbox) |
| Gráficos | Chart.js + vue-chartjs |
| API medicamentos | CIMA (AEMPS) |

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`. El servidor de desarrollo incluye un proxy para las peticiones a la API de CIMA.

## Build de producción

```bash
npm run build
```

Los archivos se generan en `dist/`. Para servir el build localmente:

```bash
npx serve dist
```

## Configuración de IA

Para habilitar la detección automática de interacciones:

1. Obtener una API key gratuita en [Google AI Studio](https://aistudio.google.com)
2. Ir a **Ajustes** dentro de la app
3. Pegar la API key y guardar

La key se cifra localmente con el PIN del usuario (AES-256-GCM) y nunca sale del navegador.

## Estructura del proyecto

```
src/
  layouts/          # Layout principal, header y sidebar
  views/
    auth/           # Login y registro de usuarios
    inicio/         # Lista de medicamentos (pantalla principal)
    pages/          # Nuevo medicamento, ajustes
    farmacos/       # Detalles de medicamento
    dashboard/      # Dashboard con estadísticas
  services/
    ai/             # Integración con Gemini
    storage/        # CRUD IndexedDB (store, users, backup)
    crypto.js       # Cifrado AES-256-GCM / fallback XOR
    db.js           # Schema Dexie y migraciones
  stores/           # Pinia (estado UI y sesión)
  router/           # Rutas y navigation guard
```

## Privacidad

Todos los datos (medicamentos, interacciones, ajustes, API keys) se almacenan exclusivamente en el navegador del usuario. No se envía información a ningún servidor propio. Las únicas peticiones externas son:

- **CIMA (AEMPS)**: para buscar información de medicamentos
- **Google Gemini**: para analizar interacciones (solo si el usuario configura su propia API key)

## Licencia

[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)
