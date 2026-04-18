import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "@/lib/gameLogic";

export interface MoveRecord {
  player: Player;
  boardIndex: number;
  cellIndex: number;
}

interface MoveHistoryProps {
  history: MoveRecord[];
  viewingIndex: number | null;
  onViewMove: (index: number | null) => void;
  isLive: boolean;
}

function boardLabel(boardIndex: number) {
  const row = Math.floor(boardIndex / 3) + 1;
  const col = (boardIndex % 3) + 1;
  return `B${row}${col}`;
}

function cellLabel(cellIndex: number) {
  return cellIndex + 1;
}

export function MoveHistory({ history, viewingIndex, onViewMove, isLive }: MoveHistoryProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isViewing = viewingIndex !== null;

  useEffect(() => {
    if (!isViewing && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history.length, isViewing]);

  return (
    <div className="flex flex-col bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden w-full max-w-[200px] shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/60 shrink-0">
        <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
          Move Log
        </span>
        {history.length > 0 && (
          <span className="text-xs text-slate-500">{history.length}</span>
        )}
      </div>

      {isViewing && (
        <div className="px-3 py-1.5 border-b border-slate-700/40 bg-amber-900/20 shrink-0">
          <button
            onClick={() => onViewMove(null)}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors w-full text-left flex items-center gap-1"
          >
            <span>▶</span>
            <span>Back to live</span>
          </button>
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 py-1">
        {history.length === 0 ? (
          <p className="text-xs text-slate-600 text-center px-3 py-4">No moves yet</p>
        ) : (
          <AnimatePresence initial={false}>
            {history.map((move, i) => {
              const isSelected = viewingIndex === i;
              const isX = move.player === "X";
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onViewMove(isSelected ? null : i)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs ${
                    isSelected
                      ? "bg-slate-700/80 text-white"
                      : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-200"
                  }`}
                >
                  <span className="text-slate-600 w-5 text-right shrink-0">{i + 1}.</span>
                  <span
                    className={`font-bold shrink-0 w-3 ${isX ? "text-sky-400" : "text-rose-400"}`}
                  >
                    {move.player}
                  </span>
                  <span className="truncate">
                    {boardLabel(move.boardIndex)} · c{cellLabel(move.cellIndex)}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {!isLive && (
        <div className="px-3 py-2 border-t border-slate-700/40 text-xs text-amber-500 font-medium text-center shrink-0">
          Game over
        </div>
      )}
    </div>
  );
}
