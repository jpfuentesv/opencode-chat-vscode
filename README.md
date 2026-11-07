# OpenCode Chat for VS Code

Interfaz de chat integrada en Visual Studio Code para interactuar de forma fluida con el CLI de [OpenCode](https://opencode.ai/), con visualizacion del proceso de razonamiento (*thinking process*), seleccion dinamica de modelos y ejecucion contextual en el workspace activo.

---

## Caracteristicas principales

- **Integracion nativa en la barra lateral**: Panel de chat accesible directamente desde la barra de actividades de VS Code.
- **Deteccion automatica del CLI**: Identificacion del estado de OpenCode CLI en el sistema (online/offline) con deteccion de version en tiempo real.
- **Soporte de razonamiento (*Thinking Process*)**: Visualizacion del bloque de pensamiento y reflexion antes de la respuesta final.
- **Selector dinamico de modelos y esfuerzo**:
  - Modelos sincronizados dinamicamente a traves del comando `opencode models`.
  - Selector de nivel de razonamiento (*default*, *low*, *medium*, *high*).
- **Ejecucion contextual en el workspace**: Las sesiones y comandos se ejecutan tomando como directorio de trabajo (`cwd`) la carpeta abierta en VS Code.
- **Acceso rapido y comandos**:
  - Reinicio de sesion mediante el comando `OpenCode: Reiniciar Sesión`.
  - Acceso directo desde el icono de estado en la barra inferior.

---

## Requisitos previos

Para aprovechar todas las capacidades de la extension, es necesario contar con:

1. **Visual Studio Code** version `1.85.0` o superior.
2. **OpenCode CLI** instalado y disponible en el `PATH` del sistema:
   ```bash
   # Comprobar instalacion previa
   opencode --version
   ```

> **Nota**: Si OpenCode CLI no esta instalado o no se encuentra en el PATH, la extension mostrara un aviso informativo en la interfaz.

---

## Uso

1. Haz clic en el icono de **OpenCode Chat** en la barra de actividad lateral o en el indicador de la barra de estado.
2. Selecciona el modelo y el nivel de esfuerzo de razonamiento deseado en el selector inferior.
3. Escribe tu consulta o instruccion sobre el codigo y presiona **Enter** o el boton de envio.
4. Si necesitas reiniciar la conversacion, utiliza el boton de reset en la cabecera o ejecuta el comando `OpenCode: Reiniciar Sesión` desde la paleta de comandos (`Ctrl+Shift+P` / `Cmd+Shift+P`).

---

## Licencia

Distribuido bajo la licencia [MIT](LICENSE.txt).
