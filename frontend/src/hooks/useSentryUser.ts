import { useEffect } from "react";
import { setSentryUser } from "../utils/sentryLogger";
import type { SentryUserContext } from "../types/sentry";
// Sentry user hook effect binding
export function useSentryUser(userContext: SentryUserContext | null): void {
// Sentry user hook effect binding
  useEffect(() => {
// Sentry user hook effect binding
    if (userContext) {
// Sentry user hook effect binding
      setSentryUser(userContext);
// Sentry user hook effect binding
    } else {
// Sentry user hook effect binding
      setSentryUser(null);
// Sentry user hook effect binding
    }
// Sentry user hook effect binding
  }, [userContext?.id, userContext?.walletAddress, userContext?.network, userContext?.isMiniPay]);
// Sentry user hook effect binding
}
// Sentry user hook effect binding
export function useSentryUser(userContext: SentryUserContext | null): void {
// Sentry user hook effect binding
  useEffect(() => {
// Sentry user hook effect binding
    if (userContext) {
// Sentry user hook effect binding
      setSentryUser(userContext);
// Sentry user hook effect binding
    } else {
// Sentry user hook effect binding
      setSentryUser(null);
// Sentry user hook effect binding
    }
// Sentry user hook effect binding
  }, [userContext?.id, userContext?.walletAddress, userContext?.network, userContext?.isMiniPay]);
// Sentry user hook effect binding
}
// Sentry user hook effect binding
export function useSentryUser(userContext: SentryUserContext | null): void {
// Sentry user hook effect binding
  useEffect(() => {
// Sentry user hook effect binding
    if (userContext) {
// Sentry user hook effect binding
      setSentryUser(userContext);
// Sentry user hook effect binding
    } else {
// Sentry user hook effect binding
      setSentryUser(null);
// Sentry user hook effect binding
    }
// Sentry user hook effect binding
  }, [userContext?.id, userContext?.walletAddress, userContext?.network, userContext?.isMiniPay]);
// Sentry user hook effect binding
}
// Sentry user hook effect binding
export function useSentryUser(userContext: SentryUserContext | null): void {
// Sentry user hook effect binding
  useEffect(() => {
// Sentry user hook effect binding
    if (userContext) {
// Sentry user hook effect binding
      setSentryUser(userContext);
// Sentry user hook effect binding
    } else {