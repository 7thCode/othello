/**
 * IPC通信ハンドラー
 * レンダラープロセスとメインプロセス間の通信を処理
 */

const { ipcMain, dialog } = require('electron');
const presetModels = require('../shared/preset-models.json');

class IPCHandlers {
    constructor(win, modelManager, modelDownloader, llamaManager, othelloEngine, othelloAI) {
        this.win = win;
        this.modelManager = modelManager;
        this.modelDownloader = modelDownloader;
        this.llamaManager = llamaManager;
        this.othelloEngine = othelloEngine;
        this.othelloAI = othelloAI;
    }

    /**
     * すべてのIPCハンドラーを登録
     */
    registerAll() {
        this.registerModelHandlers();
        this.registerGameHandlers();
    }

    /**
     * モデル関連のハンドラーを登録
     */
    registerModelHandlers() {
        // モデル一覧取得
        ipcMain.handle('model:list', async () => {
            try {
                return await this.modelManager.listModels();
            } catch (error) {
                console.error('model:list error:', error);
                throw error;
            }
        });

        // プリセットモデル一覧取得
        ipcMain.handle('model:presets', async () => {
            return presetModels.models;
        });

        // モデル手動追加
        ipcMain.handle('model:add', async () => {
            try {
                const result = await dialog.showOpenDialog(this.win, {
                    title: 'モデルファイルを選択',
                    filters: [{ name: 'GGUF Models', extensions: ['gguf'] }],
                    properties: ['openFile'],
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return { canceled: true };
                }

                const model = await this.modelManager.addModel(result.filePaths[0]);
                return { success: true, model };
            } catch (error) {
                console.error('model:add error:', error);
                throw error;
            }
        });

        // モデル削除
        ipcMain.handle('model:delete', async (event, modelId) => {
            try {
                await this.modelManager.deleteModel(modelId);
                return { success: true };
            } catch (error) {
                console.error('model:delete error:', error);
                throw error;
            }
        });

        // モデルダウンロード
        ipcMain.handle('model:download', async (event, modelConfig) => {
            try {
                const result = await this.modelDownloader.downloadModel(modelConfig);
                return result;
            } catch (error) {
                console.error('model:download error:', error);
                throw error;
            }
        });

        // ダウンロードキャンセル
        ipcMain.handle('model:cancelDownload', async (event, downloadId) => {
            try {
                return this.modelDownloader.cancelDownload(downloadId);
            } catch (error) {
                console.error('model:cancelDownload error:', error);
                throw error;
            }
        });

        // モデルロード
        ipcMain.handle('model:load', async (event, modelPath) => {
            try {
                this.win.webContents.send('model:loadStatus', { status: 'loading' });
                const result = await this.llamaManager.loadModel(modelPath);
                this.win.webContents.send('model:loadStatus', { status: 'loaded', modelPath });
                return result;
            } catch (error) {
                this.win.webContents.send('model:loadStatus', { status: 'error', error: error.message });
                console.error('model:load error:', error);
                throw error;
            }
        });

        // モデルアンロード
        ipcMain.handle('model:unload', async () => {
            try {
                await this.llamaManager.unloadModel();
                return { success: true };
            } catch (error) {
                console.error('model:unload error:', error);
                throw error;
            }
        });

        // 現在のモデル情報取得
        ipcMain.handle('model:current', async () => {
            return {
                modelPath: this.llamaManager.getCurrentModelPath(),
                isLoaded: this.llamaManager.isModelLoaded(),
            };
        });
    }

    /**
     * ゲーム関連のハンドラーを登録
     */
    registerGameHandlers() {
        // 新しいゲームを開始
        ipcMain.handle('game:new', async () => {
            try {
                const gameState = this.othelloEngine.newGame();
                return { success: true, gameState };
            } catch (error) {
                console.error('game:new error:', error);
                throw error;
            }
        });

        // ゲーム状態取得
        ipcMain.handle('game:getState', async () => {
            try {
                return this.othelloEngine.getGameState();
            } catch (error) {
                console.error('game:getState error:', error);
                throw error;
            }
        });

        // 人間の手を処理
        ipcMain.handle('game:makeMove', async (event, { row, col, player }) => {
            try {
                const result = this.othelloEngine.makeMove(row, col, player);
                return result;
            } catch (error) {
                console.error('game:makeMove error:', error);
                throw error;
            }
        });

        // 合法手一覧を取得
        ipcMain.handle('game:getValidMoves', async (event, player) => {
            try {
                const moves = this.othelloEngine.getValidMoves(player);
                return moves;
            } catch (error) {
                console.error('game:getValidMoves error:', error);
                throw error;
            }
        });

        // AIの手を取得
        ipcMain.handle('game:getAIMove', async (event, { board, player, validMoves, options }) => {
            try {
                this.win.webContents.send('ai:thinking', { status: 'thinking' });

                const move = await this.othelloAI.getMove(board, player, validMoves, options);

                this.win.webContents.send('ai:thinking', { status: 'done' });

                return { success: true, move };
            } catch (error) {
                this.win.webContents.send('ai:thinking', { status: 'error', error: error.message });
                console.error('game:getAIMove error:', error);
                throw error;
            }
        });
    }
}

module.exports = IPCHandlers;
