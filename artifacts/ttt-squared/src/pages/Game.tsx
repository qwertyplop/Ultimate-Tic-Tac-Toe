import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { BigBoard } from "@/components/BigBoard";
import { StatusBar } from "@/components/StatusBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { MoveHistory } from "@/components/MoveHistory";
import type { MoveRecord } from "@/components/MoveHistory";
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

  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const replayStates = useMemo(() => {
    const states = [];
    let s = createInitialState();
    for (const move of moveHistory) {
      s = applyMove(s, move.boardIndex, move.cellIndex);
      states.push(s);
    }
    return states;
  }, [moveHistory]);

  const displayedState = viewingIndex !== null ? replayStates[viewingIndex] : state;
  const isViewing = viewingIndex !== null;

  const llmConfigured = !!(settings.baseUrl && settings.apiKey && settings.model);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
    setSettings(loadSettings());
  }, []);

  const handleNewGame = useCallback(() => {
    setState(createInitialState());
    setIsWaiting(false);
    setLlmError(null);
    setMoveHistory([]);
    setViewingIndex(null);
  }, []);

  const handleHumanMove = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (isViewing) return;
      if (isWaiting || state.winner || state.currentPlayer !== "X") return;
      const nextState = applyMove(state, boardIndex, cellIndex);
      if (nextState === state) return;
      setState(nextState);
      setMoveHistory((prev) => [...prev, { player: "X", boardIndex, cellIndex }]);
      setLlmError(null);
    },
    [isViewing, isWaiting, state]
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
          const prev = stateRef.current;
          if (prev.currentPlayer !== "O" || prev.winner) return;
          const nextState = applyMove(prev, move.boardIndex, move.cellIndex);
          if (nextState === prev) return;
          setState(nextState);
          setMoveHistory((h) => [
            ...h,
            { player: "O", boardIndex: move.boardIndex, cellIndex: move.cellIndex },
          ]);
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

  const isHumanTurn =
    state.currentPlayer === "X" && !state.winner && !isViewing;

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

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex gap-4 p-4 overflow-hidden items-start justify-center">
          <div className="flex flex-col items-center gap-4 overflow-y-auto flex-1 min-w-0 max-w-xl">
            <div className="space-y-1 text-center w-full mt-2">
              <StatusBar
                state={isViewing ? displayedState : state}
                isWaiting={isViewing ? false : isWaiting}
                llmConfigured={llmConfigured}
              />

              {isViewing && (
                <p className="text-xs text-amber-500 font-medium">
                  Viewing move {viewingIndex + 1} of {moveHistory.length} — click "Back to live" in the log to resume
                </p>
              )}

              {!isViewing && displayedState.activeBoard !== null && !displayedState.winner && (
                <p className="text-xs text-slate-500">
                  Next board:{" "}
                  <span className="text-slate-400 font-medium">
                    row {Math.floor(displayedState.activeBoard / 3) + 1}, col{" "}
                    {(displayedState.activeBoard % 3) + 1}
                  </span>
                </p>
              )}

              {!isViewing && !displayedState.winner && displayedState.activeBoard === null && !isWaiting && (
                <p className="text-xs text-slate-500">
                  {displayedState.currentPlayer === "X"
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
              state={displayedState}
              onMove={handleHumanMove}
              isHumanTurn={isHumanTurn}
              isWaiting={isViewing ? false : isWaiting}
            />

            {state.winner && !isViewing && (
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
          </div>

          <div className="hidden sm:flex flex-col" style={{ height: "calc(100vh - 64px)", paddingTop: "8px" }}>
            <MoveHistory
              history={moveHistory}
              viewingIndex={viewingIndex}
              onViewMove={setViewingIndex}
              isLive={!state.winner}
            />
          </div>
        </div>

        <div className="sm:hidden px-4 pb-4">
          <MoveHistory
            history={moveHistory}
            viewingIndex={viewingIndex}
            onViewMove={setViewingIndex}
            isLive={!state.winner}
          />
        </div>
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </div>
  );
}
