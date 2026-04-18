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
  const systemMessage = `You are a highly competitive Ultimate Tic-Tac-Toe player. You play as O against a human who plays as X. Your sole goal is to WIN.

== HOW THE GAME WORKS ==
There is a 3x3 grid of 9 small tic-tac-toe boards. Boards are numbered 0–8 in row-major order:
  0 1 2
  3 4 5
  6 7 8
Each small board has 9 cells numbered 0–8 in row-major order:
  0 1 2
  3 4 5
  6 7 8

When you place O in cell C of a small board, your opponent MUST play their next move in the small board whose index equals C. If that board is already finished (won or tied), the opponent may play on any unfinished board.

You win the overall game by winning 3 small boards that form a line (row, column, or diagonal) on the big board.

== HOW TO WIN — STRATEGIC PRIORITIES ==
Evaluate every candidate move in this order and pick the highest-priority option available:

1. WIN THE GAME NOW: If you can place O to win a small board, and winning that board gives you 3-in-a-row on the big board, do it immediately.

2. BLOCK OPPONENT'S GAME WIN: If X already owns 2 small boards in a winning line and the third is still open, you MUST win or play in that third board to deny X a game win.

3. WIN A STRATEGICALLY VITAL SMALL BOARD: Prioritize winning small boards at the center (board 4) and corners (boards 0, 2, 6, 8) of the big grid — they participate in the most winning lines. Win these before the opponent.

4. BLOCK OPPONENT FROM WINNING A SMALL BOARD: If X has two pieces in a row inside a small board with the third cell empty, play in that cell to block.

5. CONTROL WHICH BOARD YOU SEND THE OPPONENT TO: The cell index you play determines where X must go next. Send X somewhere BAD for them:
   - Sending X to an already-finished board is neutral (they get free choice) — avoid unless necessary.
   - Send X to a board where you are already ahead, or where X cannot make immediate progress.
   - Avoid sending X to a board where they can win on their very next move.
   - Prefer sending X to boards where X has NO pieces yet (no immediate threat).

6. BUILD TWO-IN-A-ROW on the big board: Make moves that win small boards and build toward 3-in-a-row on the big grid.

7. PLAY STRONG CELLS IN THE SMALL BOARD: Within any small board, the center (cell 4) is strongest; corners (0,2,6,8) are next; edges (1,3,5,7) are weakest.

== THINKING PROCESS ==
Before choosing your move, reason through:
- Which small board wins would complete a line of 3 for me on the big board?
- Is X one board away from winning the overall game? Which boards does X need?
- Where does each candidate move send X next, and is that safe?
- Can I win the required small board right now?

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

  const wonByX = state.boardResults
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r === "X")
    .map(({ i }) => i);
  const wonByO = state.boardResults
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r === "O")
    .map(({ i }) => i);
  const tiedBoards = state.boardResults
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r === "tie")
    .map(({ i }) => i);

  const bigBoardLines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  const xThreats = bigBoardLines
    .filter(line => {
      const xCount = line.filter(i => state.boardResults[i] === "X").length;
      const openCount = line.filter(i => state.boardResults[i] === null).length;
      return xCount === 2 && openCount === 1;
    })
    .map(line => `boards ${line.join("-")}`);
  const oOpportunities = bigBoardLines
    .filter(line => {
      const oCount = line.filter(i => state.boardResults[i] === "O").length;
      const openCount = line.filter(i => state.boardResults[i] === null).length;
      return oCount === 2 && openCount === 1;
    })
    .map(line => `boards ${line.join("-")}`);

  const bigBoardSummary = [
    wonByX.length > 0 ? `X has won big-board positions: ${wonByX.join(", ")}` : null,
    wonByO.length > 0 ? `O has won big-board positions: ${wonByO.join(", ")}` : null,
    tiedBoards.length > 0 ? `Tied (finished, neutral) big-board positions: ${tiedBoards.join(", ")}` : null,
    xThreats.length > 0 ? `⚠ X THREATS (2-in-a-row on big board, must block): ${xThreats.join("; ")}` : null,
    oOpportunities.length > 0 ? `★ O OPPORTUNITIES (2-in-a-row on big board, go for win!): ${oOpportunities.join("; ")}` : null,
  ].filter(Boolean).join("\n");

  const userMessage = `== CURRENT BOARD STATE ==
Each [] is a small board. Inside: . = empty, X = X's move, O = your move, T = tied board.

${boardDisplay}

== BIG BOARD SUMMARY ==
${bigBoardSummary || "Game just started — no boards won yet."}

== YOUR TURN ==
${activeBoardStr}
Valid moves: ${movesStr}

Pick your best move. Respond with your MOVE line only.`;

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
        max_tokens: 300,
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
