import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResourcesProvider } from "@raqs/shared";
import { AuthProvider } from "./auth/auth-context";
import { resources } from "./api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ResourcesProvider resources={resources}>
        <AuthProvider>{children}</AuthProvider>
      </ResourcesProvider>
    </QueryClientProvider>
  );
}
