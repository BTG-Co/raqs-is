import { createContext, useContext, type ReactNode } from "react";
import type { Resources } from "./resources";

const ResourcesContext = createContext<Resources | null>(null);

export function ResourcesProvider({
  resources,
  children,
}: {
  resources: Resources;
  children: ReactNode;
}) {
  return <ResourcesContext.Provider value={resources}>{children}</ResourcesContext.Provider>;
}

export function useResources(): Resources {
  const resources = useContext(ResourcesContext);
  if (!resources) throw new Error("useResources must be used within ResourcesProvider.");
  return resources;
}
