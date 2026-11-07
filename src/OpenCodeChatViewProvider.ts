/**
 * OpenCode Chat for VS Code
 * Autor: Juan Pablo Fuentes Vivanco
 * Portafolio: https://juanpablofuentes.cl/
 * Repositorio: https://github.com/jpfuentesv/opencode-chat-vscode
 */

import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { getWebviewHtml } from './webviewHtml';

interface QueuedMessage {
  id: string;
  text: string;
  model: string;
  mode: string;
  reasoningEffort: string;
}

interface HistoryEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  thought?: string;
}

export class OpenCodeChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'opencode.chatView';
  private _view?: vscode.WebviewView;
  private _activeProcess?: ChildProcess;
  private _cancelledProcess?: ChildProcess;
  private _isBusy = false;
  private _messageQueue: QueuedMessage[] = [];
  private _history: HistoryEntry[] = [];
  private _opencodePath: string = 'opencode';
  private _currentSessionId?: string;
  private _availableModels: string[] = [];
  private _workspaceContextScan: { summary: string; prependText: string } | null = null;
  private _contextInjected = false;
  private _statusBar?: vscode.StatusBarItem;
  private _sessionStartTime?: number;
  private _timerInterval?: NodeJS.Timeout;
  private _currentStep = 0;
  private _totalSteps = 0;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context?: vscode.ExtensionContext
  ) {
    this._opencodePath = this._resolveOpenCodeBinary();
  }

  public setStatusBar(statusBar: vscode.StatusBarItem) {
    this._statusBar = statusBar;
  }

  /**
   * Resolves the root folder of the project currently opened in VS Code.
   * Falls back to the active editor's folder, then to the home directory.
   */
  private _getWorkspaceRoot(): string {
    // La carpeta del proyecto donde se abrio/invoco la extension
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath;
    }

    if (vscode.workspace.rootPath) {
      return vscode.workspace.rootPath;
    }

    // Fallback: carpeta del editor activo (archivo suelto sin workspace)
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const wf = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
      if (wf) return wf.uri.fsPath;
      try {
        const dir = path.dirname(activeEditor.document.uri.fsPath);
        if (dir && fs.existsSync(dir)) return dir;
      } catch {
        // ignore
      }
    }

    return os.homedir();
  }

  /**
   * Re-scan context when the opened project changes.
   */
  public resetWorkspaceContext() {
    this._workspaceContextScan = null;
    this._contextInjected = false;
    this._currentSessionId = undefined;
    this._triggerWorkspaceContextScan();
  }

  private _updateStatusBar(text: string, tooltip?: string) {
    if (this._statusBar) {
      this._statusBar.text = text;
      if (tooltip) this._statusBar.tooltip = tooltip;
    }
  }

  private _startTimer() {
    this._sessionStartTime = Date.now();
    this._timerInterval = setInterval(() => {
      if (this._sessionStartTime) {
        const elapsed = Math.floor((Date.now() - this._sessionStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        this._view?.webview.postMessage({
          type: 'timerUpdate',
          elapsed: timeStr
        });
      }
    }, 1000);
  }

  private _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = undefined;
    }
    this._sessionStartTime = undefined;
  }

  /**
   * Localiza el binario de OpenCode en macOS / Linux aunque VS Code se inicie desde el Dock
   */
  private _resolveOpenCodeBinary(): string {
    const home = os.homedir();
    const candidates = [
      path.join(home, '.opencode', 'bin', 'opencode'),
      '/opt/homebrew/bin/opencode',
      '/usr/local/bin/opencode',
      path.join(home, '.local', 'bin', 'opencode'),
      path.join(home, '.bun', 'bin', 'opencode'),
      path.join(home, 'Library', 'pnpm', 'opencode'),
      path.join(home, '.nvm', 'versions', 'node', process.version, 'bin', 'opencode')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'opencode';
  }

  private _getEnhancedEnv(): NodeJS.ProcessEnv {
    const home = os.homedir();
    const extraPaths = [
      path.join(home, '.opencode', 'bin'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
      path.join(home, '.local', 'bin'),
      path.join(home, '.bun', 'bin'),
      path.join(home, 'Library', 'pnpm')
    ].join(path.delimiter);

    return {
      ...process.env,
      PATH: `${extraPaths}${path.delimiter}${process.env.PATH || ''}`,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      CI: 'true'
    };
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'webviewReady': {
          this._checkConnection();
          this._fetchAvailableModels();
          this._triggerWorkspaceContextScan();
          break;
        }
        case 'fetchModels': {
          this._fetchAvailableModels();
          break;
        }
        case 'sendMessage': {
          this._handleIncomingMessage(
            {
              id: data.id || String(Date.now()),
              text: data.text,
              model: data.model || '',
              mode: data.mode || 'Normal',
              reasoningEffort: data.reasoningEffort || 'medium'
            },
            false
          );
          break;
        }
        case 'stopMessage': {
          this._stopActiveProcess();
          break;
        }
        case 'forceSendQueued': {
          this._forceSendFromQueue(data.id);
          break;
        }
        case 'removeQueued': {
          this._messageQueue = this._messageQueue.filter((m) => m.id !== data.id);
          this._syncQueueToWebview();
          break;
        }
        case 'deleteHistoryMessage': {
          this._history = this._history.filter((h) => h.id !== data.id);
          break;
        }
        case 'rollbackToMessage': {
          this._handleRollback(data.id);
          break;
        }
        case 'resetSession': {
          this._killActiveProcess();
          this._messageQueue = [];
          this._history = [];
          this._currentSessionId = undefined;
          this._isBusy = false;
          this._workspaceContextScan = null;
          this._contextInjected = false;
          this._syncQueueToWebview();
          this._view?.webview.postMessage({ type: 'sessionResetConfirmed' });
          // Re-scan workspace context for the new session
          this._triggerWorkspaceContextScan();
          break;
        }
        case 'exportConversation': {
          this._exportConversation(data.format || 'markdown');
          break;
        }
      }
    });
  }

  private _checkConnection() {
    const child = spawn(this._opencodePath, ['--version'], {
      env: this._getEnhancedEnv(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let versionOutput = '';
    child.stdout?.on('data', (d) => {
      versionOutput += d.toString().trim();
    });

    child.on('error', () => {
      this._view?.webview.postMessage({
        type: 'connectionStatus',
        connected: false,
        detail: 'OpenCode CLI no encontrado'
      });
    });

    child.on('close', (code) => {
      const isConnected = code === 0 || versionOutput.length > 0;
      const version = versionOutput.match(/\bv?(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)/i)?.[1];
      this._view?.webview.postMessage({
        type: 'connectionStatus',
        connected: isConnected,
        detail: isConnected ? `OpenCode${version ? ` v${version}` : ''}` : 'Desconectado'
      });
    });
  }

  private _fetchAvailableModels() {
    const child = spawn(this._opencodePath, ['models'], {
      env: this._getEnhancedEnv(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });

    child.on('close', () => {
      const stripAnsi = (s: string) => s.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const lines = stripAnsi(stdout)
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.toLowerCase().includes('available') && !l.startsWith('-'));

      if (lines.length > 0) {
        this._availableModels = lines;
      } else {
        this._availableModels = [
          'opencode/big-pickle',
          'opencode/deepseek-v4.1-flash-free',
          'deepseek/deepseek-r1',
          'anthropic/claude-3-7-sonnet',
          'openai/gpt-4o'
        ];
      }

      this._view?.webview.postMessage({
        type: 'modelsLoaded',
        models: this._availableModels
      });
    });
  }

  private async _triggerWorkspaceContextScan() {
    const docResult = await this._readAgentDocumentation();

    this._workspaceContextScan = docResult;
    this._view?.webview.postMessage({
      type: 'contextScanReady',
      summary: docResult.summary
    });
  }

  /**
   * Resuelve la carpeta del proyecto actual e inyecta la instrucción
   * contextual mínima necesaria para que el modelo identifique su directorio de trabajo.
   */
  private async _readAgentDocumentation(): Promise<{ summary: string; prependText: string }> {
    const rootPath = this._getWorkspaceRoot();
    const summary = `📁 Proyecto actual:\n${rootPath}`;
    const prependText = `[Directorio de trabajo: ${rootPath}. Todas las consultas y operaciones corresponden a este proyecto.]`;
    return { summary, prependText };
  }

  private _handleIncomingMessage(msg: QueuedMessage, forceImmediate: boolean) {
    if (forceImmediate) {
      this._killActiveProcess();
      this._isBusy = false;
      this._executeOpenCode(msg);
      return;
    }

    if (this._isBusy) {
      this._messageQueue.push(msg);
      this._syncQueueToWebview();
    } else {
      this._executeOpenCode(msg);
    }
  }

  private _forceSendFromQueue(id: string) {
    const index = this._messageQueue.findIndex((m) => m.id === id);
    if (index === -1) return;

    const [targetMsg] = this._messageQueue.splice(index, 1);
    this._syncQueueToWebview();
    this._killActiveProcess();
    this._isBusy = false;
    this._executeOpenCode(targetMsg);
  }

  /**
   * Detecta archivos modificados/creados en la respuesta del agente
   */
  private _detectFileChanges(fullText: string, fullThought: string) {
    const combined = fullText + '\n' + fullThought;
    // Look for file paths in tool output (common patterns)
    const filePatterns = [
      /(?:created|modified|updated|written|saved)\s+(?:file\s+)?['"`]?([^\s'"`]+\.\w{1,6})['"`]?/gi,
      /(?:File|Archivo)\s*[:=]\s*['"`]?([^\s'"`]+\.\w{1,6})['"`]?/gi,
      /\b([\w\-./]+\.(?:ts|tsx|js|jsx|json|md|py|go|rs|html|css|scss|vue|svelte|sql|sh))\b/gi
    ];

    const detectedFiles = new Set<string>();
    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(combined)) !== null) {
        const filePath = match[1];
        if (filePath && !filePath.includes('node_modules') && filePath.length < 200) {
          detectedFiles.add(filePath);
        }
      }
    }

    if (detectedFiles.size > 0) {
      const files = Array.from(detectedFiles).slice(0, 10);
      this._view?.webview.postMessage({
        type: 'filesChanged',
        files
      });
      // Also show VS Code notification
      vscode.window.showInformationMessage(
        `OpenCode modificó ${files.length} archivo(s): ${files.join(', ')}`,
        'Abrir carpeta'
      ).then((choice) => {
        if (choice === 'Abrir carpeta') {
          const folder = vscode.Uri.file(this._getWorkspaceRoot());
          vscode.commands.executeCommand('revealFileInOS', folder);
        }
      });
    }
  }

  /**
   * Exporta la conversación actual a Markdown
   */
  private _exportConversation(format: 'markdown' | 'json') {
    if (this._history.length === 0) {
      vscode.window.showWarningMessage('No hay mensajes para exportar.');
      return;
    }

    let content = '';
    if (format === 'markdown') {
      content = '# Conversación OpenCode Chat\n\n';
      content += `**Fecha:** ${new Date().toLocaleString()}\n`;
      content += `**Proyecto:** ${this._getWorkspaceRoot()}\n\n`;      content += '---\n\n';
      for (const entry of this._history) {
        if (entry.role === 'user') {
          content += `## Usuario\n\n${entry.text}\n\n`;
        } else {
          if (entry.thought) {
            content += `### Pensamiento\n\n${entry.thought}\n\n`;
          }
          content += `## Asistente\n\n${entry.text}\n\n`;
        }
        content += '---\n\n';
      }
    } else {
      content = JSON.stringify({
        exportedAt: new Date().toISOString(),
        project: this._getWorkspaceRoot(),        messages: this._history
      }, null, 2);
    }

    vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`opencode-chat-export.${format === 'markdown' ? 'md' : 'json'}`),
      filters: format === 'markdown'
        ? { 'Markdown': ['md'] }
        : { 'JSON': ['json'] }
    }).then((uri) => {
      if (uri) {
        vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8')).then(() => {
          vscode.window.showInformationMessage(`Conversación exportada a ${uri.fsPath}`);
        });
      }
    });
  }

  private _handleRollback(messageId: string) {
    this._killActiveProcess();
    this._isBusy = false;

    const idx = this._history.findIndex((h) => h.id === messageId);
    if (idx !== -1) {
      const targetEntry = this._history[idx];
      this._history = this._history.slice(0, idx);
      this._view?.webview.postMessage({
        type: 'rollbackConfirmed',
        id: messageId,
        restoredText: targetEntry.text
      });
    }
  }

  private _killActiveProcess() {
    if (this._activeProcess && !this._activeProcess.killed) {
      try {
        this._activeProcess.kill('SIGTERM');
      } catch {
        // Ignorar si ya murió
      }
      this._activeProcess = undefined;
    }
  }

  private _stopActiveProcess() {
    const activeProcess = this._activeProcess;
    if (!activeProcess || activeProcess.killed) return;

    this._cancelledProcess = activeProcess;
    try {
      if (!activeProcess.kill('SIGTERM')) {
        this._cancelledProcess = undefined;
      }
    } catch {
      this._cancelledProcess = undefined;
    }
  }

  private _syncQueueToWebview() {
    this._view?.webview.postMessage({
      type: 'queueUpdated',
      queue: this._messageQueue
    });
  }

  private _executeOpenCode(msg: QueuedMessage) {
    this._isBusy = true;
    this._currentStep = 0;
    this._startTimer();
    this._updateStatusBar('$(loading~spin) OpenCode: procesando...', 'OpenCode está procesando tu solicitud');
    let effectiveText = msg.text;

    // Prepend workspace context only once per new session/chat (solo si hay texto que inyectar)
    if (this._workspaceContextScan && !this._contextInjected && this._workspaceContextScan.prependText.trim().length > 0) {
      effectiveText = `${this._workspaceContextScan.prependText}\n\n${msg.text}`;
      this._contextInjected = true;
    } else if (this._workspaceContextScan && !this._contextInjected) {
      this._contextInjected = true;
    }

    this._history.push({ id: msg.id, role: 'user', text: effectiveText });

    const assistantMsgId = 'ast_' + Date.now();
    this._view?.webview.postMessage({
      type: 'startUserAndAssistant',
      userMsg: { ...msg, text: effectiveText },
      assistantId: assistantMsgId
    });

    const workspaceFolder = this._getWorkspaceRoot();

    // Flags oficiales de OpenCode v2.2.5: JSON streaming + Auto-Approve + Thinking
    const args: string[] = ['run', '--format', 'json', '--auto'];

    if (msg.reasoningEffort !== 'off') {
      args.push('--thinking');
    }

    if (msg.mode && msg.mode.toLowerCase() === 'plan') {
      args.push('--agent', 'plan');
    }

    if (this._currentSessionId) {
      args.push('--session', this._currentSessionId);
    }

    if (msg.model && msg.model.trim() !== '' && msg.model !== 'default') {
      let modelSpec = msg.model.trim();
      // Si el usuario eligió Low o High y el modelo soporta variantes (#variant), se adjunta si aún no tiene #
      if ((msg.reasoningEffort === 'low' || msg.reasoningEffort === 'high') && !modelSpec.includes('#')) {
        // Nota: Si usas modelos con variantes explícitas se pueden activar aquí; por defecto --thinking ya muestra el bloque
      }
      args.push('--model', modelSpec);
    }

    args.push(effectiveText);

    const child = spawn(this._opencodePath, args, {
      cwd: workspaceFolder,
      env: this._getEnhancedEnv(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // CRÍTICO: Cerrar stdin inmediatamente para que OpenCode CLI no quede esperando EOF infinito
    child.stdin?.end();

    this._activeProcess = child;
    let assistantBuffer = '';
    let thoughtBuffer = '';
    let stdoutRemainder = '';
    let isInsideThinkTag = false;

    const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    const processLine = (rawLine: string) => {
      const cleaned = stripAnsi(rawLine);
      const trimmed = cleaned.trim();
      if (!trimmed) return;

      // 1. Intentar decodificar evento JSONL de OpenCode (--format json)
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const ev = JSON.parse(trimmed);

          if (ev.sessionID) {
            this._currentSessionId = ev.sessionID;
          }

          const evType = ev.type || '';
          const partType = ev.part?.type || '';

          // Bloques de razonamiento / pensamiento nativos (incluyendo el tab /thinking de OpenCode 2.2.5)
          if (
            evType === 'reasoning' ||
            evType === 'thinking' ||
            partType === 'reasoning' ||
            partType === 'thinking' ||
            partType === 'thought'
          ) {
            const rText = ev.part?.text || ev.part?.reasoning || ev.text || ev.content || '';
            if (rText) {
              thoughtBuffer += rText;
              this._view?.webview.postMessage({
                type: 'thoughtChunk',
                assistantId: assistantMsgId,
                text: rText
              });
            }
            return;
          }

          // Uso de herramientas / pasos del agente
          if (evType === 'tool_use' || partType === 'tool' || partType === 'tool-invocation' || evType === 'step_start') {
            const toolName = ev.part?.tool || ev.tool || '';
            const stateTitle = ev.part?.state?.title || ev.title || '';
            const input = ev.part?.state?.input || ev.input || {};
            let commandRaw = '';
            if (input.command) commandRaw = input.command;
            else if (input.cmd) commandRaw = input.cmd;
            else if (input.pattern && (input.path || input.filePath || input.file)) commandRaw = `${input.pattern} en ${input.path || input.filePath || input.file}`;
            else if (input.pattern) commandRaw = input.pattern;
            else if (input.path || input.filePath || input.file) commandRaw = input.path || input.filePath || input.file;
            else if (input.query) commandRaw = input.query;
            else if (input.url) commandRaw = input.url;
            else if (input.glob) commandRaw = input.glob;
            const command = typeof commandRaw === 'string' ? commandRaw.trim().slice(0, 100) : '';
            const baseDesc = stateTitle || (toolName ? `Ejecutando herramienta: ${toolName}` : 'Analizando contexto del proyecto...');
            const stepDesc = command ? `${baseDesc}: ${command}` : baseDesc;

            const formattedStep = `▸ ${stepDesc}\n`;
            thoughtBuffer += formattedStep;
            this._view?.webview.postMessage({
              type: 'thoughtChunk',
              assistantId: assistantMsgId,
              text: formattedStep
            });
            // Notificar al webview sobre la tarea en segundo plano
            this._view?.webview.postMessage({
              type: 'backgroundTask',
              taskName: stepDesc
            });
            this._currentStep++;
            this._view?.webview.postMessage({
              type: 'stepProgress',
              step: this._currentStep
            });
            return;
          }

          // Respuesta de texto del asistente
          if (evType === 'text' || partType === 'text' || ev.part?.text || ev.text || ev.content || ev.delta) {
            const txt = ev.part?.text ?? ev.text ?? ev.content ?? ev.delta ?? '';
            if (typeof txt === 'string' && txt.length > 0) {
              this._routeTextWithThinkTags(txt, assistantMsgId, (t) => {
                thoughtBuffer += t;
              }, (a) => {
                assistantBuffer += a;
              }, () => isInsideThinkTag, (val) => {
                isInsideThinkTag = val;
              });
            }
            return;
          }

          // Errores reportados en JSON
          if (evType === 'error' || ev.error) {
            const errMsg = ev.error?.data?.message || ev.error?.message || ev.message || JSON.stringify(ev.error);
            const formattedErr = `\n[Aviso] ${errMsg}\n`;
            assistantBuffer += formattedErr;
            this._view?.webview.postMessage({
              type: 'chunk',
              assistantId: assistantMsgId,
              text: formattedErr
            });
            return;
          }

          return;
        } catch {
          // Si falla el JSON.parse, se procesa abajo como texto plano
        }
      }

      // 2. Fallback para texto plano o etiquetas <think>
      this._routeTextWithThinkTags(
        cleaned + '\n',
        assistantMsgId,
        (t) => { thoughtBuffer += t; },
        (a) => { assistantBuffer += a; },
        () => isInsideThinkTag,
        (val) => { isInsideThinkTag = val; }
      );
    };

    child.stdout?.on('data', (chunk) => {
      stdoutRemainder += chunk.toString();
      const lines = stdoutRemainder.split('\n');
      stdoutRemainder = lines.pop() || '';
      for (const line of lines) {
        processLine(line);
      }
    });

    child.stderr?.on('data', (chunk) => {
      const rawErr = stripAnsi(chunk.toString()).trim();
      if (!rawErr || rawErr.toLowerCase().includes('debugger')) return;

      thoughtBuffer += `${rawErr}\n`;
      this._view?.webview.postMessage({
        type: 'thoughtChunk',
        assistantId: assistantMsgId,
        text: `${rawErr}\n`
      });
    });

    child.on('error', (err) => {
      if (this._cancelledProcess === child) {
        this._cancelledProcess = undefined;
      }
      this._view?.webview.postMessage({
        type: 'chunk',
        assistantId: assistantMsgId,
        text: `\n[Aviso] Error al conectar con OpenCode CLI: ${err.message}`
      });
      this._finishTurn(assistantMsgId, assistantBuffer, thoughtBuffer);
    });

    child.on('close', (code) => {
      if (this._cancelledProcess === child) {
        this._cancelledProcess = undefined;
        const stoppedText = '\n\nConsulta detenida por el usuario.';
        assistantBuffer += stoppedText;
        this._view?.webview.postMessage({
          type: 'chunk',
          assistantId: assistantMsgId,
          text: stoppedText
        });
      }
      if (stdoutRemainder.trim().length > 0) {
        processLine(stdoutRemainder);
        stdoutRemainder = '';
      }
      if (!assistantBuffer && !thoughtBuffer && code !== 0 && code !== null) {
        this._view?.webview.postMessage({
          type: 'chunk',
          assistantId: assistantMsgId,
          text: `[Aviso] El proceso de OpenCode terminó con código ${code}. Prueba dejando el selector en el modelo por defecto.`
        });
        this._view?.webview.postMessage({
          type: 'errorOccurred',
          assistantId: assistantMsgId,
          lastMessage: msg.text,
          code
        });
      }
      this._finishTurn(assistantMsgId, assistantBuffer, thoughtBuffer);
    });
  }

  /**
   * Separa cualquier etiqueta <think>...</think> que venga embebida dentro del texto
   */
  private _routeTextWithThinkTags(
    input: string,
    assistantId: string,
    onThought: (t: string) => void,
    onAssistant: (a: string) => void,
    getInside: () => boolean,
    setInside: (v: boolean) => void
  ) {
    let remaining = input;
    while (remaining.length > 0) {
      if (!getInside()) {
        const startIdx = remaining.indexOf('<think>');
        if (startIdx !== -1) {
          const before = remaining.slice(0, startIdx);
          if (before) {
            onAssistant(before);
            this._view?.webview.postMessage({ type: 'chunk', assistantId, text: before });
          }
          setInside(true);
          remaining = remaining.slice(startIdx + 7);
        } else {
          onAssistant(remaining);
          this._view?.webview.postMessage({ type: 'chunk', assistantId, text: remaining });
          break;
        }
      } else {
        const endIdx = remaining.indexOf('</think>');
        if (endIdx !== -1) {
          const thoughtPart = remaining.slice(0, endIdx);
          if (thoughtPart) {
            onThought(thoughtPart);
            this._view?.webview.postMessage({ type: 'thoughtChunk', assistantId, text: thoughtPart });
          }
          setInside(false);
          remaining = remaining.slice(endIdx + 8);
        } else {
          onThought(remaining);
          this._view?.webview.postMessage({ type: 'thoughtChunk', assistantId, text: remaining });
          break;
        }
      }
    }
  }

  private _finishTurn(assistantId: string, fullText: string, fullThought: string) {
    this._history.push({ id: assistantId, role: 'assistant', text: fullText, thought: fullThought });
    this._isBusy = false;
    this._activeProcess = undefined;
    this._stopTimer();

    // Show notification on completion
    this._view?.webview.postMessage({
      type: 'agentFinished',
      assistantId
    });

    // Update status bar
    this._updateStatusBar('$(check) OpenCode: listo', 'OpenCode está listo para tu próxima solicitud');

    // Detect file changes in the response
    this._detectFileChanges(fullText, fullThought);
    this._view?.webview.postMessage({
      type: 'done',
      assistantId,
      hasQueuedMessages: this._messageQueue.length > 0
    });

    if (this._messageQueue.length > 0) {
      const nextMsg = this._messageQueue.shift()!;
      this._syncQueueToWebview();
      this._executeOpenCode(nextMsg);
    }
  }

  private _getHtmlForWebview(): string {
    return getWebviewHtml();
  }
}
