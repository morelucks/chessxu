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