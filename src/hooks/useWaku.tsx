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
import { BOOTSTRAP_NODES, NETWORK_CONFIG } from "@/config/waku";
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
        (async () => {
            if (connected || connecting || node || !address) return
            setConnecting(true)
            setStatus("starting")
            updateStatus("Starting Waku node", "info", 2000)
            await createLightNode({
                networkConfig: NETWORK_CONFIG,
                defaultBootstrap: false,
                bootstrapPeers: BOOTSTRAP_NODES,
                numPeersToUse: 1,
                
            }).then( async (ln: LightNode) => {
                if (node) return
                setNode(ln)
                setStatus("connecting")

            
                
                try {
                    updateStatus("Waiting for a peer", "success", 3000)
                    await ln.waitForPeers([Protocols.LightPush, Protocols.Filter, Protocols.Store])
                    updateStatus("Waku node successfully connected", "success", 5000)
                    console.log(await ln.libp2p.peerStore.all())
                    ln.health.addEventListener(HealthStatusChangeEvents.StatusChange, (hs) => {
                            setHealth(hs.detail)
                        })

                    const c = new WakuClient(ln);
                    setClient(c)
                    c.setAddress(address)
                    await c.init()
                    setStatus("connected")
                    setConnected(true)
                    setConnecting(false)
                } finally {
                    setConnecting(false)
                }
            })
        })()


     }, [address, connected, connecting, node, updateStatus])

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