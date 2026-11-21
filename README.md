# OpenCode Chat for VS Code

Interfaz de chat integrada en Visual Studio Code para interactuar de forma fluida con el CLI de [OpenCode](https://opencode.ai/), con visualización del proceso de razonamiento (*thinking process*), selección dinámica de modelos, adjuntos multimedia y ejecución contextual en el workspace activo.

Desarrollado y mantenido por **[Juan Pablo Fuentes Vivanco](https://juanpablofuentes.cl/)**.

---

## Características principales (v1.1.1)

- **Diseño fluido al estilo Antigravity**:
  - Respuestas del asistente al descubierto en primer plano sin cajas rígidas.
  - Burbuja asimétrica elegante para las entradas del usuario (`border-radius: 18px 18px 4px 18px`).
  - Barra de herramientas contextual al pie de cada mensaje (copiar respuesta completa, reutilizar/editar prompt en el dock de entrada, eliminar).
  - Bloques de código enriquecidos con botones de copiar e insertar directamente en el editor activo en la posición del cursor.
- **Motor de renderizado Markdown estructurado**:
  - Pre-procesamiento de espaciado que separa automáticamente encabezados, listas y viñetas concatenadas inline por los modelos.
  - Jerarquía tipográfica con escala clara (`<h2>`, `<h3>` con acento azul, `<ul>` con sangría visual de 20px).
  - Renderizado blindado que evita el colapso de listas o textos aglomerados.
- **Proceso de razonamiento optimizado (*Thinking Process*)**:
  - Cápsula discreta (*pill*) de razonamiento colapsada por defecto con indicador direccional (`▸ Pensamiento completado`).
  - No interfiere con la lectura de la respuesta principal y se despliega opcionalmente al hacer clic.
- **Soporte de adjuntos y Drag & Drop**:
  - Arrastra y suelta archivos o imágenes desde el Finder o el explorador de VS Code directamente al panel.
  - Pega capturas de pantalla directamente desde el portapapeles (`Cmd+V` / `Ctrl+V`).
  - Botón de adjuntos nativo (📎) para seleccionar múltiples archivos.
  - Inyección automática como parámetros `--file` al CLI de OpenCode.
- **Selector dinámico de modelos y esfuerzo de razonamiento**:
  - Modelos sincronizados dinámicamente desde `opencode models`.
  - Selector de esfuerzo de razonamiento (*off*, *low*, *medium*, *high*).
- **Ejecución contextual en el workspace**:
  - Las sesiones y comandos se ejecutan tomando como directorio de trabajo (`cwd`) la carpeta abierta en VS Code.
- **Acceso rápido y comandos**:
  - Reinicio de sesión mediante el comando `OpenCode: Reiniciar Sesión`.
  - Exportación de conversaciones a Markdown y JSON.
  - Indicador de estado en tiempo real en la barra de estado inferior.

---

## Requisitos previos

1. **Visual Studio Code** versión `1.85.0` o superior.
2. **OpenCode CLI** instalado y disponible en el `PATH` del sistema:
   ```bash
   opencode --version
   ```

---

## Uso

1. Haz clic en el icono de **OpenCode Chat** en la barra de actividad lateral o en el indicador de la barra de estado.
2. Selecciona el modelo y el nivel de esfuerzo de razonamiento deseado en el dock inferior.
3. Escribe tu consulta, arrastra archivos de referencia si lo requieres y presiona **Enter**.
4. Si necesitas reiniciar la conversación, utiliza el botón de reset en la cabecera o ejecuta el comando `OpenCode: Reiniciar Sesión` (`Ctrl+Shift+P` / `Cmd+Shift+P`).

---

## Arquitectura y Modularidad

- **`src/extension.ts`**: Punto de entrada de la extensión, registro de comandos y ciclo de vida en VS Code.
- **`src/OpenCodeChatViewProvider.ts`**: Controlador Webview, ejecución de subprocesos con OpenCode CLI, enrutamiento de streaming (`chunk`, `thoughtChunk`, `done`) y cola de mensajes.
- **`src/webviewHtml.ts`**: Frontend Webview (HTML, tokens semánticos CSS y motor de renderizado Markdown interactivo).

---

## Autor

- **Nombre**: Juan Pablo Fuentes Vivanco
- **Portafolio / Sitio Web**: [https://juanpablofuentes.cl/](https://juanpablofuentes.cl/)
- **Repositorio oficial**: [https://github.com/jpfuentesv/opencode-chat-vscode](https://github.com/jpfuentesv/opencode-chat-vscode)

---

## Licencia

Distribuido bajo la licencia [MIT](LICENSE.txt).
