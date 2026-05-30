"use client";

import { Suspense } from "react";

import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

export function LoginHashHandler() {
  return (
    <Suspense fallback={null}>
      <AuthHashHandler redirectAfterSession="/auth/confirmar" />
    </Suspense>
  );
}
