# Othello - ローカル LLM 対戦型オセロゲーム

Electron とローカル LLM を使用した人間対 AI のオセロゲーム

## 概要

Othello アプリケーションはローカル LLM（llama.cpp）を使用して AI 対戦相手と対局できるオセロゲームです。Metal GPU アクセラレーションに対応し、プライバシーを完全に保護します。

### 主要機能

- ✅ **LLM ベースの AI 対戦** - ローカルで動作する知的な対戦相手
- ✅ **HuggingFace モデルストア** - 難易度別のプリセットモデルを 1 クリックダウンロード
- ✅ **難易度調整** - 初級・中級・上級の 3 段階
- ✅ **美しい UI** - アニメーション付きのダークモードインターフェース
- ✅ **Metal GPU 加速** - macOS 最適化で高速 AI 思考
- ✅ **完全プライベート** - すべてローカルで動作、データは外部送信なし

## 必要環境

- macOS 13 (Ventura) 以降
- Node.js 18 以降
- メモリ: 8GB 以上（推奨: 16GB）
- ストレージ: モデルごとに 1-5GB
- Metal 対応 GPU（Apple Silicon 推奨）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ネイティブモジュールのリビルド

```bash
npm run rebuild
```

このステップは`node-llama-cpp`のネイティブバインディングを Electron 用にビルドするために必要です。

## 使用方法

### アプリの起動

```bash
npm start
```

開発モード（DevTools 付き）:

```bash
npm run dev
```

### モデルのダウンロード

1. アプリを起動
2. ヘッダーの **🏪 ボタン** をクリック
3. モデルストアから難易度に応じたモデルを選択
4. **ダウンロード** ボタンをクリック
5. プログレスバーでダウンロード進捗を確認

#### オセロ最適化プリセットモデル

| モデル                | サイズ | 難易度       | 特徴                                        |
| --------------------- | ------ | ------------ | ------------------------------------------- |
| ⭐ **Llama 3.2 1B**   | 790MB  | 初級         | Meta 最新モデル、TinyLlama より圧倒的に賢い |
| ⭐ **Gemma 2 2B**     | 1.6GB  | 初級〜中級   | Google 製、論理的思考に強い、商用利用可     |
| ⭐ **Llama 3.2 3B**   | 2.0GB  | 中級         | 速度と戦略性の最高のバランス                |
| **Phi-3 Mini 4K**     | 2.2GB  | 中級         | Microsoft 製、商用利用可                    |
| **Mistral 7B**        | 4.1GB  | 上級         | 高度な戦略、商用利用可                      |
| **Qwen 2.5 7B**       | 4.3GB  | 上級         | 多言語対応、強力な推論能力                  |
| ⭐ **DeepSeek-R1 7B** | 4.6GB  | エキスパート | **最強！** 思考プロセスを可視化、深い先読み |

### ゲームの開始

1. **設定** (⚙️) からモデルを選択してロード
2. 先手/後手を選択
3. **新しいゲーム** ボタンをクリック
4. ボード上の緑の点（合法手）をクリックして石を置く
5. AI が自動的に応手を考えます

### 設定

- **モデル選択**: インストール済みモデルから AI 用モデルを選択
- **AI 難易度**: 初級・中級・上級から選択（温度パラメータが変化）
- **先手/後手**: 黒（先手）または白（後手）を選択
- **ヒント表示**: 合法手の表示 ON/OFF

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

| 領域               | 技術                            |
| ------------------ | ------------------------------- |
| **フレームワーク** | Electron                        |
| **LLM 統合**       | node-llama-cpp (Metal GPU 対応) |
| **データベース**   | better-sqlite3                  |
| **UI**             | Vanilla JS + CSS                |
| **ビルド**         | electron-builder                |

### ビルド（配布用パッケージ作成）

```bash
# macOS用DMGファイルを自動生成
npm run package:mac
```

## トラブルシューティング

### モデルが読み込めない

- メモリが十分にあるか確認（8GB 以上推奨）
- GGUF ファイルが破損していないか確認
- `npm run rebuild`を再実行

### AI が反応しない

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
