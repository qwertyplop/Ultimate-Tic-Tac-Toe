import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@/lib/gameLogic";

interface StatusBarProps {
  state: GameState;
  isWaiting: boolean;
  llmConfigured: boolean;
}

export function StatusBar({ state, isWaiting, llmConfigured }: StatusBarProps) {
  let message: string;
  let colorClass: string;

  if (state.winner === "X") {
    message = "You win!";
    colorClass = "text-sky-300";
  } else if (state.winner === "O") {
    message = "LLM wins!";
    colorClass = "text-rose-300";
  } else if (state.winner === "tie") {
    message = "It's a tie!";
    colorClass = "text-slate-300";
  } else if (!llmConfigured) {
    message = "Configure LLM settings to play";
    colorClass = "text-amber-300";
  } else if (isWaiting) {
    message = "LLM is thinking...";
    colorClass = "text-violet-300";
  } else if (state.currentPlayer === "X") {
    message = "Your turn (X)";
    colorClass = "text-sky-300";
  } else {
    message = "LLM's turn (O)";
    colorClass = "text-rose-300";
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={`text-center font-semibold text-lg tracking-wide ${colorClass}`}
      >
        {message}
        {isWaiting && (
          <span className="ml-2 inline-flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
