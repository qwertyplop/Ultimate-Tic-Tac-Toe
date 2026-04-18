import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LLMSettings } from "@/lib/llmService";
import { fetchModels } from "@/lib/llmService";
import { loadSettings, saveSettings } from "@/lib/settings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<LLMSettings>(loadSettings);
  const [models, setModels] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(loadSettings());
      setFetchError("");
      setSaved(false);
    }
  }, [open]);

  const handleFetchModels = async () => {
    setFetching(true);
    setFetchError("");
    setModels([]);
    try {
      const list = await fetchModels(settings);
      setModels(list);
      if (list.length > 0 && !list.includes(settings.model)) {
        setSettings((s) => ({ ...s, model: list[0] }));
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch models");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">LLM Settings</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  placeholder="https://api.openai.com/v1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Any OpenAI-compatible endpoint (e.g. Ollama, Together, Groq)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-300">
                    Model
                  </label>
                  <button
                    onClick={handleFetchModels}
                    disabled={fetching || !settings.baseUrl || !settings.apiKey}
                    className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {fetching ? "Fetching..." : "Fetch models"}
                  </button>
                </div>

                {models.length > 0 ? (
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                    placeholder="gpt-4o-mini"
                  />
                )}

                {fetchError && (
                  <p className="text-xs text-rose-400 mt-1">{fetchError}</p>
                )}
                {models.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {models.length} model{models.length !== 1 ? "s" : ""} loaded. You can also type manually below.
                  </p>
                )}
                {models.length > 0 && (
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors mt-2"
                    placeholder="Or type model name manually"
                  />
                )}
              </div>

              <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">How it works</p>
                <p>The LLM is called directly from your browser. Your API key is stored only in your browser's localStorage and never sent to any server other than the one you configure.</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-700">
              <button
                onClick={handleSave}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-900"
                }`}
              >
                {saved ? "Saved!" : "Save Settings"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
