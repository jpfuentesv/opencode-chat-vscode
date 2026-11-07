/**
 * OpenCode Chat for VS Code
 * Autor: Juan Pablo Fuentes Vivanco
 * Portafolio: https://juanpablofuentes.cl/
 * Repositorio: https://github.com/jpfuentesv/opencode-chat-vscode
 */

export function getWebviewHtml(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: var(--vscode-sideBar-background, var(--vscode-editor-background));
      --surface: var(--vscode-input-background, var(--bg));
      --surface-hover: var(--vscode-list-hoverBackground, var(--surface));
      --border: var(--vscode-sideBar-border, var(--vscode-panel-border, rgba(128, 128, 128, 0.18)));
      --border-focus: var(--vscode-focusBorder, var(--accent, #007acc));
      --text: var(--vscode-sideBar-foreground, var(--vscode-foreground));
      --text-muted: var(--vscode-descriptionForeground, rgba(200, 200, 200, 0.7));
      --accent: var(--vscode-textLink-foreground, #3794ff);
      --accent-hover: var(--vscode-textLink-activeForeground, var(--accent));
      --danger: var(--vscode-errorForeground, #f14c4c);
      --success: var(--vscode-terminal-ansiGreen, #73c991);
      --thought-bg: var(--vscode-editorWidget-background, var(--surface));
      --thought-border: var(--vscode-editorWidget-border, var(--border));
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    ::selection {
      background: var(--vscode-editor-selectionBackground, rgba(55, 148, 255, 0.35));
      color: var(--text);
    }

    /* Scrollbars nativos sobrios y calibrados */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background, rgba(128, 128, 128, 0.3));
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground, rgba(128, 128, 128, 0.5));
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Accesibilidad y contención */
    button, select, textarea {
      font-family: inherit;
    }

    button:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 1px solid var(--border-focus);
      outline-offset: 1px;
    }

    /* Header superior */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 11.5px;
      color: var(--text-muted);
      background: var(--bg);
      flex-shrink: 0;
      min-height: 36px;
      gap: 8px;
    }
    .status-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--text-muted);
      flex-shrink: 0;
    }
    .status-dot.online {
      background-color: var(--success);
      box-shadow: 0 0 6px var(--success);
    }
    .status-dot.offline {
      background-color: var(--danger);
    }
    #status-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 11.5px;
    }
    #timer-display {
      margin-left: 4px;
      font-size: 11px;
      color: var(--text-muted);
      display: none;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .header-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      min-height: 28px;
      padding: 4px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .header-icon-btn:hover {
      background: var(--surface-hover);
      color: var(--text);
      border-color: var(--border);
    }
    .header-icon-btn svg {
      width: 14px;
      height: 14px;
    }

    /* Mensajes y contenedor central */
    #messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }

    .msg-card {
      position: relative;
      padding: 10px 28px 10px 12px;
      border-radius: 8px;
      line-height: 1.5;
      font-size: 12.5px;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      border: 1px solid var(--border);
      background: var(--surface);
      max-width: 100%;
    }

    .msg-card.user {
      background: var(--vscode-list-activeSelectionBackground, var(--surface));
      color: var(--vscode-list-activeSelectionForeground, var(--text));
      border-color: var(--vscode-list-activeSelectionBackground, var(--border));
      cursor: pointer;
      align-self: flex-end;
      width: 100%;
    }
    .msg-card.user:hover {
      border-color: var(--accent);
    }
    .msg-card.user::after {
      content: "↺ Clic para hacer rollback a este punto";
      display: none;
      font-size: 10.5px;
      color: var(--accent);
      margin-top: 5px;
    }
    .msg-card.user:hover::after {
      display: block;
    }

    .msg-delete-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.15s ease, background 0.15s ease;
    }
    .msg-delete-btn:hover {
      opacity: 1;
      background: var(--vscode-inputValidation-errorBackground, var(--surface-hover));
      color: var(--danger);
    }

    /* Hilo de pensamiento (Chain of Thought) */
    .thought-container {
      margin-bottom: 8px;
      border: 1px solid var(--thought-border);
      background: var(--thought-bg);
      border-radius: 6px;
      overflow: hidden;
      font-size: 11.5px;
    }
    .thought-header {
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-muted);
      cursor: pointer;
      user-select: none;
      background: var(--surface);
      font-weight: 500;
      gap: 6px;
    }
    .thought-header:hover {
      color: var(--text);
      background: var(--surface-hover);
    }
    .thought-body {
      padding: 8px 10px;
      color: var(--text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
      border-top: 1px solid var(--thought-border);
      background: var(--vscode-editor-background, var(--bg));
    }

    .pulse-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--accent);
      margin-right: 6px;
      animation: pulse 1.2s infinite ease-in-out;
      flex-shrink: 0;
    }
    @keyframes pulse {
      0% { opacity: 0.3; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.2); }
      100% { opacity: 0.3; transform: scale(0.9); }
    }

    /* Background tasks indicator */
    .bg-tasks {
      padding: 8px 10px;
      margin: 0 10px 8px;
      background: var(--vscode-editorWidget-background, var(--surface));
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 11.5px;
      color: var(--text);
      display: none;
      flex-shrink: 0;
    }
    .bg-tasks.active {
      display: block;
    }
    .bg-tasks-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: var(--accent);
      margin-bottom: 4px;
    }
    .bg-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .bg-task-item {
      padding: 2px 0;
      color: var(--text-muted);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bg-task-item::before {
      content: '\u25B8 ';
      color: var(--accent);
    }

    /* Context summary card */
    .context-summary {
      flex-shrink: 0;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid var(--border);
      background: var(--vscode-editorWidget-background, var(--surface));
      border-radius: 6px;
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-all;
      overflow-wrap: anywhere;
      min-height: fit-content;
      max-height: 240px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .context-summary h2 {
      font-size: 12px;
      margin-bottom: 4px;
      color: var(--accent);
    }

    /* Cola de mensajes */
    #queue-container {
      padding: 0 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 120px;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .queue-item {
      position: relative;
      background: var(--vscode-sideBarSectionHeader-background, var(--surface));
      border: 1px dashed var(--border-focus);
      border-radius: 6px;
      padding: 6px 26px 6px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .queue-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .queue-send-now-btn {
      background: var(--vscode-button-background, var(--accent));
      color: var(--vscode-button-foreground, var(--text));
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10.5px;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Dock Inferior responsivo */
    .dock-outer {
      padding: 8px 10px 10px;
      flex-shrink: 0;
      background: var(--bg);
      border-top: 1px solid var(--border);
    }
    .dock-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 0.15s ease;
    }
    .dock-box:focus-within {
      border-color: var(--border-focus);
    }

    #prompt-input {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text);
      font-family: inherit;
      font-size: 12.5px;
      line-height: 18px;
      resize: none;
      outline: none;
      min-height: 18px;
      max-height: 200px;
      overflow-y: hidden;
    }
    #prompt-input::placeholder {
      color: var(--text-muted);
    }

    .dock-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-top: 2px;
      flex-wrap: wrap;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }
    .select-pill {
      background: var(--surface);
      color: var(--text-muted);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 3px 5px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
      max-width: 135px;
      min-width: 50px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      flex: 1 1 auto;
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .select-pill:hover, .select-pill:focus {
      color: var(--text);
      border-color: var(--border-focus);
    }

    .send-btn {
      background: var(--vscode-button-secondaryBackground, #55565a);
      border: 1px solid var(--vscode-contrastBorder, transparent);
      color: var(--vscode-button-secondaryForeground, var(--text));
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, transform 0.1s ease;
      flex-shrink: 0;
    }
    .send-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #68696d);
    }
    .send-btn:active {
      transform: scale(0.96);
    }
    .send-btn.is-stop {
      background: var(--danger);
      border-color: var(--danger);
      color: var(--vscode-button-foreground, #ffffff);
    }
    .send-btn.is-stop:hover {
      background: var(--vscode-button-hoverBackground, var(--danger));
    }
    .send-btn .stop-icon {
      display: none;
      width: 11px;
      height: 11px;
      fill: currentColor;
    }
    .send-btn.is-stop .send-icon {
      display: none;
    }
    .send-btn.is-stop .stop-icon {
      display: block;
    }

    /* Diálogos y modales con responsive bounds */
    #reset-dialog, #sessions-dialog {
      max-width: calc(100vw - 20px);
      margin: auto;
      padding: 14px;
      border: 1px solid var(--vscode-widget-border, var(--border));
      border-radius: 8px;
      background: var(--vscode-editorWidget-background, var(--bg));
      color: var(--text);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }
    #reset-dialog {
      width: min(340px, calc(100vw - 20px));
    }
    #sessions-dialog {
      width: min(500px, calc(100vw - 20px));
      max-height: 85vh;
    }
    #reset-dialog::backdrop, #sessions-dialog::backdrop {
      background: var(--vscode-widget-shadow, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(2px);
    }
    .reset-dialog-title, .sessions-dialog-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .reset-dialog-message {
      color: var(--text-muted);
      line-height: 1.45;
      font-size: 12px;
    }
    .reset-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 14px;
    }
    .reset-dialog-actions button {
      min-height: 26px;
      padding: 3px 10px;
      border: 1px solid var(--vscode-contrastBorder, transparent);
      border-radius: 4px;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
    }
    #cancel-reset {
      background: var(--vscode-button-secondaryBackground, var(--surface));
      color: var(--vscode-button-secondaryForeground, var(--text));
    }
    #confirm-reset {
      background: var(--vscode-button-background, var(--accent));
      color: var(--vscode-button-foreground, var(--text));
    }

    .sessions-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 6px;
      background: var(--surface);
    }
    .session-meta {
      flex: 1;
      min-width: 0;
    }
    .session-title {
      font-weight: 500;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .session-date {
      font-size: 10.5px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .session-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .session-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 6px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--surface-hover);
      color: var(--text);
      cursor: pointer;
      font-size: 11px;
      transition: all 0.15s ease;
    }
    .session-action-btn:hover {
      border-color: var(--border-focus);
      color: var(--accent);
    }
    .session-action-btn.danger:hover {
      color: var(--danger);
      border-color: var(--danger);
    }
    .session-action-btn svg {
      width: 12px;
      height: 12px;
    }

    /* Reglas de responsividad para paneles muy estrechos (<= 260px) */
    @media (max-width: 260px) {
      .header {
        padding: 6px 8px;
      }
      #messages {
        padding: 8px 6px;
        gap: 8px;
      }
      .msg-card {
        padding: 8px 24px 8px 10px;
        font-size: 12px;
      }
      .dock-outer {
        padding: 6px 6px 8px;
      }
      .dock-box {
        padding: 6px 8px;
      }
      .toolbar-left {
        gap: 3px;
      }
      .select-pill {
        max-width: 100%;
        flex: 1 1 100%;
      }
    }

    /* Reducción de movimiento cuando el usuario lo prefiere */
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
      .pulse-dot, .bg-spinner {
        animation: none !important;
        opacity: 0.8;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="status-wrap">
      <span id="status-dot" class="status-dot"></span>
      <span id="status-text">Conectando...</span>
      <span id="timer-display" style="margin-left:8px;font-size:11px;color:var(--text-muted);display:none;"></span>
    </div>
    <div class="header-actions">
      <button class="header-icon-btn" id="export-btn" title="Exportar conversación" aria-label="Exportar conversación">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="header-icon-btn" id="reset-btn" title="Reiniciar sesión y limpiar historial" aria-label="Reiniciar sesión">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
    </div>
  </div>

  <dialog id="reset-dialog" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-message">
    <h2 class="reset-dialog-title" id="reset-dialog-title">¿Reiniciar el chat?</h2>
    <p class="reset-dialog-message" id="reset-dialog-message">Al aceptar se limpiará y eliminará el chat actual.</p>
    <div class="reset-dialog-actions">
      <button id="cancel-reset" type="button">Cancelar</button>
      <button id="confirm-reset" type="button">Aceptar</button>
    </div>
  </dialog>



  <div id="messages">
    <div class="msg-card">¿Qué desarrollaremos hoy? Estoy listo para ayudarte con código, depuración y arquitectura.</div>
  </div>

  <div class="bg-tasks" id="bg-tasks">
    <div class="bg-tasks-header">
      <span class="bg-spinner"></span>
      <span>Tareas en ejecución</span>
    </div>
    <div id="bg-task-list"></div>
  </div>

  <div class="progress-bar" id="progress-bar" style="display:none;height:3px;background:var(--border);border-radius:2px;margin:0 12px 8px;overflow:hidden;">
    <div id="progress-fill" style="height:100%;width:0%;background:var(--accent);transition:width 0.3s ease;border-radius:2px;"></div>
  </div>

  <div id="queue-container"></div>

  <div class="dock-outer">
    <div class="dock-box">
      <textarea id="prompt-input" rows="1" placeholder="¿Qué desarrollaremos hoy? (Enter para enviar, Shift+Enter salto de línea)"></textarea>
      <div class="dock-toolbar">
        <div class="toolbar-left">
          <select id="model-select" class="select-pill" title="Modelo">
            <optgroup label="Recientes">
              <option value="openrouter/openrouter/free">openrouter/openrouter/free</option>
            </optgroup>
          </select>
          <select id="reasoning-select" class="select-pill" title="Nivel de razonamiento">
            <option value="off">Off</option>
            <option value="low">Low</option>
            <option value="medium" selected>Mid</option>
            <option value="high">High</option>
          </select>
          <select id="mode-select" class="select-pill" title="Modo">
            <option value="Normal">Normal</option>
            <option value="Plan">Plan</option>
          </select>
        </div>
        <button id="send-btn" class="send-btn" title="Enviar (Enter)" aria-label="Enviar mensaje">
          <span class="send-icon">↑</span>
          <svg class="stop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>
        </button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const queueContainer = document.getElementById('queue-container');
    const bgTasksEl = document.getElementById('bg-tasks');
    const bgTaskListEl = document.getElementById('bg-task-list');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');

    const MAX_BG_TASKS = 12;
    function isAnalysisTask(name) {
      return /read|grep|glob|list|search|scan|context|analiz|tool/i.test(String(name || ''));
    }
    function showBackgroundTask(taskName) {
      if (!bgTasksEl || !bgTaskListEl) return;
      bgTasksEl.classList.add('active');
      const name = String(taskName || 'Analizando contexto...');

      // Las tareas de analisis se agrupan en una sola linea que se actualiza
      // con el comando en ejecucion, en lugar de crear una linea por cada paso.
      if (isAnalysisTask(name)) {
        let analysisItem = bgTaskListEl.querySelector('.bg-task-item[data-group="analysis"]');
        if (analysisItem) {
          analysisItem.textContent = name;
          analysisItem.dataset.task = name;
          return;
        }
        if (bgTaskListEl.children.length >= MAX_BG_TASKS) {
          const first = bgTaskListEl.firstElementChild;
          if (first) first.remove();
        }
        const item = document.createElement('div');
        item.className = 'bg-task-item';
        item.textContent = name;
        item.dataset.task = name;
        item.dataset.group = 'analysis';
        bgTaskListEl.appendChild(item);
        return;
      }

      // Tareas distintas: solo crecer (maximo 12 lineas) cuando es necesario.
      if (bgTaskListEl.children.length >= MAX_BG_TASKS) {
        const last = bgTaskListEl.lastElementChild;
        if (last) {
          last.textContent = name;
          last.dataset.task = name;
        }
        return;
      }
      const item = document.createElement('div');
      item.className = 'bg-task-item';
      item.textContent = name;
      item.dataset.task = name;
      item.dataset.group = 'task';
      bgTaskListEl.appendChild(item);
    }

    function clearBackgroundTasks() {
      if (!bgTasksEl || !bgTaskListEl) return;
      bgTasksEl.classList.remove('active');
      bgTaskListEl.innerHTML = '';
    }
    const inputEl = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetDialog = document.getElementById('reset-dialog');
    const cancelResetBtn = document.getElementById('cancel-reset');
    const confirmResetBtn = document.getElementById('confirm-reset');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const timerDisplay = document.getElementById('timer-display');
    const verboseBtn = document.getElementById('verbose-btn');
    const sessionsBtn = document.getElementById('sessions-btn');
    const exportBtn = document.getElementById('export-btn');
    const sessionsDialog = document.getElementById('sessions-dialog');
    const sessionsList = document.getElementById('sessions-list');
    const closeSessionsBtn = document.getElementById('close-sessions');
    const refreshSessionsBtn = document.getElementById('refresh-sessions');
    const modelSelect = document.getElementById('model-select');
    const reasoningSelect = document.getElementById('reasoning-select');
    const modeSelect = document.getElementById('mode-select');
    const DEFAULT_MODEL = 'openrouter/openrouter/free';
    const savedState = vscode.getState();
    let recentModels = Array.isArray(savedState?.recentModels)
      ? [...new Set(savedState.recentModels.filter((model) => typeof model === 'string'))].slice(0, 10)
      : [];
    let availableModels = [DEFAULT_MODEL];
    let isProcessing = false;

    function renderModelOptions(selectedModel) {
      const models = Array.from(new Set([...availableModels, DEFAULT_MODEL]));
      const recent = recentModels.filter((model) => models.includes(model));
      if (recent.length === 0) recent.push(DEFAULT_MODEL);

      modelSelect.replaceChildren();
      const recentGroup = document.createElement('optgroup');
      recentGroup.label = 'Recientes';
      recent.forEach((rawModel) => {
        const option = document.createElement('option');
        option.value = rawModel;
        option.textContent = rawModel;
        recentGroup.appendChild(option);
      });
      modelSelect.appendChild(recentGroup);

      const groups = new Map();
      models.forEach((rawModel) => {
        const provider = rawModel.split('/')[0] || 'other';
        let group = groups.get(provider);
        if (!group) {
          group = document.createElement('optgroup');
          group.label = provider;
          groups.set(provider, group);
          modelSelect.appendChild(group);
        }
        const option = document.createElement('option');
        option.value = rawModel;
        option.textContent = rawModel;
        group.appendChild(option);
      });

      modelSelect.value = models.includes(selectedModel) ? selectedModel : DEFAULT_MODEL;
    }

    function rememberModel(model) {
      recentModels = [model, ...recentModels.filter((recentModel) => recentModel !== model)].slice(0, 10);
      vscode.setState({ ...(vscode.getState() || {}), recentModels });
    }

    modelSelect.addEventListener('change', () => {
      rememberModel(modelSelect.value);
      renderModelOptions(modelSelect.value);
    });

    function setProcessing(processing) {
      isProcessing = processing;
      sendBtn.classList.toggle('is-stop', processing);
      sendBtn.title = processing ? 'Detener consulta' : 'Enviar (Enter)';
      sendBtn.setAttribute('aria-label', processing ? 'Detener consulta' : 'Enviar mensaje');
    }

    const LINE_HEIGHT = 20;
    const MAX_LINES = 12;
    const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES; // 240px

    const assistantBubbles = new Map();

    function adjustTextareaHeight() {
      inputEl.style.height = 'auto';
      const curScroll = inputEl.scrollHeight;
      if (curScroll > MAX_HEIGHT) {
        inputEl.style.height = MAX_HEIGHT + 'px';
        inputEl.style.overflowY = 'auto';
      } else {
        inputEl.style.height = Math.max(curScroll, LINE_HEIGHT) + 'px';
        inputEl.style.overflowY = 'hidden';
      }
    }

    inputEl.addEventListener('input', adjustTextareaHeight);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submitCurrentInput();
      }
    });

    sendBtn.addEventListener('click', () => {
      if (isProcessing) {
        vscode.postMessage({ type: 'stopMessage' });
      } else {
        submitCurrentInput();
      }
    });

    resetBtn.addEventListener('click', () => {
      resetDialog.showModal();
    });

    if (verboseBtn) {
      verboseBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'toggleVerbose' });
      });
    }

    if (sessionsBtn && sessionsDialog) {
      sessionsBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'listSessions' });
        sessionsDialog.showModal();
      });
    }

    exportBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'exportConversation', format: 'markdown' });
    });

    if (closeSessionsBtn && sessionsDialog) {
      closeSessionsBtn.addEventListener('click', () => {
        sessionsDialog.close();
      });
    }

    if (refreshSessionsBtn) {
      refreshSessionsBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'listSessions' });
      });
    }

    cancelResetBtn.addEventListener('click', () => {
      resetDialog.close();
    });

    confirmResetBtn.addEventListener('click', () => {
      resetDialog.close();
      vscode.postMessage({ type: 'resetSession' });
    });

    modelSelect.addEventListener('mousedown', () => {
      if (modelSelect.options.length <= 1) {
        vscode.postMessage({ type: 'fetchModels' });
      }
    });

    function submitCurrentInput() {
      const text = inputEl.value.trim();
      if (!text) return;
      setProcessing(true);

      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      vscode.postMessage({
        type: 'sendMessage',
        id: msgId,
        text: text,
        model: modelSelect.value,
        mode: modeSelect.value,
        reasoningEffort: reasoningSelect.value
      });

      inputEl.value = '';
      adjustTextareaHeight();
      inputEl.focus();
    }

    function createMessageElement(id, text, role) {
      const card = document.createElement('div');
      card.className = 'msg-card ' + role;
      card.dataset.id = id;

      let thoughtBox = null;
      let thoughtBody = null;
      let thoughtHeader = null;

      if (role === 'assistant') {
        thoughtBox = document.createElement('div');
        thoughtBox.className = 'thought-container';
        thoughtBox.style.display = 'block';

        thoughtHeader = document.createElement('div');
        thoughtHeader.className = 'thought-header';
        thoughtHeader.innerHTML = '<span class="header-title"><span class="pulse-dot"></span>Pensando...</span><span class="header-icon">▾</span>';

        thoughtBody = document.createElement('div');
        thoughtBody.className = 'thought-body';
        thoughtBody.textContent = '';

        thoughtHeader.addEventListener('click', () => {
          const isCollapsed = thoughtBody.style.display === 'none';
          thoughtBody.style.display = isCollapsed ? 'block' : 'none';
          thoughtHeader.querySelector('.header-icon').textContent = isCollapsed ? '▾' : '▸';
        });

        thoughtBox.appendChild(thoughtHeader);
        thoughtBox.appendChild(thoughtBody);
        card.appendChild(thoughtBox);
      }

      const contentSpan = document.createElement('div');
      contentSpan.className = 'msg-content';
      contentSpan.textContent = text;
      card.appendChild(contentSpan);

      const delBtn = document.createElement('button');
      delBtn.className = 'msg-delete-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Eliminar mensaje';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        vscode.postMessage({ type: 'deleteHistoryMessage', id });
      });
      card.appendChild(delBtn);

      if (role === 'user') {
        card.addEventListener('click', () => {
          vscode.postMessage({ type: 'rollbackToMessage', id });
        });
      }

      messagesEl.appendChild(card);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      return {
        content: contentSpan,
        thoughtContainer: thoughtBox,
        thoughtHeader: thoughtHeader,
        thoughtBody: thoughtBody,
        hasThought: false
      };
    }

    function renderQueue(queue) {
      queueContainer.innerHTML = '';
      queue.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'queue-item';

        const txt = document.createElement('span');
        txt.className = 'queue-text';
        txt.textContent = 'En cola: ' + item.text;
        row.appendChild(txt);

        const sendNowBtn = document.createElement('button');
        sendNowBtn.className = 'queue-send-now-btn';
        sendNowBtn.textContent = 'Send';
        sendNowBtn.title = 'Enviar inmediatamente';
        sendNowBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ type: 'forceSendQueued', id: item.id });
        });
        row.appendChild(sendNowBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'msg-delete-btn';
        removeBtn.textContent = '✕';
        removeBtn.title = 'Quitar de la cola';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ type: 'removeQueued', id: item.id });
        });
        row.appendChild(removeBtn);

        queueContainer.appendChild(row);
      });
    }

    window.addEventListener('message', (event) => {
      const data = event.data;
      switch (data.type) {
        case 'connectionStatus': {
          statusDot.className = 'status-dot ' + (data.connected ? 'online' : 'offline');
          statusText.textContent = data.detail;
          break;
        }
        case 'modelsLoaded': {
          const currentVal = modelSelect.value || DEFAULT_MODEL;
          availableModels = Array.isArray(data.models) ? data.models : [];
          renderModelOptions(currentVal);
          break;
        }
        case 'sessionResetConfirmed': {
          setProcessing(false);
          assistantBubbles.clear();
          messagesEl.innerHTML = '<div class="msg-card">Sesión reiniciada. ¿Qué desarrollaremos hoy?</div>';
          queueContainer.innerHTML = '';
          clearBackgroundTasks();
          if (progressBar) {
            progressBar.style.display = 'none';
            if (progressFill) progressFill.style.width = '0%';
          }
          if (timerDisplay) timerDisplay.style.display = 'none';
          inputEl.value = '';
          adjustTextareaHeight();
          break;
        }
        case 'startUserAndAssistant': {
          setProcessing(true);
          createMessageElement(data.userMsg.id, data.userMsg.text, 'user');
          const astRefs = createMessageElement(data.assistantId, '', 'assistant');
          assistantBubbles.set(data.assistantId, astRefs);
          if (progressBar) {
            progressBar.style.display = 'block';
            if (progressFill) progressFill.style.width = '5%';
          }
          if (timerDisplay) {
            timerDisplay.style.display = 'inline';
            timerDisplay.textContent = '0s';
          }
          break;
        }
        case 'thoughtChunk': {
          const refs = assistantBubbles.get(data.assistantId);
          if (refs && refs.thoughtContainer && refs.thoughtBody) {
            refs.hasThought = true;
            refs.thoughtContainer.style.display = 'block';
            refs.thoughtBody.style.display = 'block';
            refs.thoughtBody.textContent += data.text;
            refs.thoughtBody.scrollTop = refs.thoughtBody.scrollHeight;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          break;
        }
        case 'chunk': {
          const refs = assistantBubbles.get(data.assistantId);
          if (refs && refs.content) {
            refs.content.textContent += data.text;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          break;
        }
        case 'done': {
          clearBackgroundTasks();
          setProcessing(Boolean(data.hasQueuedMessages));
          const refs = assistantBubbles.get(data.assistantId);
          if (refs && refs.thoughtContainer && refs.thoughtHeader) {
            if (!refs.hasThought) {
              // Si el modelo respondió directo sin bloques de razonamiento intermedios, ocultar la caja vacía
              refs.thoughtContainer.style.display = 'none';
            } else {
              const titleSpan = refs.thoughtHeader.querySelector('.header-title');
              if (titleSpan) {
                titleSpan.innerHTML = 'Pensamiento completado';
              }
              if (refs.thoughtBody && refs.content && refs.content.textContent.trim().length > 0) {
                refs.thoughtBody.style.display = 'none';
                refs.thoughtHeader.querySelector('.header-icon').textContent = '▸';
              }
            }
          }
          break;
        }
        case 'queueUpdated': {
          renderQueue(data.queue || []);
          break;
        }
        case 'rollbackConfirmed': {
          const cards = Array.from(messagesEl.querySelectorAll('.msg-card'));
          let found = false;
          for (const c of cards) {
            if (c.dataset.id === data.id) found = true;
            if (found) c.remove();
          }
          inputEl.value = data.restoredText || '';
          adjustTextareaHeight();
          inputEl.focus();
          break;
        }
        case 'contextScanReady': {
          const existing = messagesEl.querySelector('.context-summary');
          if (existing) existing.remove();

          if (data.summary && data.summary.length > 0) {
            const el = document.createElement('div');
            el.className = 'context-summary';
            el.textContent = data.summary;
            messagesEl.appendChild(el);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          break;
        }
        case 'backgroundTask': {
          showBackgroundTask(data.taskName || 'Analizando contexto...');
          break;
        }
        case 'backgroundTaskClear': {
          clearBackgroundTasks();
          break;
        }
        case 'timerUpdate': {
          if (timerDisplay) {
            timerDisplay.style.display = 'inline';
            timerDisplay.textContent = data.elapsed;
          }
          break;
        }
        case 'agentFinished': {
          if (timerDisplay) {
            timerDisplay.style.display = 'none';
          }
          if (progressBar) {
            progressBar.style.display = 'none';
            if (progressFill) progressFill.style.width = '0%';
          }
          // Play notification sound (browser notification)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
          // Show browser notification if permitted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('OpenCode Chat', { body: 'Respuesta completada' });
          }
          break;
        }
        case 'stepProgress': {
          if (progressBar && progressFill) {
            progressBar.style.display = 'block';
            const width = Math.min(data.step * 15, 90);
            progressFill.style.width = width + '%';
          }
          break;
        }
        case 'sessionsLoaded': {
          if (sessionsList) {
            sessionsList.innerHTML = '';
            const sessions = data.sessions || [];
            if (sessions.length === 0) {
              sessionsList.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No hay sesiones guardadas.</p>';
            } else {
              sessions.forEach((s) => {
                const item = document.createElement('div');
                item.className = 'session-item';
                const meta = document.createElement('div');
                meta.className = 'session-meta';
                const title = s.title || ('Sesión ' + s.id.slice(-8));
                const date = new Date(s.updated || s.created).toLocaleString();
                const titleEl = document.createElement('div');
                titleEl.className = 'session-title';
                titleEl.textContent = title;
                const dateEl = document.createElement('div');
                dateEl.className = 'session-date';
                dateEl.textContent = date;
                meta.appendChild(titleEl);
                meta.appendChild(dateEl);
                item.appendChild(meta);

                const actions = document.createElement('div');
                actions.className = 'session-actions';

                const resumeBtn = document.createElement('button');
                resumeBtn.className = 'session-action-btn';
                resumeBtn.title = 'Reanudar sesión';
                resumeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></svg> Reanudar';
                resumeBtn.addEventListener('click', () => {
                  vscode.postMessage({ type: 'resumeSession', sessionId: s.id });
                  sessionsDialog.close();
                });

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'session-action-btn';
                downloadBtn.title = 'Descargar conversación';
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Descargar';
                downloadBtn.addEventListener('click', () => {
                  vscode.postMessage({ type: 'downloadSession', sessionId: s.id });
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'session-action-btn danger';
                deleteBtn.title = 'Eliminar sesión';
                deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Eliminar';
                deleteBtn.addEventListener('click', () => {
                  vscode.postMessage({ type: 'deleteSession', sessionId: s.id });
                });

                actions.appendChild(resumeBtn);
                actions.appendChild(downloadBtn);
                actions.appendChild(deleteBtn);
                item.appendChild(actions);
                sessionsList.appendChild(item);
              });
            }
          }
          break;
        }
        case 'sessionDeleted': {
          if (data.success) {
            vscode.postMessage({ type: 'listSessions' });
          }
          break;
        }
        case 'sessionResumed': {
          messagesEl.innerHTML = '<div class="msg-card">Sesión reanudada: ' + data.sessionId + '</div>';
          break;
        }
        case 'filesChanged': {
          // Show a small notification in the chat
          const notif = document.createElement('div');
          notif.style.cssText = 'padding:6px 10px;margin:4px 0;background:var(--vscode-editorWidget-background,var(--surface));border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted);';
          notif.textContent = 'Archivos modificados: ' + (data.files || []).join(', ');
          messagesEl.appendChild(notif);
          messagesEl.scrollTop = messagesEl.scrollHeight;
          break;
        }
        case 'errorOccurred': {
          const retryBtn = document.createElement('button');
          retryBtn.className = 'reset-btn';
          retryBtn.textContent = '↻ Reintentar';
          retryBtn.style.marginTop = '8px';
          retryBtn.addEventListener('click', () => {
            vscode.postMessage({
              type: 'sendMessage',
              id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              text: data.lastMessage,
              model: modelSelect.value,
              mode: modeSelect.value,
              reasoningEffort: reasoningSelect.value
            });
            retryBtn.remove();
          });
          messagesEl.appendChild(retryBtn);
          messagesEl.scrollTop = messagesEl.scrollHeight;
          break;
        }

      }
    });

    vscode.postMessage({ type: 'webviewReady' });
  </script>
</body>
</html>`;
 }
