"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResourcesProvider, createApiClient, createResources } from "@raqs/shared";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [resources] = useState(() =>
    createResources(
      createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000", {
        onUnauthorized: () => {
          window.location.assign("/login");
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
