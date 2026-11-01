"use client";

import { useSyncExternalStore } from "react";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
const noop = () => () => {};

/** true when served from a real domain, false on localhost, null during server render (unknown yet). */
export function useIsDeployed(): boolean | null {
  return useSyncExternalStore(
    noop,
    () => !LOCAL_HOSTS.includes(window.location.hostname),
    () => null,
  );
}
