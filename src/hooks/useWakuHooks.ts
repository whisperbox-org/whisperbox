import { useContext, useMemo } from "react";
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
    const { client } = useWakuContext();

    return useMemo(() => {
        return client?.node?.createDecoder({ contentTopic })
    }, [contentTopic])
} 