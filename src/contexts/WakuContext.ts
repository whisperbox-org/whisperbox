import React from "react";
import { HealthStatus } from "@waku/interfaces";
import { WakuClient } from "@/lib/waku";

export type WakuInfo = {
    client: WakuClient | undefined
    status: string;
    connected: boolean;
    health: HealthStatus
    stop: () => void;
}

export type WakuContextData = {
    providerInfo: WakuInfo;
} | null;

export const WakuContext = React.createContext<WakuContextData>(null); 