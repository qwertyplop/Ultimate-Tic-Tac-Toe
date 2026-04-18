import type { GameState } from "./gameLogic";
import { getValidMoves } from "./gameLogic";

export interface LLMSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function buildPrompt(state: GameState): string {
  const boardChar = (val: string | null) =>
    val === null ? "." : val;

  const bigRows = [];
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

  const boardDisplay = bigRows.join("\n");

  const activeBoardStr =
    state.activeBoard !== null
      ? `You MUST play in board ${state.activeBoard} (big-grid position row=${Math.floor(state.activeBoard / 3)}, col=${state.activeBoard % 3}).`
      : "You may play in ANY unfinished board.";

  const validMoves = getValidMoves(state);
  const movesStr = validMoves
    .map((m) => `board=${m.boardIndex} cell=${m.cellIndex}`)
    .join(", ");

  return `You are playing Ultimate Tic-Tac-Toe (Tic Tac Toe Squared) as player O.

Rules reminder:
- There are 9 small boards in a 3x3 grid.
- When you place O in cell position (row, col) within a small board, your opponent must next play in the big-grid board at (row, col).
- Win 3 small boards in a row/column/diagonal to win overall.

Current board state (each [] is a small board, . = empty):
${boardDisplay}

${activeBoardStr}

Valid moves: ${movesStr}

You must respond with EXACTLY one line in this format:
MOVE board=<boardIndex> cell=<cellIndex>

Where boardIndex is 0-8 (big grid position, row-major) and cellIndex is 0-8 (small board position, row-major).
Choose a strategic move. Respond with nothing else.`;
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
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: "user",
            content: buildPrompt(state),
          },
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
    const text: string =
      data.choices?.[0]?.message?.content?.trim() ?? "";

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
