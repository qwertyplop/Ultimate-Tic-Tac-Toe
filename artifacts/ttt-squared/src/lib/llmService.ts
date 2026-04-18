import type { GameState } from "./gameLogic";
import { getValidMoves } from "./gameLogic";

export interface LLMSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function buildBoardDisplay(state: GameState): string {
  const boardChar = (val: string | null) => (val === null ? "." : val);
  const bigRows: string[] = [];

  for (let bigRow = 0; bigRow < 3; bigRow++) {
    const rowLines: string[] = ["", "", ""];
    for (let bigCol = 0; bigCol < 3; bigCol++) {
      const bi = bigRow * 3 + bigCol;
      const res = state.boardResults[bi];
      if (res !== null) {
        const label = res === "tie" ? "T" : res;
        rowLines[0] += `[${label}${label}${label}]`;
        rowLines[1] += `[${label}${label}${label}]`;
        rowLines[2] += `[${label}${label}${label}]`;
      } else {
        const b = state.boards[bi];
        for (let r = 0; r < 3; r++) {
          let s = "[";
          for (let c = 0; c < 3; c++) {
            s += boardChar(b[r * 3 + c]);
          }
          s += "]";
          rowLines[r] += s;
        }
      }
      if (bigCol < 2) {
        rowLines[0] += " ";
        rowLines[1] += " ";
        rowLines[2] += " ";
      }
    }
    bigRows.push(...rowLines);
    if (bigRow < 2) bigRows.push("");
  }

  return bigRows.join("\n");
}

function buildMessages(state: GameState): {
  systemMessage: string;
  userMessage: string;
} {
  const systemMessage = `You are an expert Ultimate Tic-Tac-Toe (Tic Tac Toe Squared) player. You play as O.

Rules:
- The game has a 3x3 grid of 9 small tic-tac-toe boards (boardIndex 0-8, row-major order).
- Each small board has 9 cells (cellIndex 0-8, row-major order).
- When you place O in cell position (row=cellIndex/3, col=cellIndex%3) within a small board, your opponent must next play in the big-grid board at that same (row, col) position.
- If the required board is already finished (won or tied), the opponent may play on any unfinished board.
- Win 3 small boards in a row, column, or diagonal to win overall.

Response format — you must respond with EXACTLY this one line and nothing else:
MOVE board=<boardIndex> cell=<cellIndex>`;

  const validMoves = getValidMoves(state);
  const movesStr = validMoves
    .map((m) => `board=${m.boardIndex} cell=${m.cellIndex}`)
    .join(", ");

  const activeBoardStr =
    state.activeBoard !== null
      ? `You MUST play in board ${state.activeBoard} (big-grid row=${Math.floor(state.activeBoard / 3)}, col=${state.activeBoard % 3}).`
      : "You may play in ANY unfinished board.";

  const boardDisplay = buildBoardDisplay(state);

  const userMessage = `Current board state (each [] is a small board, . = empty, T = tied):
${boardDisplay}

${activeBoardStr}
Valid moves: ${movesStr}

Choose a strategic move. Respond with your MOVE line only.`;

  return { systemMessage, userMessage };
}

export async function fetchModels(settings: LLMSettings): Promise<string[]> {
  const base = settings.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/models`, {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data.data)) {
    return data.data.map((m: { id: string }) => m.id).sort();
  }
  return [];
}

export async function getLLMMove(
  state: GameState,
  settings: LLMSettings
): Promise<{ boardIndex: number; cellIndex: number } | null> {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return null;

  const base = settings.baseUrl.replace(/\/$/, "");

  try {
    const { systemMessage, userMessage } = buildMessages(state);
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: 50,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("LLM API error:", res.status);
      return randomMove(validMoves);
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    const match = text.match(/MOVE\s+board=(\d+)\s+cell=(\d+)/i);
    if (match) {
      const boardIndex = parseInt(match[1]);
      const cellIndex = parseInt(match[2]);
      const isValid = validMoves.some(
        (m) => m.boardIndex === boardIndex && m.cellIndex === cellIndex
      );
      if (isValid) return { boardIndex, cellIndex };
    }

    console.warn("LLM returned invalid move, falling back to random:", text);
    return randomMove(validMoves);
  } catch (e) {
    console.error("LLM fetch error:", e);
    return randomMove(validMoves);
  }
}

function randomMove(
  moves: Array<{ boardIndex: number; cellIndex: number }>
): { boardIndex: number; cellIndex: number } {
  return moves[Math.floor(Math.random() * moves.length)];
}
