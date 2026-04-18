import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BigBoard } from "@/components/BigBoard";
import { StatusBar } from "@/components/StatusBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { createInitialState, applyMove } from "@/lib/gameLogic";
import { getLLMMove } from "@/lib/llmService";
import { loadSettings } from "@/lib/settings";
import type { LLMSettings } from "@/lib/llmService";

export default function Game() {
  const [state, setState] = useState(createInitialState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LLMSettings>(loadSettings);

  const llmConfigured = !!(settings.baseUrl && settings.apiKey && settings.model);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
    setSettings(loadSettings());
  }, []);

  const handleNewGame = useCallback(() => {
    setState(createInitialState());
    setIsWaiting(false);
    setLlmError(null);
  }, []);

  const handleHumanMove = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (isWaiting || state.winner || state.currentPlayer !== "X") return;
      setState((prev) => applyMove(prev, boardIndex, cellIndex));
      setLlmError(null);
    },
    [isWaiting, state.winner, state.currentPlayer]
  );

  useEffect(() => {
    if (
      state.currentPlayer === "O" &&
      !state.winner &&
      !isWaiting &&
      llmConfigured
    ) {
      setIsWaiting(true);
      const currentState = state;
      const currentSettings = settings;
      getLLMMove(currentState, currentSettings)
        .then((move) => {
          if (!move) return;
          setState((prev) => {
            if (prev.currentPlayer !== "O" || prev.winner) return prev;
            return applyMove(prev, move.boardIndex, move.cellIndex);
          });
        })
        .catch((e) => {
          setLlmError(
            e instanceof Error ? e.message : "LLM error — check the console for details"
          );
        })
        .finally(() => {
          setIsWaiting(false);
        });
    }
  }, [state.currentPlayer, state.winner, llmConfigured, settings]);

  const isHumanTurn = state.currentPlayer === "X" && !state.winner;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-amber-400">
            TTT<sup className="text-sm">2</sup>
          </span>
          <span className="text-sm text-slate-400 font-medium hidden sm:inline">
            Tic Tac Toe Squared
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewGame}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            New Game
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
              />
              <path
                fillRule="evenodd"
                d="M6.5 1.75a.75.75 0 0 1 1.5 0v.82a5.51 5.51 0 0 1 2.18.905l.58-.58a.75.75 0 1 1 1.06 1.06l-.58.58A5.51 5.51 0 0 1 12.14 6.5h.82a.75.75 0 0 1 0 1.5h-.82a5.51 5.51 0 0 1-.905 2.18l.58.58a.75.75 0 0 1-1.06 1.06l-.58-.58A5.51 5.51 0 0 1 7.86 12.43v.82a.75.75 0 0 1-1.5 0v-.82a5.51 5.51 0 0 1-2.18-.905l-.58.58a.75.75 0 1 1-1.06-1.06l.58-.58A5.51 5.51 0 0 1 2.43 8.5H1.75a.75.75 0 0 1 0-1.5h.68a5.51 5.51 0 0 1 .905-2.18l-.58-.58a.75.75 0 0 1 1.06-1.06l.58.58A5.51 5.51 0 0 1 6.5 2.57V1.75Z"
              />
            </svg>
            Settings
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start gap-4 p-4 overflow-y-auto">
        <div className="space-y-1 text-center mt-2">
          <StatusBar
            state={state}
            isWaiting={isWaiting}
            llmConfigured={llmConfigured}
          />

          {state.activeBoard !== null && !state.winner && (
            <p className="text-xs text-slate-500">
              Next board:{" "}
              <span className="text-slate-400 font-medium">
                row {Math.floor(state.activeBoard / 3) + 1}, col {(state.activeBoard % 3) + 1}
              </span>
            </p>
          )}

          {!state.winner && state.activeBoard === null && !isWaiting && (
            <p className="text-xs text-slate-500">
              {state.currentPlayer === "X"
                ? "You may play on any open board"
                : "LLM may play on any open board"}
            </p>
          )}
        </div>

        {llmError && (
          <div className="bg-rose-900/40 border border-rose-700 rounded-lg px-3 py-2 text-xs text-rose-300 max-w-md text-center">
            {llmError}
          </div>
        )}

        {!llmConfigured && !settingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-4 text-center max-w-sm"
          >
            <p className="text-amber-300 font-semibold text-sm mb-2">
              Configure LLM to play
            </p>
            <p className="text-slate-400 text-xs mb-3">
              Enter your API base URL, key, and model to let an AI opponent play O.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors"
            >
              Open Settings
            </button>
          </motion.div>
        )}

        <BigBoard
          state={state}
          onMove={handleHumanMove}
          isHumanTurn={isHumanTurn}
          isWaiting={isWaiting}
        />

        {state.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <button
              onClick={handleNewGame}
              className="px-6 py-2.5 font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors shadow-lg shadow-amber-500/20 text-sm"
            >
              Play again
            </button>
          </motion.div>
        )}

        <div className="flex items-center gap-6 text-xs text-slate-600 pb-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-amber-400" />
            Active board
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-sky-400 font-bold">X</span>
            You
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">O</span>
            LLM
          </span>
        </div>
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </div>
  );
}
