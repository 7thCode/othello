/**
 * メインアプリケーションロジック
 */

const BLACK = 1;
const WHITE = 2;

let gameState = null;
let playerColor = BLACK;
let aiColor = WHITE;
let showHints = true;
let isPlayerTurn = true;
let aiDifficulty = 'medium';

// DOM要素
const board = document.getElementById('board');
const blackScore = document.getElementById('blackScore');
const whiteScore = document.getElementById('whiteScore');
const turnText = document.getElementById('turnText');
const statusText = document.getElementById('statusText');
const aiThinking = document.getElementById('aiThinking');
const newGameBtn = document.getElementById('newGameBtn');

/**
 * 初期化
 */
async function initialize() {
    // ボードを作成
    createBoard();

    // 新しいゲームを開始
    await startNewGame();

    // イベントリスナーを設定
    setupEventListeners();

    // AI思考中イベント
    window.api.game.onAIThinking((data) => {
        if (data.status === 'thinking') {
            aiThinking.style.display = 'flex';
        } else {
            aiThinking.style.display = 'none';
        }
    });
}

/**
 * ボードUIを作成
 */
function createBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(row, col));
            board.appendChild(cell);
        }
    }
}

/**
 * ボードを更新
 */
function updateBoard() {
    if (!gameState) return;

    const cells = board.querySelectorAll('.cell');
    cells.forEach((cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = gameState.board[row][col];

        // 既存の石を削除
        cell.innerHTML = '';

        // 石を配置
        if (value !== 0) {
            const stone = document.createElement('div');
            stone.className = `stone ${value === BLACK ? 'black' : 'white'}`;
            cell.appendChild(stone);
        }

        // 合法手のハイライト
        cell.classList.remove('valid-move', 'disabled');
        if (showHints && isPlayerTurn && gameState.currentPlayer === playerColor) {
            const isValidMove = gameState.validMoves.some(m => m.row === row && m.col === col);
            if (isValidMove) {
                cell.classList.add('valid-move');
            }
        }

        if (!isPlayerTurn) {
            cell.classList.add('disabled');
        }
    });

    // スコアを更新
    blackScore.textContent = gameState.score.black;
    whiteScore.textContent = gameState.score.white;

    // ターン表示を更新
    const currentPlayerName = gameState.currentPlayer === BLACK ? '黒' : '白';
    turnText.textContent = `${currentPlayerName}のターン`;

    // ゲーム終了チェック
    if (gameState.isGameOver) {
        handleGameOver();
    }
}

/**
 * セルクリック処理
 */
async function handleCellClick(row, col) {
    if (!gameState || !isPlayerTurn) return;
    if (gameState.currentPlayer !== playerColor) return;
    if (gameState.isGameOver) return;

    // 合法手かチェック
    const isValid = gameState.validMoves.some(m => m.row === row && m.col === col);
    if (!isValid) return;

    // 手を実行
    try {
        const result = await window.api.game.makeMove({
            row,
            col,
            player: playerColor,
        });

        if (result.success) {
            gameState = result.gameState;
            updateBoard();

            // 石を返すアニメーション
            if (result.flipped && result.flipped.length > 0) {
                animateFlip(result.flipped);
            }

            // AIのターンをチェック
            if (!gameState.isGameOver && gameState.currentPlayer === aiColor) {
                await playAITurn();
            }
        }
    } catch (error) {
        console.error('Move failed:', error);
        statusText.textContent = 'エラー: 手の実行に失敗しました';
    }
}

/**
 * AIのターンを実行
 */
async function playAITurn() {
    isPlayerTurn = false;
    updateBoard();

    try {
        // 難易度設定を取得
        const difficultySettings = {
            easy: { temperature: 1.0, maxTokens: 50 },
            medium: { temperature: 0.7, maxTokens: 50 },
            hard: { temperature: 0.3, maxTokens: 50 },
        };

        const options = difficultySettings[aiDifficulty] || difficultySettings.medium;

        // AIの手を取得
        const aiResult = await window.api.game.getAIMove({
            board: gameState.board,
            player: aiColor,
            validMoves: gameState.validMoves,
            options,
        });

        if (aiResult.success) {
            const { row, col } = aiResult.move;

            // 少し待ってから実行（UX向上）
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = await window.api.game.makeMove({
                row,
                col,
                player: aiColor,
            });

            if (result.success) {
                gameState = result.gameState;
                updateBoard();

                if (result.flipped && result.flipped.length > 0) {
                    animateFlip(result.flipped);
                }
            }
        }
    } catch (error) {
        console.error('AI move failed:', error);
        statusText.textContent = 'エラー: AIの手の実行に失敗しました';
    } finally {
        isPlayerTurn = true;
        updateBoard();
    }
}

/**
 * 石を返すアニメーション
 */
function animateFlip(flipped) {
    flipped.forEach((pos, index) => {
        setTimeout(() => {
            const cell = board.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                const stone = cell.querySelector('.stone');
                if (stone) {
                    stone.classList.add('flipping');
                }
            }
        }, index * 100);
    });
}

/**
 * 新しいゲームを開始
 */
async function startNewGame() {
    try {
        const result = await window.api.game.new();
        if (result.success) {
            gameState = result.gameState;
            isPlayerTurn = true;
            statusText.textContent = 'ゲーム開始！';
            updateBoard();

            // 白（後手）を選択している場合はAIが先手
            if (playerColor === WHITE) {
                await playAITurn();
            }
        }
    } catch (error) {
        console.error('Failed to start game:', error);
        statusText.textContent = 'エラー: ゲームの開始に失敗しました';
    }
}

/**
 * ゲーム終了処理
 */
function handleGameOver() {
    isPlayerTurn = false;

    let message = '';
    if (gameState.winner === null) {
        message = '引き分けです！';
    } else if (gameState.winner === playerColor) {
        message = 'あなたの勝ちです！🎉';
    } else {
        message = 'AIの勝ちです！';
    }

    statusText.textContent = message;
    turnText.textContent = 'ゲーム終了';
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
    newGameBtn.addEventListener('click', startNewGame);
}

/**
 * プレイヤーカラーを設定
 */
export function setPlayerColor(color) {
    playerColor = color === 'black' ? BLACK : WHITE;
    aiColor = playerColor === BLACK ? WHITE : BLACK;
}

/**
 * ヒント表示を設定
 */
export function setShowHints(show) {
    showHints = show;
    updateBoard();
}

/**
 * 難易度を設定
 */
export function setDifficulty(difficulty) {
    aiDifficulty = difficulty;
}

// 初期化
initialize();
