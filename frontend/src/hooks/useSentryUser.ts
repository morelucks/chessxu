import { useEffect } from "react";
import { setSentryUser } from "../utils/sentryLogger";
import type { SentryUserContext } from "../types/sentry";
// Sentry user hook effect binding
export function useSentryUser(userContext: SentryUserContext | null): void {
// Sentry user hook effect binding
  useEffect(() => {