# Sentry Error Tracking & Monitoring Integration

This document describes the Sentry monitoring architecture for Chessxu.
## Overview
This integration provides real-time error tracking, user feedback, and performance monitoring via @sentry/react.
## Environment Variables
- `VITE_SENTRY_DSN`: The Sentry Data Source Name URL.
- `VITE_SENTRY_ENVIRONMENT`: Mode (e.g., development, production).
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: Tracing sample rate (0.0 to 1.0).