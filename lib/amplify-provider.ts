// lib/amplify-provider.tsx
"use client";

import { useEffect } from "react";
import { initAmplify } from "./amplify-client";

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAmplify();
  }, []);

  return children;
}
