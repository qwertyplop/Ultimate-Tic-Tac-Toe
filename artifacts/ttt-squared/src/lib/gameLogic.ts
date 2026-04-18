export type Player = "X" | "O";
export type Cell = Player | null;
export type SmallBoard = Cell[];
export type BoardResult = Player | "tie" | null;

export interface GameState {
  boards: SmallBoard[];
  boardResults: BoardResult[];
  currentPlayer: Player;
  activeBoard: number | null;
  winner: Player | "tie" | null;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(cells: Cell[]): Player | "tie" | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a] as Player;
    }
  }
  if (cells.every((c) => c !== null)) return "tie";
  return null;
}

export function createInitialState(): GameState {
  return {
    boards: Array(9)
      .fill(null)
      .map(() => Array(9).fill(null)),
    boardResults: Array(9).fill(null),
    currentPlayer: "X",
    activeBoard: null,
    winner: null,
  };
}

export function applyMove(
  state: GameState,
  boardIndex: number,
  cellIndex: number
): GameState {
  if (state.winner) return state;
  if (state.boardResults[boardIndex] !== null) return state;
  if (state.activeBoard !== null && state.activeBoard !== boardIndex) return state;
  if (state.boards[boardIndex][cellIndex] !== null) return state;

  const newBoards = state.boards.map((b, i) =>
    i === boardIndex ? b.map((c, j) => (j === cellIndex ? state.currentPlayer : c)) : [...b]
  );

  const newBoardResults = [...state.boardResults];
  newBoardResults[boardIndex] = checkWinner(newBoards[boardIndex]);

  const bigBoardCells: Cell[] = newBoardResults.map((r) =>
    r === "X" ? "X" : r === "O" ? "O" : null
  );
  const newOverallWinner = checkWinner(bigBoardCells);

  let newActiveBoard: number | null = cellIndex;
  if (newBoardResults[cellIndex] !== null) {
    newActiveBoard = null;
  }

  const nextPlayer: Player = state.currentPlayer === "X" ? "O" : "X";

  let winner: Player | "tie" | null = null;
  if (newOverallWinner === "X" || newOverallWinner === "O") {
    winner = newOverallWinner;
  } else if (newOverallWinner === "tie") {
    winner = "tie";
  }

  return {
    boards: newBoards,
    boardResults: newBoardResults,
    currentPlayer: nextPlayer,
    activeBoard: newActiveBoard,
    winner,
  };
}

export function getValidMoves(
  state: GameState
): Array<{ boardIndex: number; cellIndex: number }> {
  const moves: Array<{ boardIndex: number; cellIndex: number }> = [];

  const validBoards =
    state.activeBoard !== null
      ? [state.activeBoard]
      : state.boardResults
          .map((r, i) => (r === null ? i : -1))
          .filter((i) => i !== -1);

  for (const bi of validBoards) {
    if (state.boardResults[bi] !== null) continue;
    for (let ci = 0; ci < 9; ci++) {
      if (state.boards[bi][ci] === null) {
        moves.push({ boardIndex: bi, cellIndex: ci });
      }
    }
  }

  return moves;
}

export function isBoardPlayable(state: GameState, boardIndex: number): boolean {
  if (state.boardResults[boardIndex] !== null) return false;
  if (state.activeBoard !== null && state.activeBoard !== boardIndex) return false;
  return true;
}
