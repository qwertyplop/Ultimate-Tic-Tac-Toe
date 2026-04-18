import { SmallBoard } from "./SmallBoard";
import type { GameState } from "@/lib/gameLogic";
import { isBoardPlayable } from "@/lib/gameLogic";

interface BigBoardProps {
  state: GameState;
  onMove: (boardIndex: number, cellIndex: number) => void;
  isHumanTurn: boolean;
  isWaiting: boolean;
}

export function BigBoard({ state, onMove, isHumanTurn, isWaiting }: BigBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[520px] mx-auto">
      {state.boards.map((board, bi) => {
        const isActive =
          state.winner === null &&
          (state.activeBoard === null
            ? state.boardResults[bi] === null
            : state.activeBoard === bi);
        const playable =
          state.winner === null &&
          isHumanTurn &&
          !isWaiting &&
          isBoardPlayable(state, bi);

        return (
          <SmallBoard
            key={bi}
            cells={board}
            result={state.boardResults[bi]}
            isActive={isActive}
            isPlayable={playable}
            onCellClick={(ci) => onMove(bi, ci)}
            isHuman={isHumanTurn && !isWaiting}
          />
        );
      })}
    </div>
  );
}
