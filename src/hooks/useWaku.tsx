import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    createLightNode,
    LightNode,
  } from "@waku/sdk";
import {
    HealthStatus,
    HealthStatusChangeEvents,
    Protocols
} from "@waku/interfaces"
import { WakuClient } from "@/lib/waku";
import { walletService } from "@/lib/wallet";
import { WakuContext } from "@/contexts/WakuContext";

interface Props {
    updateStatus: (msg: string, typ: string, delay?: number) => void
    children: React.ReactNode
}

export const WakuContextProvider = ({ children, updateStatus }: Props) => {
    const [status, setStatus] = useState<string>("disconnected")
    const [connected, setConnected] = useState<boolean>(false)
    const [connecting, setConnecting] = useState<boolean>(false)
    const [node, setNode] = useState<LightNode>()
    const [health, setHealth] = useState<HealthStatus>(HealthStatus.Unhealthy)
    const [ client, setClient ] = useState<WakuClient | undefined>(undefined)
    const address = walletService.getConnectedWallet();

    useEffect(() => {
        console.log("WakuContextProvider: address changed", address);
        const connectToWaku = async () => {
            if (connected || connecting || node ) return;
            
            try {
                setConnecting(true);
                setStatus("starting");
                updateStatus("Starting Waku node", "info", 2000);
                
                const ln = await createLightNode({
                    defaultBootstrap: true,
                });
                console.log("Light node created");
                
                // Return early if node is already set (race condition protection)
                if (node) return;
                
                setNode(ln);
                setStatus("connecting");
                
                console.log("Waiting for a peer");
                updateStatus("Waiting for a peer", "success", 3000);
                // await ln.waitForPeers([Protocols.LightPush, Protocols.Filter, Protocols.Store]);
                console.log("Peer found");
                updateStatus("Waku node successfully connected", "success", 5000);

                console.log("Getting all peers");
                console.log(await ln.libp2p.peerStore.all());
                
                
                console.log(ln)
                ln.events.addEventListener("waku:health", (hs) => {
                    setHealth(hs.detail);
                });
                
                
                const c = new WakuClient(ln);
                setClient(c);
                await c.init();
                
                setStatus("connected");
                setConnected(true);
            } catch (error) {
                console.error("Failed to connect to Waku:", error);
                setStatus("error");
            } finally {
                setConnecting(false);
            }
        };
        
        connectToWaku();
    }, [address, connected, connecting, node, updateStatus]);

    useEffect(() => {
        if (!client || !address) return;
        console.log("Waku client and address available");
        client.setAddress(address);
    }, [client, address]);

    const stop = useCallback(() => {
        node?.stop()
        setConnected(false)
        setStatus("stopped")
    }, [node]);
    
    const wakuInfo = useMemo(
        () => ({
            client,
            status,
            connected,
            stop,
            health,
        }),
        [
            client,
            status,
            connected,
            stop,
            health,
        ]
    )

    return ( <WakuContext.Provider value={{ providerInfo: wakuInfo }}>
        { children }
    </WakuContext.Provider>)
}