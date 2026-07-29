import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";
import { addBreadcrumb } from "../utils/sentryLogger";

export function useTrackRenderTime(componentName: string): void {
  const mountTime = useRef<number>(performance.now());

  useEffect(() => {
    const duration = performance.now() - mountTime.current;
    addBreadcrumb({
      category: "performance",
      message: `${componentName} mounted in ${duration.toFixed(2)}ms`,
      level: "debug",
      data: { durationMs: duration },
    });
  }, [componentName]);
}

export function measureSpan<T>(spanName: string, operation: string, fn: () => T): T {
  return Sentry.startSpan({ name: spanName, op: operation }, () => fn());
}