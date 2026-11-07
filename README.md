# OpenCode Chat for VS Code

Interfaz de chat integrada en Visual Studio Code para interactuar de forma fluida con el CLI de [OpenCode](https://opencode.ai/), con visualización del proceso de razonamiento (*thinking process*), selección dinámica de modelos y ejecución contextual en el workspace activo.

Desarrollado y mantenido por **[Juan Pablo Fuentes Vivanco](https://juanpablofuentes.cl/)**.

---

## Características principales

- **Integración nativa en la barra lateral**: Panel de chat accesible directamente desde la barra de actividades de VS Code.
- **Detección automática del CLI**: Identificación del estado de OpenCode CLI en el sistema (online/offline) con detección de versión en tiempo real.
- **Soporte de razonamiento (*Thinking Process*)**: Visualización del bloque de pensamiento y reflexión antes de la respuesta final.
- **Selector dinámico de modelos y esfuerzo**:
  - Modelos sincronizados dinámicamente a través del comando `opencode models`.
  - Selector de nivel de razonamiento (*default*, *low*, *medium*, *high*).
- **Ejecución contextual en el workspace**: Las sesiones y comandos se ejecutan tomando como directorio de trabajo (`cwd`) la carpeta abierta en VS Code.
- **Acceso rápido y comandos**:
  - Reinicio de sesión mediante el comando `OpenCode: Reiniciar Sesión`.
  - Acceso directo desde el icono de estado en la barra inferior.

---

## Requisitos previos

Para aprovechar todas las capacidades de la extensión, es necesario contar con:

1. **Visual Studio Code** versión `1.85.0` o superior.
2. **OpenCode CLI** instalado y disponible en el `PATH` del sistema:
   ```bash
   # Comprobar instalación previa
   opencode --version
   ```

> **Nota**: Si OpenCode CLI no está instalado o no se encuentra en el PATH, la extensión mostrará un aviso informativo en la interfaz.

---

## Uso

1. Haz clic en el icono de **OpenCode Chat** en la barra de actividad lateral o en el indicador de la barra de estado.
2. Selecciona el modelo y el nivel de esfuerzo de razonamiento deseado en el selector inferior.
3. Escribe tu consulta o instrucción sobre el código y presiona **Enter** o el botón de envío.
4. Si necesitas reiniciar la conversación, utiliza el botón de reset en la cabecera o ejecuta el comando `OpenCode: Reiniciar Sesión` desde la paleta de comandos (`Ctrl+Shift+P` / `Cmd+Shift+P`).

---

## Arquitectura y Modularidad

El proyecto implementa una clara separación de responsabilidades:
- **`src/extension.ts`**: Punto de entrada de la extensión, registro de proveedores en el ciclo de vida de VS Code y gestión del item en la barra de estado.
- **`src/OpenCodeChatViewProvider.ts`**: Controlador del WebviewViewProvider, orquestación de subprocesos con el CLI de OpenCode, gestión de cola de mensajes y eventos de streaming.
- **`src/webviewHtml.ts`**: Módulo encapsulado responsable de renderizar el cliente Webview (HTML, tokens semánticos CSS y frontend interactivo).

---

## Autor

- **Nombre**: Juan Pablo Fuentes Vivanco
- **Portafolio / Sitio Web**: [https://juanpablofuentes.cl/](https://juanpablofuentes.cl/)
- **Repositorio oficial**: [https://github.com/jpfuentesv/opencode-chat-vscode](https://github.com/jpfuentesv/opencode-chat-vscode)

---

## Licencia

Distribuido bajo la licencia [MIT](LICENSE.txt).
