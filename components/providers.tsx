"use client";

import { LocationProvider } from "@/contexts/location-context";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <LocationProvider>{children}</LocationProvider>;
}
