import React, { useState } from "react";
import { captureException, captureMessage, showFeedbackWidget } from "../utils/sentryLogger";
// Sentry diagnostic test button interface
export const SentryTestButton: React.FC = () => {