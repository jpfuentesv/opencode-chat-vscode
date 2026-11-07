import * as vscode from 'vscode';
import { OpenCodeChatViewProvider } from './OpenCodeChatViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new OpenCodeChatViewProvider(context.extensionUri, context);

    // Status bar item for agent status
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(comment-discussion) OpenCode';
    statusBar.tooltip = 'OpenCode Chat - Haz clic para abrir';
    statusBar.command = 'workbench.view.extension.opencode-sidebar';
    statusBar.show();
    context.subscriptions.push(statusBar);

    // Pass status bar to provider
    provider.setStatusBar(statusBar);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            OpenCodeChatViewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // React to workspace folder changes so the chat always starts in the
    // currently opened project root instead of a stale/previous one.
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            provider.resetWorkspaceContext();
        })
    );
}

export function deactivate() { }