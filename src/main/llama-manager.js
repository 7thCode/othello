/**
 * LLM推論管理
 * llama.cppを使用したローカルLLMの管理と推論
 */

const path = require('path');
const { MODELS_DIR } = require('../shared/constants');

class LlamaManager {
    constructor() {
        this.llama = null;
        this.model = null;
        this.context = null;
        this.session = null;
        this.currentModelPath = null;
        this.isLoading = false;
        this.nodeLlamaCpp = null;
    }

    /**
     * node-llama-cppを動的インポート
     */
    async _importNodeLlamaCpp() {
        if (!this.nodeLlamaCpp) {
            this.nodeLlamaCpp = await import('node-llama-cpp');
        }
        return this.nodeLlamaCpp;
    }

    /**
     * LLMモデルをロード
     * @param {string} modelPath - モデルファイルのパス
     */
    async loadModel(modelPath) {
        if (this.isLoading) {
            throw new Error('Another model is already loading');
        }

        try {
            this.isLoading = true;

            // 既存のモデルをアンロード
            await this.unloadModel();

            console.log('Loading model:', modelPath);

            // node-llama-cppを動的インポート
            const { getLlama, LlamaChatSession } = await this._importNodeLlamaCpp();

            // llama インスタンスを取得
            if (!this.llama) {
                this.llama = await getLlama();
            }

            // モデルをロード
            this.model = await this.llama.loadModel({
                modelPath,
                gpuLayers: 33, // Metal GPU利用
            });

            // コンテキストを作成
            this.context = await this.model.createContext({
                contextSize: 2048,
            });

            // セッションを作成
            this.session = new LlamaChatSession({
                contextSequence: this.context.getSequence(),
            });

            this.currentModelPath = modelPath;
            console.log('Model loaded successfully');

            return { success: true, modelPath };
        } catch (error) {
            console.error('Failed to load model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * モデルをアンロード
     */
    async unloadModel() {
        if (this.session) {
            this.session = null;
        }

        if (this.context) {
            await this.context.dispose();
            this.context = null;
        }

        if (this.model) {
            await this.model.dispose();
            this.model = null;
        }

        this.currentModelPath = null;
        console.log('Model unloaded');
    }

    /**
     * プロンプトを実行して応答を取得
     * @param {string} prompt - プロンプト
     * @param {Object} options - オプション
     * @returns {Promise<string>} AI応答
     */
    async prompt(prompt, options = {}) {
        if (!this.session) {
            throw new Error('No model loaded');
        }

        try {
            const response = await this.session.prompt(prompt, {
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 50,
                stopSequences: options.stopSequences || ['\n\n'],
            });

            return response;
        } catch (error) {
            console.error('Prompt failed:', error);
            throw error;
        }
    }

    /**
     * 現在ロード中のモデルパスを取得
     */
    getCurrentModelPath() {
        return this.currentModelPath;
    }

    /**
     * モデルがロード済みかチェック
     */
    isModelLoaded() {
        return this.model !== null && this.session !== null;
    }
}

module.exports = LlamaManager;
