"use client";

import { useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResourcesProvider, createApiClient, createResources } from "@raqs/shared";
import { Toaster } from "sonner";

export function Providers({
  accessToken,
  children,
}: {
  accessToken: string | null;
  children: React.ReactNode;
}) {
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;
  const [queryClient] = useState(() => new QueryClient());
  const [resources] = useState(() =>
    createResources(
      createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000", {
        getToken: () => tokenRef.current,
        onUnauthorized: () => {
          tokenRef.current = null;
          void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
            if (window.location.pathname !== "/login") window.location.assign("/login");
          });
        },
      }),
    ),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ResourcesProvider resources={resources}>
        {children}
        <Toaster position="top-right" />
      </ResourcesProvider>
    </QueryClientProvider>
  );
}
