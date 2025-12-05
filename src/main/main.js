/**
 * Electronメインプロセス
 */

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const ModelManager = require("./model-manager");
const ModelDownloader = require("./model-downloader");
const LlamaManager = require("./llama-manager");
const OthelloEngine = require("./othello-engine");
const OthelloAI = require("./othello-ai");
const IPCHandlers = require("./ipc-handlers");
const { SETTINGS_PATH } = require("../shared/constants");

let mainWindow = null;
let modelManager = null;
let modelDownloader = null;
let llamaManager = null;
let othelloEngine = null;
let othelloAI = null;
let ipcHandlers = null;

/**
 * メインウィンドウを作成
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1a1a1a",
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // 開発モードならDevToolsを開く
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * アプリケーション初期化
 */
async function initialize() {
  try {
    // 設定ファイルから保存されたモデルディレクトリを読み込み
    let modelsDirectory = null;
    try {
      await fs.access(SETTINGS_PATH);
      const data = await fs.readFile(SETTINGS_PATH, "utf-8");
      const settings = JSON.parse(data);
      modelsDirectory = settings.modelsDirectory;
      console.log("Loaded models directory from settings:", modelsDirectory);
    } catch {
      console.log("No saved models directory, using default");
    }

    // モデルマネージャー初期化
    modelManager = new ModelManager(modelsDirectory);
    await modelManager.initialize();

    // モデルダウンローダー初期化
    modelDownloader = new ModelDownloader(
      mainWindow,
      modelManager.getModelsDirectory()
    );

    // LLMマネージャー初期化
    llamaManager = new LlamaManager();

    // ゲームエンジン初期化
    othelloEngine = new OthelloEngine();

    // AI初期化
    othelloAI = new OthelloAI(llamaManager);

    // IPCハンドラー登録
    ipcHandlers = new IPCHandlers(
      mainWindow,
      modelManager,
      modelDownloader,
      llamaManager,
      othelloEngine,
      othelloAI
    );
    ipcHandlers.registerAll();

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
}

/**
 * アプリケーション起動
 */
app.on("ready", async () => {
  createWindow();
  await initialize();
});

/**
 * すべてのウィンドウが閉じられた時
 */
app.on("window-all-closed", async () => {
  // LLMをアンロード
  if (llamaManager) {
    await llamaManager.unloadModel();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * アクティベート時（macOS）
 */
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * アプリケーション終了前
 */
app.on("will-quit", async () => {
  if (llamaManager) {
    await llamaManager.unloadModel();
  }
});
