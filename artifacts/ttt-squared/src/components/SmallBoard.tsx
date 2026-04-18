import type { Cell, BoardResult, Player } from "@/lib/gameLogic";
import { motion } from "framer-motion";

interface SmallBoardProps {
  cells: Cell[];
  result: BoardResult;
  isActive: boolean;
  isPlayable: boolean;
  onCellClick: (cellIndex: number) => void;
  isHuman: boolean;
}

function CellMark({ value }: { value: Cell }) {
  if (!value) return null;
  const isX = value === "X";
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`text-xl font-black select-none ${isX ? "text-sky-400" : "text-rose-400"}`}
    >
      {value}
    </motion.span>
  );
}

function WinnerOverlay({ result }: { result: BoardResult }) {
  if (!result) return null;
  const isX = result === "X";
  const isTie = result === "tie";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-[1px] ${
        isTie
          ? "bg-slate-700/70"
          : isX
          ? "bg-sky-900/75"
          : "bg-rose-900/75"
      }`}
    >
      <span
        className={`text-4xl font-black drop-shadow-lg ${
          isTie ? "text-slate-300" : isX ? "text-sky-300" : "text-rose-300"
        }`}
      >
        {isTie ? "=" : result}
      </span>
    </motion.div>
  );
}

export function SmallBoard({
  cells,
  result,
  isActive,
  isPlayable,
  onCellClick,
  isHuman,
}: SmallBoardProps) {
  return (
    <div
      className={`relative p-1 rounded-lg transition-all duration-200 ${
        isActive
          ? "ring-2 ring-amber-400 bg-slate-700/60 shadow-lg shadow-amber-400/20"
          : result !== null
          ? "bg-slate-800/40"
          : "bg-slate-800/30"
      }`}
    >
      <div className="grid grid-cols-3 gap-0.5">
        {cells.map((cell, ci) => {
          const canClick = isHuman && isPlayable && !cell && result === null;
          return (
            <button
              key={ci}
              onClick={() => canClick && onCellClick(ci)}
              disabled={!canClick}
              className={`
                aspect-square flex items-center justify-center rounded text-sm font-bold
                transition-all duration-100
                ${
                  canClick
                    ? "cursor-pointer hover:bg-slate-600/60 active:bg-slate-500/60"
                    : "cursor-default"
                }
                ${ci % 3 !== 2 ? "border-r border-slate-600/50" : ""}
                ${Math.floor(ci / 3) !== 2 ? "border-b border-slate-600/50" : ""}
              `}
              style={{ minWidth: 28, minHeight: 28 }}
            >
              <CellMark value={cell} />
            </button>
          );
        })}
      </div>
      <WinnerOverlay result={result} />
    </div>
  );
}

export type { Player };
