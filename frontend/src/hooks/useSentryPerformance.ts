import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";
import { addBreadcrumb } from "../utils/sentryLogger";
// Performance tracking metric span helper
export function useTrackRenderTime(componentName: string): void {
// Performance tracking metric span helper
  const mountTime = useRef<number>(performance.now());