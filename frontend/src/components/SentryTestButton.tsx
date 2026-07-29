import React, { useState } from "react";
import { captureException, captureMessage, showFeedbackWidget } from "../utils/sentryLogger";

export const SentryTestButton: React.FC = () => {
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const triggerError = () => {
    try {
      throw new Error("Sentry Diagnostic Test Error");
    } catch (err) {
      const eventId = captureException(err, { category: "test" });
      setLastStatus(`Captured error ID: ${eventId}`);
    }
  };

  const triggerMessage = () => {
    const eventId = captureMessage("Sentry Diagnostic Test Message", "warning");
    setLastStatus(`Captured message ID: ${eventId}`);
  };

  const openWidget = () => {
    showFeedbackWidget();
    setLastStatus("Opened feedback widget");
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
      <h3 className="font-semibold text-sm mb-2">Sentry Controls</h3>
      <div className="flex gap-2 mb-2">
        <button onClick={triggerError} className="px-3 py-1 bg-red-600 rounded text-xs">
          Test Error
        </button>
        <button onClick={triggerMessage} className="px-3 py-1 bg-amber-600 rounded text-xs">
          Test Warning
        </button>
        <button onClick={openWidget} className="px-3 py-1 bg-indigo-600 rounded text-xs">
          Feedback Widget
        </button>
      </div>
      {lastStatus && <p className="text-xs text-slate-400 font-mono">{lastStatus}</p>}
    </div>
  );
};