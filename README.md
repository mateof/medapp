# MedApp

**[Acceder a la aplicación](https://mateof.github.io/medapp/)**

Aplicación web progresiva (PWA) para la gestión personal de medicamentos, posología, interacciones farmacológicas y contraindicaciones. Podrás gestionar **tus medicamentos**, el de tus **familiares** o el de tus **mascotas**. Los datos se almacenan localmente en el navegador mediante IndexedDB, sin necesidad de servidor ni cuenta externa.

### Humanos

<img width="4424" height="1942" alt="image" src="https://github.com/user-attachments/assets/29187a27-6251-4143-bbcd-f83bffe03bbf" />

### Mascota

#### Perfil

<img width="2213" height="1165" alt="image" src="https://github.com/user-attachments/assets/c5085595-11b2-4df1-92d1-04ee6c57b375" />

#### Resultado de análisis de medicación

<img width="2215" height="985" alt="image" src="https://github.com/user-attachments/assets/9c8839dc-f2e0-4292-9c0b-1e039d7749cd" />


## Propósito

MedApp nace para resolver un problema común: llevar un control organizado de los medicamentos que toma una persona y detectar posibles interacciones entre ellos. Resulta especialmente útil para personas polimedicadas, cuidadores o profesionales sanitarios que quieran una herramienta rápida y privada.

## Funcionalidades

- **Búsqueda de medicamentos** a través de la API de CIMA (AEMPS), la base de datos oficial de medicamentos en España
- **Medicamentos veterinarios**: búsqueda en CIMAVet (AEMPS) para perros, gatos, aves, conejos y más
- **Registro de medicamentos** con información detallada: composición, laboratorio, prospecto, principios activos, etc.
- **Posología**: registro de dosis, frecuencia, duración y notas al añadir un medicamento
- **Perfil de salud**: edad, peso, género, enfermedades crónicas, alergias y peculiaridades del paciente
- **Detección de interacciones** entre medicamentos mediante inteligencia artificial, incluyendo niveles de gravedad y análisis de posología
- **Múltiples proveedores de IA**: Google Gemini, OpenAI, Anthropic (Claude), GitHub Copilot, xAI (Grok), DeepSeek, OpenRouter y servidores locales (Ollama, LM Studio, etc.)
- **API keys compartidas**: posibilidad de compartir una API key entre todos los usuarios de la misma instalación
- **Contraindicaciones** según enfermedades, alergias o condiciones del paciente
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
| IA | Google Gemini, OpenAI, Anthropic, OpenRouter y más |
| Build | Vite 6 |
| PWA | vite-plugin-pwa (Workbox) |
| Gráficos | Chart.js + vue-chartjs |
| API medicamentos | CIMA / CIMAVet (AEMPS) |

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

1. Ir a **Ajustes** dentro de la app
2. Seleccionar un proveedor de IA (Gemini, OpenAI, Anthropic, OpenRouter, etc.)
3. Pegar la API key y guardar

Proveedores disponibles:

| Proveedor | Obtener key | Notas |
|---|---|---|
| Google Gemini | [Google AI Studio](https://aistudio.google.com) | Plan gratuito disponible |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) | GPT-4o, GPT-4o Mini |
| Anthropic | [Anthropic Console](https://console.anthropic.com/settings/keys) | Requiere proxy CORS |
| OpenRouter | [OpenRouter Keys](https://openrouter.ai/keys) | Acceso a cientos de modelos con una sola key |
| GitHub Copilot | [GitHub Settings](https://github.com/settings/tokens) | Modelos vía GitHub |
| xAI (Grok) | [xAI Console](https://console.x.ai) | Grok 3 |
| DeepSeek | [DeepSeek Platform](https://platform.deepseek.com/api_keys) | Económico y potente |
| Servidor local | [Ollama](https://ollama.com) | Ollama, LM Studio, vLLM, etc. |

La key se cifra localmente con el PIN del usuario (AES-256-GCM) y nunca sale del navegador. Opcionalmente, se puede compartir una key con todos los usuarios de la misma instalación.

## Mascotas

MedApp permite gestionar medicamentos para mascotas:

1. Ir a **Perfil de salud** y seleccionar "Mascota" como tipo de paciente
2. Indicar el tipo de animal (perro, gato, ave, conejo, reptil, pez)
3. La búsqueda de medicamentos se realizará en **CIMAVet**, la base de datos veterinaria de la AEMPS
4. El análisis de interacciones tendrá en cuenta que el paciente es un animal

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
    ai/             # Integración multi-proveedor IA
    storage/        # CRUD IndexedDB (store, users, backup)
    crypto.js       # Cifrado AES-256-GCM / fallback XOR
    db.js           # Schema Dexie y migraciones
  stores/           # Pinia (estado UI y sesión)
  router/           # Rutas y navigation guard
```

## Privacidad

Todos los datos (medicamentos, interacciones, ajustes, API keys) se almacenan exclusivamente en el navegador del usuario. No se envía información a ningún servidor propio. Las únicas peticiones externas son:

- **CIMA / CIMAVet (AEMPS)**: para buscar información de medicamentos humanos y veterinarios
- **Proveedor de IA configurado**: para analizar interacciones (solo si el usuario configura una API key)

## Licencia

[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)
