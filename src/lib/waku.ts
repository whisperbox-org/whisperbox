import EventEmitter from "events"
import getDispatcher, { destroyDispatcher, Dispatcher, DispatchMetadata, Signer} from "waku-dispatcher"
import { createEncoder, IWaku, LightNode, Protocols, utf8ToBytes,  } from "@waku/sdk";
import { addForm, createForm, getAllForms, getFormById, submitResponse } from "./formStore";
import { FormSubmissionParams, FormType } from "@/types";


export enum ClientState {
    INITIALIZED = "initialized",
    INITIALIZING = "initializing",
    FAILED = "failed,"
}

export enum ClientEvents {
    STATE_UPDATE = "state_update"
}

export enum MessageTypes {
    NEW_FORM = "new_form",
    FORM_RESPONSE = "form_response",
}

const CONTENT_TOPIX = "/whisperbox/1/all/json"

export class WakuClient extends EventEmitter {

    state:ClientState | undefined = undefined

    node:IWaku | undefined = undefined
    dispatcher:Dispatcher | null = null


    constructor(node:IWaku | undefined) {
        super();

        this.node = node
    }

    public async init() {
        if (this.state == ClientState.INITIALIZED) {
            console.error("Already initialized")
            return
        }
        this.state = ClientState.INITIALIZING
        this.emit(ClientEvents.STATE_UPDATE, this.state)

        try {
            await this.node!.waitForPeers([Protocols.Filter, Protocols.LightPush, Protocols.Store]);
            if(!this.dispatcher) {
                const disp = await getDispatcher(this.node as any, CONTENT_TOPIX, "whisperbox", false, false)
                if (!disp) {
                    throw new Error("Failed to initialize Waku Dispatcher")
                }
                this.dispatcher = disp 
        
                this.emit(ClientEvents.STATE_UPDATE, this.state)
        
                this.state = ClientState.INITIALIZED
                this.emit(ClientEvents.STATE_UPDATE, this.state)

                
            }
            if (!this.dispatcher) {
                this.state = ClientState.FAILED
                this.emit(ClientEvents.STATE_UPDATE, this.state)

                return
            }

            this.dispatcher.on(MessageTypes.NEW_FORM, this.handleNewForm.bind(this))
            this.dispatcher.on(MessageTypes.FORM_RESPONSE, this.handleResponse.bind(this))

            await this.dispatcher.start()
            try {
                await this.node!.waitForPeers([Protocols.Store]);
    
                console.log("Dispatching local query")
                await this.dispatcher.dispatchLocalQuery() 
    
    
                if (getAllForms.length == 0) {
                    console.log("Dispatching general query")
                    await this.dispatcher.dispatchQuery()
        
                }
    
//                this.emit(ClientEvents.STATE_UPDATE, ClientState.INIT_PROTOCOL)
            } catch (e) {
                console.error("Failed to initialized protocol:", e)
                this.emit(ClientEvents.STATE_UPDATE, ClientState.FAILED)
                throw e
            }

        } catch(e) {
            this.state = ClientState.FAILED
            this.emit(ClientEvents.STATE_UPDATE, this.state)

            throw e
        }
    }

    private handleNewForm(payload: FormType, signer: Signer, _3:DispatchMetadata): void {
        console.log("Got a new form: ", payload.title, getFormById(payload.id))
        if(!getFormById(payload.id)) {
            addForm(payload)
        }
    }

    private handleResponse(payload: FormSubmissionParams, signer: Signer, _3:DispatchMetadata): void {
        console.log("Got a response for form: ", payload.formId, getFormById(payload.formId))
        if(getFormById(payload.formId)) {
            console.log("Adding response", payload)
            submitResponse(payload)
        }
    }

    public async publishForm(form: FormType): Promise<boolean> {
        if (this.dispatcher == null) {
            throw new Error("Dispatcher is not initialized")
        }
        const result = await this.dispatcher.emit(MessageTypes.NEW_FORM, form)
        return result != false
    }

    public async publishResponse(response: FormSubmissionParams): Promise<boolean> {
        if (this.dispatcher == null) {
            throw new Error("Dispatcher is not initialized")
        }

        console.log(response)
        const result = await this.dispatcher.emit(MessageTypes.FORM_RESPONSE, response)
        return result != false
    }
}