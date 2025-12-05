/**
 * プリロードスクリプト
 * セキュアにAPIをレンダラープロセスに公開
 */

const { contextBridge, ipcRenderer } = require("electron");

// セキュアなAPIを公開
contextBridge.exposeInMainWorld("api", {
  // モデル管理
  model: {
    list: () => ipcRenderer.invoke("model:list"),
    presets: () => ipcRenderer.invoke("model:presets"),
    add: () => ipcRenderer.invoke("model:add"),
    delete: (modelId) => ipcRenderer.invoke("model:delete", modelId),
    download: (modelConfig) =>
      ipcRenderer.invoke("model:download", modelConfig),
    cancelDownload: (downloadId) =>
      ipcRenderer.invoke("model:cancelDownload", downloadId),
    load: (modelPath) => ipcRenderer.invoke("model:load", modelPath),
    unload: () => ipcRenderer.invoke("model:unload"),
    current: () => ipcRenderer.invoke("model:current"),

    // イベントリスナー
    onDownloadProgress: (callback) => {
      ipcRenderer.on("download:progress", (event, data) => callback(data));
    },
    onDownloadComplete: (callback) => {
      ipcRenderer.on("download:complete", (event, data) => callback(data));
    },
    onDownloadError: (callback) => {
      ipcRenderer.on("download:error", (event, data) => callback(data));
    },
    onLoadStatus: (callback) => {
      ipcRenderer.on("model:loadStatus", (event, data) => callback(data));
    },
  },

  // モデルディレクトリ管理
  modelsDir: {
    select: () => ipcRenderer.invoke("modelsDir:select"),
    get: () => ipcRenderer.invoke("modelsDir:get"),
    set: (dirPath) => ipcRenderer.invoke("modelsDir:set", dirPath),
  },

  // ゲーム
  game: {
    new: () => ipcRenderer.invoke("game:new"),
    getState: () => ipcRenderer.invoke("game:getState"),
    makeMove: (data) => ipcRenderer.invoke("game:makeMove", data),
    getValidMoves: (player) => ipcRenderer.invoke("game:getValidMoves", player),
    getAIMove: (data) => ipcRenderer.invoke("game:getAIMove", data),

    // イベントリスナー
    onAIThinking: (callback) => {
      ipcRenderer.on("ai:thinking", (event, data) => callback(data));
    },
  },
});
