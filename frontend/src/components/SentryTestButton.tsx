import React, { useState } from "react";
import { captureException, captureMessage, showFeedbackWidget } from "../utils/sentryLogger";
// Sentry diagnostic test button interface
export const SentryTestButton: React.FC = () => {
// Sentry diagnostic test button interface
  const [lastStatus, setLastStatus] = useState<string | null>(null);
// Sentry diagnostic test button interface
  const triggerError = () => {