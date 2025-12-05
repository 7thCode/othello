/**
 * オセロAI
 * LLMを使用してオセロの次の手を決定
 */

const { BLACK, WHITE } = require('../shared/constants');

class OthelloAI {
    constructor(llamaManager) {
        this.llamaManager = llamaManager;
    }

    /**
     * 座標を文字列に変換（例: row=0, col=0 -> "A1"）
     */
    coordToString(row, col) {
        const cols = 'ABCDEFGH';
        return `${cols[col]}${row + 1}`;
    }

    /**
     * 文字列を座標に変換（例: "A1" -> {row: 0, col: 0}）
     */
    stringToCoord(str) {
        const cols = 'ABCDEFGH';
        const col = cols.indexOf(str[0].toUpperCase());
        const row = parseInt(str[1]) - 1;
        return { row, col };
    }

    /**
     * ボード状態をテキスト形式で生成
     */
    boardToText(board, validMoves) {
        const symbols = { 0: '・', 1: '●', 2: '○' };
        let text = '  A B C D E F G H\n';

        for (let row = 0; row < 8; row++) {
            text += `${row + 1} `;
            for (let col = 0; col < 8; col++) {
                // 合法手の位置は * でマーク
                const isValid = validMoves.some(m => m.row === row && m.col === col);
                if (isValid) {
                    text += '* ';
                } else {
                    text += symbols[board[row][col]] + ' ';
                }
            }
            text += '\n';
        }
        return text;
    }

    /**
     * AIの次の手を取得
     * @param {Array} board - ボード状態
     * @param {number} player - プレイヤー (BLACK or WHITE)
     * @param {Array} validMoves - 合法手の配列
     * @param {Object} options - オプション（temperature等）
     * @returns {Promise<Object>} {row, col}
     */
    async getMove(board, player, validMoves, options = {}) {
        if (validMoves.length === 0) {
            throw new Error('No valid moves available');
        }

        // LLMがロードされていない場合はランダムに選択
        if (!this.llamaManager.isModelLoaded()) {
            console.warn('LLM not loaded, selecting random move');
            return this.getRandomMove(validMoves);
        }

        try {
            // プロンプトを生成
            const prompt = this.generatePrompt(board, player, validMoves);

            // LLMに問い合わせ
            const response = await this.llamaManager.prompt(prompt, {
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 50,
            });

            // レスポンスをパース
            const move = this.parseResponse(response, validMoves);

            if (move) {
                console.log('AI選択:', this.coordToString(move.row, move.col));
                return move;
            } else {
                console.warn('LLM response could not be parsed, selecting random move');
                return this.getRandomMove(validMoves);
            }
        } catch (error) {
            console.error('AI move generation failed:', error);
            return this.getRandomMove(validMoves);
        }
    }

    /**
     * プロンプトを生成
     */
    generatePrompt(board, player, validMoves) {
        const playerSymbol = player === BLACK ? '黒（●）' : '白（○）';
        const boardText = this.boardToText(board, validMoves);
        const validMovesText = validMoves.map(m => this.coordToString(m.row, m.col)).join(', ');

        return `あなたはオセロの達人です。以下の局面で最善の手を選んでください。

現在の盤面:
${boardText}

あなたは${playerSymbol}です。
可能な手（*印の位置）: ${validMovesText}

最も戦略的に優れた手を1つ選び、その座標だけを答えてください（例: C4）
回答:`;
    }

    /**
     * LLMの応答から座標を抽出
     */
    parseResponse(response, validMoves) {
        // A1-H8の形式を探す
        const pattern = /[A-H][1-8]/gi;
        const matches = response.match(pattern);

        if (!matches) {
            return null;
        }

        // 最初に見つかった合法手を返す
        for (const match of matches) {
            const coord = this.stringToCoord(match);
            if (validMoves.some(m => m.row === coord.row && m.col === coord.col)) {
                return coord;
            }
        }

        return null;
    }

    /**
     * ランダムに合法手を選択（フォールバック）
     */
    getRandomMove(validMoves) {
        const index = Math.floor(Math.random() * validMoves.length);
        const move = validMoves[index];
        console.log('ランダム選択:', this.coordToString(move.row, move.col));
        return move;
    }
}

module.exports = OthelloAI;
