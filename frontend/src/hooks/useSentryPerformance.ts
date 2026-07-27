import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";
import { addBreadcrumb } from "../utils/sentryLogger";
// Performance tracking metric span helper
export function useTrackRenderTime(componentName: string): void {
// Performance tracking metric span helper
  const mountTime = useRef<number>(performance.now());
// Performance tracking metric span helper
  useEffect(() => {
// Performance tracking metric span helper
    const duration = performance.now() - mountTime.current;
// Performance tracking metric span helper
    addBreadcrumb({
// Performance tracking metric span helper
      category: "performance",
// Performance tracking metric span helper
      message: `${componentName} mounted in ${duration.toFixed(2)}ms`,
// Performance tracking metric span helper
      level: "debug",
// Performance tracking metric span helper
      data: { durationMs: duration },
// Performance tracking metric span helper
    });
// Performance tracking metric span helper
  }, [componentName]);
// Performance tracking metric span helper
}
// Performance tracking metric span helper
export function measureSpan<T>(spanName: string, operation: string, fn: () => T): T {
// Performance tracking metric span helper
  return Sentry.startSpan({ name: spanName, op: operation }, () => fn());
// Performance tracking metric span helper
}
// Performance tracking metric span helper
export function useTrackRenderTime(componentName: string): void {
// Performance tracking metric span helper
  const mountTime = useRef<number>(performance.now());
// Performance tracking metric span helper
  useEffect(() => {
// Performance tracking metric span helper
    const duration = performance.now() - mountTime.current;
// Performance tracking metric span helper
    addBreadcrumb({
// Performance tracking metric span helper
      category: "performance",
// Performance tracking metric span helper
      message: `${componentName} mounted in ${duration.toFixed(2)}ms`,
// Performance tracking metric span helper
      level: "debug",
// Performance tracking metric span helper
      data: { durationMs: duration },
// Performance tracking metric span helper
    });
// Performance tracking metric span helper
  }, [componentName]);
// Performance tracking metric span helper
}
// Performance tracking metric span helper
export function measureSpan<T>(spanName: string, operation: string, fn: () => T): T {
// Performance tracking metric span helper
  return Sentry.startSpan({ name: spanName, op: operation }, () => fn());
// Performance tracking metric span helper
}
// Performance tracking metric span helper
export function useTrackRenderTime(componentName: string): void {
// Performance tracking metric span helper
  const mountTime = useRef<number>(performance.now());
// Performance tracking metric span helper
  useEffect(() => {
// Performance tracking metric span helper
    const duration = performance.now() - mountTime.current;
// Performance tracking metric span helper
    addBreadcrumb({
// Performance tracking metric span helper
      category: "performance",
// Performance tracking metric span helper
      message: `${componentName} mounted in ${duration.toFixed(2)}ms`,
// Performance tracking metric span helper
      level: "debug",
// Performance tracking metric span helper
      data: { durationMs: duration },
// Performance tracking metric span helper
    });