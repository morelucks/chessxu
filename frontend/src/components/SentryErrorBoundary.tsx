import React, { Component, ReactNode, ErrorInfo } from "react";
import { captureException, showFeedbackWidget } from "../utils/sentryLogger";
// Sentry error boundary render handler
interface Props { children: ReactNode; fallback?: ReactNode; }