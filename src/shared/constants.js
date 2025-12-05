/**
 * アプリケーション全体で使用する定数
 */

const path = require("path");
const { app } = require("electron");

// アプリケーションデータディレクトリ
const APP_DATA_DIR = app
  ? app.getPath("userData")
  : path.join(process.env.HOME, "Library", "Application Support", "Othello");

// モデル保存ディレクトリ
const MODELS_DIR = path.join(APP_DATA_DIR, "models");

// データベースパス
const DB_PATH = path.join(APP_DATA_DIR, "games.db");

// 設定ファイルパス
const SETTINGS_PATH = path.join(APP_DATA_DIR, "settings.json");

// ゲーム定数
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// ボードサイズ
const BOARD_SIZE = 8;

// デフォルトAI設定
const DEFAULT_AI_CONFIG = {
  thinkingTime: 3000, // ミリ秒
  temperature: 0.7,
  maxTokens: 50,
};

// プリセット難易度
const DIFFICULTY_PRESETS = {
  easy: {
    temperature: 1.0,
    thinkingTime: 1000,
    description: "初心者向け - ランダム性が高い",
  },
  medium: {
    temperature: 0.7,
    thinkingTime: 3000,
    description: "中級者向け - バランス型",
  },
  hard: {
    temperature: 0.3,
    thinkingTime: 5000,
    description: "上級者向け - 戦略的",
  },
};

// IPC チャンネル
const IPC_CHANNELS = {
  MODELS_DIR_SELECT: "modelsDir:select",
  MODELS_DIR_GET: "modelsDir:get",
  MODELS_DIR_SET: "modelsDir:set",
};

// デフォルト設定
const DEFAULT_SETTINGS = {
  modelsDirectory: MODELS_DIR,
};

module.exports = {
  APP_DATA_DIR,
  MODELS_DIR,
  DB_PATH,
  SETTINGS_PATH,
  EMPTY,
  BLACK,
  WHITE,
  BOARD_SIZE,
  DEFAULT_AI_CONFIG,
  DIFFICULTY_PRESETS,
  IPC_CHANNELS,
  DEFAULT_SETTINGS,
};
