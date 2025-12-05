/**
 * モデルストアUI
 */

const modelStoreModal = document.getElementById("modelStoreModal");
const modelStoreBtn = document.getElementById("modelStoreBtn");
const presetsTab = document.getElementById("presetsTab");
const installedTab = document.getElementById("installedTab");

let presetModels = [];
let installedModels = [];
let activeDownloads = new Map();
let currentModelsDir = "";

// フィルター状態
let filters = {
  license: "all",
  memory: "all",
  difficulty: "all",
};

/**
 * 初期化
 */
async function initializeModelStore() {
  // 現在のモデルディレクトリを取得
  await loadModelsDirectory();

  // モーダルを開くボタン
  modelStoreBtn.addEventListener("click", async () => {
    await openModelStore();
  });

  // モーダルを閉じる
  const closeButtons = modelStoreModal.querySelectorAll(".modal-close");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeModelStore);
  });

  // モーダル背景クリックで閉じる
  modelStoreModal.addEventListener("click", (e) => {
    if (e.target === modelStoreModal) {
      closeModelStore();
    }
  });

  // タブ切り替え
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // ダウンロードイベント
  window.api.model.onDownloadProgress(handleDownloadProgress);
  window.api.model.onDownloadComplete(handleDownloadComplete);
  window.api.model.onDownloadError(handleDownloadError);
}

/**
 * 現在のモデルディレクトリを取得
 */
async function loadModelsDirectory() {
  try {
    const result = await window.api.modelsDir.get();
    currentModelsDir = result.path;
    console.log("Current models directory:", currentModelsDir);
  } catch (error) {
    console.error("Failed to get models directory:", error);
  }
}

/**
 * モデルストアを開く
 */
async function openModelStore() {
  modelStoreModal.style.display = "flex";
  await loadModels();
  renderFilters();
}

/**
 * モデルストアを閉じる
 */
function closeModelStore() {
  modelStoreModal.style.display = "none";
}

/**
 * タブを切り替え
 */
function switchTab(tabName) {
  // タブボタン
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // タブコンテンツ
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.remove("active");
  });

  if (tabName === "presets") {
    presetsTab.classList.add("active");
  } else if (tabName === "installed") {
    installedTab.classList.add("active");
  }
}

/**
 * モデルをロード
 */
async function loadModels() {
  try {
    presetModels = await window.api.model.presets();
    installedModels = await window.api.model.list();
    renderPresets();
    renderInstalled();
  } catch (error) {
    console.error("Failed to load models:", error);
  }
}

/**
 * フィルターUIをレンダリング
 */
function renderFilters() {
  const existingFilters = presetsTab.querySelector(".model-filters");
  if (existingFilters) {
    return; // Already rendered
  }

  const filtersHTML = `
        <div class="model-filters">
            <button class="models-dir-btn" id="changeDirBtn" title="モデル保存先を変更">
                📁 保存先設定
            </button>
            <select id="licenseFilter" class="filter-select">
                <option value="all">すべてのライセンス</option>
                <option value="commercial">商用利用可</option>
                <option value="non-commercial">非商用のみ</option>
            </select>
            <select id="memoryFilter" class="filter-select">
                <option value="all">すべてのサイズ</option>
                <option value="small">&lt;4GB</option>
                <option value="medium">4-8GB</option>
                <option value="large">&gt;8GB</option>
            </select>
            <select id="difficultyFilter" class="filter-select">
                <option value="all">すべての難易度</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;

  presetsTab.insertAdjacentHTML("afterbegin", filtersHTML);

  // Filter event listeners
  document.getElementById("licenseFilter").addEventListener("change", (e) => {
    filters.license = e.target.value;
    renderPresets();
  });

  document.getElementById("memoryFilter").addEventListener("change", (e) => {
    filters.memory = e.target.value;
    renderPresets();
  });

  document
    .getElementById("difficultyFilter")
    .addEventListener("change", (e) => {
      filters.difficulty = e.target.value;
      renderPresets();
    });

  document
    .getElementById("changeDirBtn")
    .addEventListener("click", changeModelsDirectory);
}

/**
 * プリセットモデルをレンダリング
 */
function renderPresets() {
  // Apply filters
  let filteredModels = presetModels.filter((model) => {
    // License filter
    if (filters.license === "commercial" && !model.commercial) return false;
    if (filters.license === "non-commercial" && model.commercial) return false;

    // Memory filter
    const memoryGB = model.memoryRequired / (1024 * 1024 * 1024);
    if (filters.memory === "small" && memoryGB >= 4) return false;
    if (filters.memory === "medium" && (memoryGB < 4 || memoryGB > 8))
      return false;
    if (filters.memory === "large" && memoryGB <= 8) return false;

    // Difficulty filter
    if (filters.difficulty !== "all" && model.difficulty !== filters.difficulty)
      return false;

    return true;
  });

  // Keep filters, rebuild model grid
  const existingFilters = presetsTab.querySelector(".model-filters");
  presetsTab.innerHTML = "";
  if (existingFilters) {
    presetsTab.appendChild(existingFilters);
  }

  const gridDiv = document.createElement("div");
  gridDiv.className = "model-grid";
  presetsTab.appendChild(gridDiv);

  filteredModels.forEach((model) => {
    const isInstalled = installedModels.some(
      (m) => m.id === `${model.id}.gguf`
    );
    const isDownloading = activeDownloads.has(model.id);

    const card = document.createElement("div");
    card.className = "model-card";

    const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(1);
    const memoryGB = (model.memoryRequired / (1024 * 1024 * 1024)).toFixed(0);
    const commercialBadge = model.commercial
      ? '<span class="badge commercial">✅ 商用可</span>'
      : '<span class="badge non-commercial">⚠️ 非商用</span>';

    card.innerHTML = `
      <div class="model-card-header">
        <div>
          <div class="model-name">${model.name}</div>
          <div class="model-author">${model.author}</div>
        </div>
        <span class="model-badge ${
          model.difficulty
        }">${model.difficulty.toUpperCase()}</span>
      </div>
      <div class="model-description">${model.description}</div>
      <div class="model-meta">
        <span class="model-meta-item">📦 ${sizeGB} GB</span>
        <span class="model-meta-item">💾 ${memoryGB} GB RAM</span>
        <span class="model-meta-item">⚙️ ${model.quantization}</span>
      </div>
      <div class="model-tags">
        ${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <div class="model-license">
        ${commercialBadge}
        <a href="${model.licenseUrl}" target="_blank" class="license-link">${
      model.license
    }</a>
      </div>
      <div class="model-actions">
        ${
          isInstalled
            ? '<button class="btn btn-success" disabled>✓ インストール済み</button>' +
              '<button class="btn btn-danger btn-delete" data-model-id="' +
              model.id +
              '.gguf">🗑️ 削除</button>'
            : isDownloading
            ? '<button class="btn" data-action="cancel">キャンセル</button>'
            : '<button class="btn btn-primary" data-action="download">ダウンロード</button>'
        }
      </div>
      ${
        isDownloading
          ? `
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" data-model-id="${model.id}" style="width: 0%"></div>
          </div>
          <div class="progress-text">
            <span data-progress-text="${model.id}">準備中...</span>
            <span data-progress-percent="${model.id}">0%</span>
          </div>
        </div>
      `
          : ""
      }
    `;

    // ダウンロードボタン
    const downloadBtn = card.querySelector('[data-action="download"]');
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => downloadModel(model));
    }

    // キャンセルボタン
    const cancelBtn = card.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => cancelDownload(model.id));
    }

    // 削除ボタン
    const deleteBtn = card.querySelector(".btn-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () =>
        deleteModel(deleteBtn.dataset.modelId)
      );
    }

    gridDiv.appendChild(card);
  });
}

/**
 * インストール済みモデルをレンダリング
 */
function renderInstalled() {
  if (installedModels.length === 0) {
    installedTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-text">インストール済みのモデルがありません</div>
      </div>
    `;
    return;
  }

  installedTab.innerHTML = '<div class="model-grid"></div>';
  const grid = installedTab.querySelector(".model-grid");

  installedModels.forEach((model) => {
    const card = document.createElement("div");
    card.className = "model-card";
    card.innerHTML = `
      <div class="model-card-header">
        <div>
          <div class="model-name">${model.name}</div>
        </div>
      </div>
      <div class="model-meta">
        <span class="model-meta-item">📦 ${model.sizeFormatted}</span>
      </div>
      <div class="model-actions">
        <button class="btn btn-danger" data-action="delete" data-model-id="${model.id}">削除</button>
      </div>
    `;

    // 削除ボタン
    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener("click", () => deleteModel(model.id));

    grid.appendChild(card);
  });
}

/**
 * モデルをダウンロード
 */
async function downloadModel(model) {
  try {
    activeDownloads.set(model.id, true);
    renderPresets();
    await window.api.model.download(model);
  } catch (error) {
    console.error("Download failed:", error);
    activeDownloads.delete(model.id);
    renderPresets();
    alert("ダウンロードに失敗しました: " + error.message);
  }
}

/**
 * ダウンロードをキャンセル
 */
async function cancelDownload(modelId) {
  try {
    await window.api.model.cancelDownload(modelId);
    activeDownloads.delete(modelId);
    renderPresets();
  } catch (error) {
    console.error("Cancel failed:", error);
  }
}

/**
 * モデルを削除
 */
async function deleteModel(modelId) {
  if (!confirm("このモデルを削除しますか？")) {
    return;
  }

  try {
    await window.api.model.delete(modelId);
    await loadModels();
  } catch (error) {
    console.error("Delete failed:", error);
    alert("削除に失敗しました: " + error.message);
  }
}

/**
 * モデル保存ディレクトリを変更
 */
async function changeModelsDirectory() {
  try {
    // ディレクトリ選択ダイアログを表示
    const result = await window.api.modelsDir.select();

    if (result.canceled) {
      return;
    }

    const newDir = result.path;
    console.log("Selected new models directory:", newDir);

    // 確認ダイアログ
    const confirmed = confirm(
      `モデル保存ディレクトリを変更しますか?\n\n新しい保存先:\n${newDir}\n\n※既存のモデルは移動されません。新しいディレクトリからモデルを読み込みます。`
    );

    if (!confirmed) {
      return;
    }

    // ディレクトリを設定
    await window.api.modelsDir.set(newDir);
    currentModelsDir = newDir;

    // モデル一覧を再読み込み
    await loadModels();

    alert("モデル保存ディレクトリを変更しました");
  } catch (error) {
    console.error("Failed to change models directory:", error);
    alert(`ディレクトリの変更に失敗しました: ${error.message}`);
  }
}

/**
 * ダウンロード進捗を処理
 */
function handleDownloadProgress(data) {
  const { modelId, percentage, speed, eta } = data;

  const progressFill = document.querySelector(`[data-model-id="${modelId}"]`);
  const progressText = document.querySelector(
    `[data-progress-text="${modelId}"]`
  );
  const progressPercent = document.querySelector(
    `[data-progress-percent="${modelId}"]`
  );

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (progressText) {
    const speedText = formatBytes(speed) + "/s";
    const etaText = Math.round(eta) + "秒";
    progressText.textContent = `${speedText} - 残り ${etaText}`;
  }

  if (progressPercent) {
    progressPercent.textContent = `${Math.round(percentage)}%`;
  }
}

/**
 * ダウンロード完了を処理
 */
async function handleDownloadComplete(data) {
  const { modelId } = data;
  activeDownloads.delete(modelId);
  await loadModels();
  alert("モデルのダウンロードが完了しました！");
}

/**
 * ダウンロードエラーを処理
 */
function handleDownloadError(data) {
  const { modelId, error } = data;
  activeDownloads.delete(modelId);
  renderPresets();
  alert("ダウンロードエラー: " + error);
}

/**
 * バイト数をフォーマット
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// 初期化
initializeModelStore();
