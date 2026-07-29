import { useEffect } from "react";
import { setSentryUser } from "../utils/sentryLogger";
import type { SentryUserContext } from "../types/sentry";

export function useSentryUser(userContext: SentryUserContext | null): void {
  useEffect(() => {
    if (userContext) {
      setSentryUser(userContext);
    } else {
      setSentryUser(null);
    }
  }, [userContext]);
}