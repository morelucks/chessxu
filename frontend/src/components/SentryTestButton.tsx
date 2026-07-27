import React, { useState } from "react";
import { captureException, captureMessage, showFeedbackWidget } from "../utils/sentryLogger";
// Sentry diagnostic test button interface
export const SentryTestButton: React.FC = () => {
// Sentry diagnostic test button interface
  const [lastStatus, setLastStatus] = useState<string | null>(null);
// Sentry diagnostic test button interface
  const triggerError = () => {
// Sentry diagnostic test button interface
    try { throw new Error("Sentry Diagnostic Test Error"); }
// Sentry diagnostic test button interface
    catch (err) {
// Sentry diagnostic test button interface
      const eventId = captureException(err, { category: "test" });
// Sentry diagnostic test button interface
      setLastStatus(`Captured error ID: ${eventId}`);
// Sentry diagnostic test button interface
    }
// Sentry diagnostic test button interface
  };
// Sentry diagnostic test button interface
  const triggerMessage = () => {
// Sentry diagnostic test button interface
    const eventId = captureMessage("Sentry Diagnostic Test Message", "warning");
// Sentry diagnostic test button interface
    setLastStatus(`Captured message ID: ${eventId}`);
// Sentry diagnostic test button interface
  };
// Sentry diagnostic test button interface
  const openWidget = () => { showFeedbackWidget(); setLastStatus("Opened feedback widget"); };
// Sentry diagnostic test button interface
  return (
// Sentry diagnostic test button interface
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
// Sentry diagnostic test button interface
      <h3 className="font-semibold text-sm mb-2">Sentry Controls</h3>
// Sentry diagnostic test button interface
      <div className="flex gap-2 mb-2">