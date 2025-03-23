import { useContext, useMemo } from "react";
import { createDecoder } from "@waku/sdk";
import { WakuContext, WakuInfo } from "@/contexts/WakuContext";

export const useWakuContext = () => {
    const wakuContext = useContext(WakuContext);

    if (!wakuContext) {
        throw new Error("WakuContext at a wrong level")
    }
    
    return useMemo<WakuInfo>(() => {
        const { providerInfo } = wakuContext;
        return {...providerInfo}
    }, [wakuContext])
}

export const useWakuDecoder = (contentTopic: string) => {
    return useMemo(() => {
        return createDecoder(contentTopic)
    }, [contentTopic])
} 