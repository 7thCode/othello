/**
 * オセロゲームエンジン
 * ボード状態管理、合法手計算、石を返すロジック、ゲーム終了判定
 */

const { EMPTY, BLACK, WHITE, BOARD_SIZE } = require('../shared/constants');

class OthelloEngine {
    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.initializeBoard();
    }

    /**
     * 空のボードを作成
     */
    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    }

    /**
     * ボードを初期状態に設定
     */
    initializeBoard() {
        const mid = BOARD_SIZE / 2;
        this.board[mid - 1][mid - 1] = WHITE;
        this.board[mid - 1][mid] = BLACK;
        this.board[mid][mid - 1] = BLACK;
        this.board[mid][mid] = WHITE;
        this.currentPlayer = BLACK;
    }

    /**
     * 新しいゲームを開始
     */
    newGame() {
        this.board = this.createEmptyBoard();
        this.initializeBoard();
        return this.getGameState();
    }

    /**
     * 現在のゲーム状態を取得
     */
    getGameState() {
        const score = this.getScore();
        const validMoves = this.getValidMoves(this.currentPlayer);
        const isGameOver = this.isGameOver();
        const winner = isGameOver ? this.getWinner() : null;

        return {
            board: this.board.map(row => [...row]), // ディープコピー
            currentPlayer: this.currentPlayer,
            score,
            validMoves,
            isGameOver,
            winner,
        };
    }

    /**
     * 指定された位置に石を置けるかチェック
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {number} player - プレイヤー (BLACK or WHITE)
     * @returns {boolean}
     */
    isValidMove(row, col, player) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return false;
        }

        if (this.board[row][col] !== EMPTY) {
            return false;
        }

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let hasOpponentBetween = false;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (this.board[r][c] === EMPTY) {
                    break;
                }
                if (this.board[r][c] === opponent) {
                    hasOpponentBetween = true;
                } else if (this.board[r][c] === player) {
                    if (hasOpponentBetween) {
                        return true;
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        return false;
    }

    /**
     * 合法手の一覧を取得
     * @param {number} player - プレイヤー
     * @returns {Array} 合法手の配列 [{row, col}, ...]
     */
    getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.isValidMove(row, col, player)) {
                    moves.push({ row, col });
                }
            }
        }
        return moves;
    }

    /**
     * 石を置いて返す処理
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {number} player - プレイヤー
     * @returns {Object} 結果 {success: boolean, flipped: Array}
     */
    makeMove(row, col, player) {
        if (!this.isValidMove(row, col, player)) {
            return { success: false, flipped: [] };
        }

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        const flipped = [];

        // 石を置く
        this.board[row][col] = player;

        // 各方向に対して石を返す
        for (const [dr, dc] of directions) {
            const toFlip = [];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (this.board[r][c] === EMPTY) {
                    break;
                }
                if (this.board[r][c] === opponent) {
                    toFlip.push({ row: r, col: c });
                } else if (this.board[r][c] === player) {
                    // この方向の石を返す
                    for (const pos of toFlip) {
                        this.board[pos.row][pos.col] = player;
                        flipped.push(pos);
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        // プレイヤーを切り替え
        this.currentPlayer = opponent;

        // 次のプレイヤーが打てない場合はスキップ
        if (this.getValidMoves(this.currentPlayer).length === 0) {
            this.currentPlayer = player;
            // 両方打てない場合はゲーム終了
            if (this.getValidMoves(this.currentPlayer).length === 0) {
                this.currentPlayer = EMPTY; // ゲーム終了を示す
            }
        }

        return {
            success: true,
            flipped,
            gameState: this.getGameState(),
        };
    }

    /**
     * スコアを取得
     * @returns {Object} {black: number, white: number}
     */
    getScore() {
        let black = 0;
        let white = 0;

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === BLACK) {
                    black++;
                } else if (this.board[row][col] === WHITE) {
                    white++;
                }
            }
        }

        return { black, white };
    }

    /**
     * ゲームが終了しているかチェック
     * @returns {boolean}
     */
    isGameOver() {
        // どちらも打てない場合
        if (this.getValidMoves(BLACK).length === 0 && this.getValidMoves(WHITE).length === 0) {
            return true;
        }
        // ボードが埋まっている場合
        const score = this.getScore();
        return score.black + score.white === BOARD_SIZE * BOARD_SIZE;
    }

    /**
     * 勝者を取得
     * @returns {number|null} BLACK, WHITE, or null (引き分け)
     */
    getWinner() {
        if (!this.isGameOver()) {
            return null;
        }

        const score = this.getScore();
        if (score.black > score.white) {
            return BLACK;
        } else if (score.white > score.black) {
            return WHITE;
        }
        return null; // 引き分け
    }

    /**
     * ボード状態をテキスト形式で取得（デバッグ用）
     */
    getBoardText() {
        const symbols = { [EMPTY]: '・', [BLACK]: '●', [WHITE]: '○' };
        let text = '  A B C D E F G H\n';
        for (let row = 0; row < BOARD_SIZE; row++) {
            text += `${row + 1} `;
            for (let col = 0; col < BOARD_SIZE; col++) {
                text += symbols[this.board[row][col]] + ' ';
            }
            text += '\n';
        }
        return text;
    }
}

module.exports = OthelloEngine;
