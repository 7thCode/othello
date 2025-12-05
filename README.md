# Othello - ローカルLLM対戦型オセロゲーム

ElectronとローカルLLMを使用した人間対AIのオセロゲーム

## 概要

OthelloアプリケーションはローカルLLM（llama.cpp）を使用してAI対戦相手と対局できるオセロゲームです。Metal GPUアクセラレーションに対応し、プライバシーを完全に保護します。

### 主要機能

- ✅ **LLMベースのAI対戦** - ローカルで動作する知的な対戦相手
- ✅ **HuggingFaceモデルストア** - 難易度別のプリセットモデルを1クリックダウンロード
- ✅ **難易度調整** - 初級・中級・上級の3段階
- ✅ **美しいUI** - アニメーション付きのダークモードインターフェース
- ✅ **Metal GPU加速** - macOS最適化で高速AI思考
- ✅ **完全プライベート** - すべてローカルで動作、データは外部送信なし

## 必要環境

- macOS 13 (Ventura) 以降
- Node.js 18以降
- メモリ: 8GB以上（推奨: 16GB）
- ストレージ: モデルごとに1-5GB
- Metal対応GPU（Apple Silicon推奨）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ネイティブモジュールのリビルド

```bash
npm run rebuild
```

このステップは`node-llama-cpp`のネイティブバインディングをElectron用にビルドするために必要です。

## 使用方法

### アプリの起動

```bash
npm start
```

開発モード（DevTools付き）:
```bash
npm run dev
```

### モデルのダウンロード

1. アプリを起動
2. ヘッダーの **🏪 ボタン** をクリック
3. モデルストアから難易度に応じたモデルを選択
4. **ダウンロード** ボタンをクリック
5. プログレスバーでダウンロード進捗を確認

#### プリセットモデル一覧

| モデル | サイズ | 難易度 | 特徴 |
|--------|--------|--------|------|
| TinyLlama 1.1B | 669MB | 初級 | 超高速レスポンス、初心者向け |
| Phi-3 Mini 4K | 2.2GB | 中級 | 速度と強さのバランス型 |
| Mistral 7B | 4.1GB | 上級 | 高度な戦略、上級者向け |
| Qwen 2.5 7B | 4.3GB | 上級 | 多言語対応、強力な推論能力 |

### ゲームの開始

1. **設定** (⚙️) からモデルを選択してロード
2. 先手/後手を選択
3. **新しいゲーム** ボタンをクリック
4. ボード上の緑の点（合法手）をクリックして石を置く
5. AIが自動的に応手を考えます

### 設定

- **モデル選択**: インストール済みモデルからAI用モデルを選択
- **AI難易度**: 初級・中級・上級から選択（温度パラメータが変化）
- **先手/後手**: 黒（先手）または白（後手）を選択
- **ヒント表示**: 合法手の表示ON/OFF

## モデルの保存場所

ダウンロード・追加したモデルは以下の場所に保存されます：

```
~/Library/Application Support/Othello/models/
```

## 開発

### プロジェクト構造

```
othello/
├── src/
│   ├── main/                    # メインプロセス（Node.js環境）
│   │   ├── main.js              # Electronエントリーポイント
│   │   ├── llama-manager.js     # llama.cpp統合・推論管理
│   │   ├── model-manager.js     # GGUFモデルファイル管理
│   │   ├── model-downloader.js  # HuggingFaceダウンロード管理
│   │   ├── othello-engine.js    # オセロゲームロジック
│   │   ├── othello-ai.js        # LLMベースのAI
│   │   └── ipc-handlers.js      # IPC通信ハンドラー
│   ├── renderer/                # レンダラープロセス（ブラウザ環境）
│   │   ├── index.html           # メインHTML
│   │   ├── app.js               # UIメインロジック
│   │   ├── components/
│   │   │   ├── model-store.js   # モデルストアUI
│   │   │   └── settings-panel.js # 設定パネルUI
│   │   └── styles/
│   │       ├── main.css         # グローバルスタイル
│   │       ├── board.css        # ボードスタイル
│   │       ├── model-store.css  # モデルストアスタイル
│   │       └── settings.css     # 設定パネルスタイル
│   ├── preload.js               # プリロードスクリプト（セキュアAPI公開）
│   └── shared/
│       ├── constants.js         # 定数定義
│       └── preset-models.json   # プリセットモデル定義
├── build/
│   └── entitlements.mac.plist   # macOSコード署名設定
└── package.json
```

### 技術スタック

| 領域 | 技術 |
|------|------|
| **フレームワーク** | Electron |
| **LLM統合** | node-llama-cpp (Metal GPU対応) |
| **データベース** | better-sqlite3 |
| **UI** | Vanilla JS + CSS |
| **ビルド** | electron-builder |

### ビルド（配布用パッケージ作成）

```bash
# macOS用DMGファイルを自動生成
npm run package:mac
```

## トラブルシューティング

### モデルが読み込めない

- メモリが十分にあるか確認（8GB以上推奨）
- GGUFファイルが破損していないか確認
- `npm run rebuild`を再実行

### AIが反応しない

- モデルが正しくロードされているか確認
- 設定パネルでモデルのロード状況を確認
- 開発モードで起動してコンソールログを確認

### アプリが起動しない

```bash
# キャッシュをクリア
rm -rf node_modules
npm install
npm run rebuild
```

## ライセンス

MIT

## 参考

- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)
- [Electron](https://www.electronjs.org/)
- [Hugging Face](https://huggingface.co/)
