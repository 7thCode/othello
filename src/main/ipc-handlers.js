/**
 * IPC通信ハンドラー
 * レンダラープロセスとメインプロセス間の通信を処理
 */

const { ipcMain, dialog } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const presetModels = require("../shared/preset-models.json");
const {
  SETTINGS_PATH,
  DEFAULT_SETTINGS,
  IPC_CHANNELS,
} = require("../shared/constants");

class IPCHandlers {
  constructor(
    win,
    modelManager,
    modelDownloader,
    llamaManager,
    othelloEngine,
    othelloAI
  ) {
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
    this.registerModelsDirHandlers();
  }

  /**
   * モデル関連のハンドラーを登録
   */
  registerModelHandlers() {
    // モデル一覧取得
    ipcMain.handle("model:list", async () => {
      try {
        return await this.modelManager.listModels();
      } catch (error) {
        console.error("model:list error:", error);
        throw error;
      }
    });

    // プリセットモデル一覧取得
    ipcMain.handle("model:presets", async () => {
      return presetModels.models;
    });

    // モデル手動追加
    ipcMain.handle("model:add", async () => {
      try {
        const result = await dialog.showOpenDialog(this.win, {
          title: "モデルファイルを選択",
          filters: [{ name: "GGUF Models", extensions: ["gguf"] }],
          properties: ["openFile"],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { canceled: true };
        }

        const model = await this.modelManager.addModel(result.filePaths[0]);
        return { success: true, model };
      } catch (error) {
        console.error("model:add error:", error);
        throw error;
      }
    });

    // モデル削除
    ipcMain.handle("model:delete", async (event, modelId) => {
      try {
        await this.modelManager.deleteModel(modelId);
        return { success: true };
      } catch (error) {
        console.error("model:delete error:", error);
        throw error;
      }
    });

    // モデルダウンロード
    ipcMain.handle("model:download", async (event, modelConfig) => {
      try {
        const result = await this.modelDownloader.downloadModel(modelConfig);
        return result;
      } catch (error) {
        console.error("model:download error:", error);
        throw error;
      }
    });

    // ダウンロードキャンセル
    ipcMain.handle("model:cancelDownload", async (event, downloadId) => {
      try {
        return this.modelDownloader.cancelDownload(downloadId);
      } catch (error) {
        console.error("model:cancelDownload error:", error);
        throw error;
      }
    });

    // モデルロード
    ipcMain.handle("model:load", async (event, modelPath) => {
      try {
        this.win.webContents.send("model:loadStatus", { status: "loading" });
        const result = await this.llamaManager.loadModel(modelPath);
        this.win.webContents.send("model:loadStatus", {
          status: "loaded",
          modelPath,
        });
        return result;
      } catch (error) {
        this.win.webContents.send("model:loadStatus", {
          status: "error",
          error: error.message,
        });
        console.error("model:load error:", error);
        throw error;
      }
    });

    // モデルアンロード
    ipcMain.handle("model:unload", async () => {
      try {
        await this.llamaManager.unloadModel();
        return { success: true };
      } catch (error) {
        console.error("model:unload error:", error);
        throw error;
      }
    });

    // 現在のモデル情報取得
    ipcMain.handle("model:current", async () => {
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
    ipcMain.handle("game:new", async () => {
      try {
        const gameState = this.othelloEngine.newGame();
        return { success: true, gameState };
      } catch (error) {
        console.error("game:new error:", error);
        throw error;
      }
    });

    // ゲーム状態取得
    ipcMain.handle("game:getState", async () => {
      try {
        return this.othelloEngine.getGameState();
      } catch (error) {
        console.error("game:getState error:", error);
        throw error;
      }
    });

    // 人間の手を処理
    ipcMain.handle("game:makeMove", async (event, { row, col, player }) => {
      try {
        const result = this.othelloEngine.makeMove(row, col, player);
        return result;
      } catch (error) {
        console.error("game:makeMove error:", error);
        throw error;
      }
    });

    // 合法手一覧を取得
    ipcMain.handle("game:getValidMoves", async (event, player) => {
      try {
        const moves = this.othelloEngine.getValidMoves(player);
        return moves;
      } catch (error) {
        console.error("game:getValidMoves error:", error);
        throw error;
      }
    });

    // AIの手を取得
    ipcMain.handle(
      "game:getAIMove",
      async (event, { board, player, validMoves, options }) => {
        try {
          this.win.webContents.send("ai:thinking", { status: "thinking" });

          const move = await this.othelloAI.getMove(
            board,
            player,
            validMoves,
            options
          );

          this.win.webContents.send("ai:thinking", { status: "done" });

          return { success: true, move };
        } catch (error) {
          this.win.webContents.send("ai:thinking", {
            status: "error",
            error: error.message,
          });
          console.error("game:getAIMove error:", error);
          throw error;
        }
      }
    );
  }

  /**
   * モデルディレクトリ関連のハンドラーを登録
   */
  registerModelsDirHandlers() {
    // モデルディレクトリ選択ダイアログ
    ipcMain.handle(IPC_CHANNELS.MODELS_DIR_SELECT, async () => {
      try {
        const result = await dialog.showOpenDialog(this.win, {
          title: "モデル保存ディレクトリを選択",
          properties: ["openDirectory", "createDirectory"],
          message: "GGUFモデルファイルを保存するディレクトリを選択してください",
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { canceled: true };
        }

        return { success: true, path: result.filePaths[0] };
      } catch (error) {
        console.error("modelsDir:select error:", error);
        throw error;
      }
    });

    // モデルディレクトリを取得
    ipcMain.handle(IPC_CHANNELS.MODELS_DIR_GET, async () => {
      try {
        return {
          success: true,
          path: this.modelManager.getModelsDirectory(),
        };
      } catch (error) {
        console.error("modelsDir:get error:", error);
        throw error;
      }
    });

    // モデルディレクトリを設定
    ipcMain.handle(IPC_CHANNELS.MODELS_DIR_SET, async (event, dirPath) => {
      try {
        // ディレクトリの存在確認
        await fs.access(dirPath);

        // ModelManagerとModelDownloaderのディレクトリを更新
        this.modelManager.setModelsDirectory(dirPath);
        if (this.modelDownloader) {
          this.modelDownloader.setModelsDirectory(dirPath);
        }

        // 設定に保存
        let settings = { ...DEFAULT_SETTINGS };
        try {
          const data = await fs.readFile(SETTINGS_PATH, "utf-8");
          settings = { ...settings, ...JSON.parse(data) };
        } catch {
          // 設定ファイルが存在しない場合はデフォルト値を使用
        }

        settings.modelsDirectory = dirPath;

        // 設定ファイルのディレクトリを作成
        const path = require("path");
        await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
        await fs.writeFile(
          SETTINGS_PATH,
          JSON.stringify(settings, null, 2),
          "utf-8"
        );

        console.log("Models directory updated:", dirPath);
        return { success: true };
      } catch (error) {
        console.error("modelsDir:set error:", error);
        throw error;
      }
    });
  }
}

module.exports = IPCHandlers;
