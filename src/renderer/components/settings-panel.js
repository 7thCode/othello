/**
 * 設定パネルUI
 */

import { setPlayerColor, setShowHints, setDifficulty } from '../app.js';

const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const modelSelect = document.getElementById('modelSelect');
const loadModelBtn = document.getElementById('loadModelBtn');
const loadStatus = document.getElementById('loadStatus');
const showHintsCheckbox = document.getElementById('showHints');
const currentModelDisplay = document.getElementById('currentModel');

/**
 * 初期化
 */
async function initializeSettings() {
    // モーダルを開く
    settingsBtn.addEventListener('click', async () => {
        await openSettings();
    });

    // モーダルを閉じる
    const closeButtons = settingsModal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeSettings);
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });

    // モデルロード
    loadModelBtn.addEventListener('click', loadSelectedModel);

    // モデルロードステータス
    window.api.model.onLoadStatus(handleLoadStatus);

    // 難易度ボタン
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const difficulty = btn.dataset.difficulty;
            setDifficulty(difficulty);
        });
    });

    // プレイヤーカラー
    const playerColorRadios = document.querySelectorAll('input[name="playerColor"]');
    playerColorRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            setPlayerColor(radio.value);
        });
    });

    // ヒント表示
    showHintsCheckbox.addEventListener('change', () => {
        setShowHints(showHintsCheckbox.checked);
    });

    // 現在のモデルを表示
    updateCurrentModel();
}

/**
 * 設定パネルを開く
 */
async function openSettings() {
    settingsModal.style.display = 'flex';
    await loadModelList();
}

/**
 * 設定パネルを閉じる
 */
function closeSettings() {
    settingsModal.style.display = 'none';
}

/**
 * モデル一覧をロード
 */
async function loadModelList() {
    try {
        const models = await window.api.model.list();
        modelSelect.innerHTML = '<option value="">モデルを選択...</option>';

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.path;
            option.textContent = `${model.name} (${model.sizeFormatted})`;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load model list:', error);
    }
}

/**
 * 選択したモデルをロード
 */
async function loadSelectedModel() {
    const modelPath = modelSelect.value;
    if (!modelPath) {
        alert('モデルを選択してください');
        return;
    }

    try {
        loadStatus.textContent = 'モデルをロード中...';
        loadStatus.className = 'status-text loading';
        loadModelBtn.disabled = true;

        await window.api.model.load(modelPath);
    } catch (error) {
        console.error('Failed to load model:', error);
        loadStatus.textContent = 'エラー: ' + error.message;
        loadStatus.className = 'status-text error';
        loadModelBtn.disabled = false;
    }
}

/**
 * モデルロードステータスを処理
 */
function handleLoadStatus(data) {
    if (data.status === 'loading') {
        loadStatus.textContent = 'モデルをロード中...';
        loadStatus.className = 'status-text loading';
    } else if (data.status === 'loaded') {
        loadStatus.textContent = 'モデルのロードが完了しました';
        loadStatus.className = 'status-text success';
        loadModelBtn.disabled = false;
        updateCurrentModel();
    } else if (data.status === 'error') {
        loadStatus.textContent = 'エラー: ' + data.error;
        loadStatus.className = 'status-text error';
        loadModelBtn.disabled = false;
    }
}

/**
 * 現在のモデル表示を更新
 */
async function updateCurrentModel() {
    try {
        const current = await window.api.model.current();
        if (current.isLoaded && current.modelPath) {
            const modelName = current.modelPath.split('/').pop().replace('.gguf', '');
            currentModelDisplay.textContent = `モデル: ${modelName}`;
        } else {
            currentModelDisplay.textContent = 'モデル未ロード';
        }
    } catch (error) {
        console.error('Failed to get current model:', error);
    }
}

// 初期化
initializeSettings();
