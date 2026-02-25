"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole } from "./auth";

/**
 * Redirect to /login if no token. Optionally require one of the given roles (admin, tester, viewer).
 * Uses a ref for allowedRoles so the effect only runs on mount (avoids redirect loops).
 */
export function useAuthGuard(allowedRoles?: string[]) {
  const router = useRouter();
  const allowedRef = useRef(allowedRoles);
  allowedRef.current = allowedRoles;

  useEffect(() => {
    const id = setTimeout(() => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const roles = allowedRef.current;
      if (roles && roles.length > 0) {
        const role = getRole();
        if (!role || !roles.includes(role)) {
          router.replace("/dashboard");
        }
      }
    }, 0);
    return () => clearTimeout(id);
  }, [router]);
}
