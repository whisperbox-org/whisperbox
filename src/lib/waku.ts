import EventEmitter from "events"
import getDispatcher, { destroyDispatcher, Dispatcher, DispatchMetadata, Key, KeyType, Signer} from "waku-dispatcher"
import { bytesToUtf8, createEncoder, IWaku, LightNode, Protocols, utf8ToBytes,  } from "@waku/sdk";
import { addConfirmation, addForm, createForm, getAllForms, getFormById, getFormsByCreator, submitResponse, toByteArray, toHexString } from "./formStore";
import { FormSubmissionParams, FormType, ResponseConfirmation } from "@/types";
import { utils } from "@noble/secp256k1"
import { ResponseType } from "@/types/waku";
import { decryptAsymmetric, encryptAsymmetric } from "@waku/message-encryption/ecies";



export enum ClientState {
    INITIALIZED = "initialized",
    INITIALIZING = "initializing",
    FAILED = "failed,"
}

export enum ClientEvents {
    STATE_UPDATE = "state_update",
    NEW_RESPONSE = "new_response"
}

export enum MessageTypes {
    NEW_FORM = "new_form",
    FORM_RESPONSE = "form_response",
    CONFIRMATION_RESPONSE = "confirmation_response"
}

const CONTENT_TOPIX = "/whisperbox/1/all/json"

export class WakuClient extends EventEmitter {

    state:ClientState | undefined = undefined

    node:IWaku | undefined = undefined
    dispatcher:Dispatcher | null = null
    address:string | undefined = undefined


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
            this.dispatcher.on(MessageTypes.CONFIRMATION_RESPONSE, this.handleConfirmation.bind(this))


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

    public setAddress(address: string):void {
        this.address = address
    }

    private handleNewForm(payload: FormType, signer: Signer, _3:DispatchMetadata): void {
        const form = getFormById(payload.id)

        if(!form) {
            addForm(payload)
        }
    }

    private async handleResponse(payload: FormSubmissionParams | ResponseType, signer: Signer, _3:DispatchMetadata): Promise<void> {
        let response: FormSubmissionParams  | null = null
        if ((payload as ResponseType).payload) {
            const forms = getFormsByCreator(this.address!)
            for (const form of forms) {
                if (!form.privateKey) continue
                try {
                    const data = await decryptAsymmetric(new Uint8Array(toByteArray((payload as ResponseType).payload)), new Uint8Array(toByteArray(form.privateKey)))
                    response = JSON.parse(bytesToUtf8(data)) as FormSubmissionParams
                } catch (e) {
                    console.log(e)
                }
            }

        } else {
            response = payload as FormSubmissionParams
        }

        if (!response) {
            console.error("Failed to match response with a form")
            return
        }
        const form = getFormById(response.formId)

        if(form && form.creator == this.address) {

            submitResponse(response)
            await this.publishConfirmation(response)

            this.emit(ClientEvents.NEW_RESPONSE, { form, response: payload });
        }
    }

    private handleConfirmation(payload: ResponseConfirmation, signer: Signer, _3:DispatchMetadata): void {
        const form = getFormById(payload.formId)

        if(form) {
            addConfirmation(payload.formId, payload.confirmationId)
        }
    }

    public async publishForm(form: FormType): Promise<boolean> {
        if (this.dispatcher == null) {
            throw new Error("Dispatcher is not initialized")
        }

        const formToPublish = JSON.parse(JSON.stringify(form));
        formToPublish.privateKey = ""

        const result = await this.dispatcher.emit(MessageTypes.NEW_FORM, formToPublish)
        return result != false
    }

    public async publishResponse(response: FormSubmissionParams): Promise<boolean> {
        if (this.dispatcher == null) {
            throw new Error("Dispatcher is not initialized")
        }

        const form = getFormById(response.formId)
        if (!form) {
            throw new Error("Form not found")
        }

        const encrypted = await encryptAsymmetric(utf8ToBytes(JSON.stringify(response)), new Uint8Array(toByteArray(form.publicKey)))

        const result = await this.dispatcher.emit(MessageTypes.FORM_RESPONSE, {payload: toHexString(encrypted)} as ResponseType)
        return result != false
    }

    public async publishConfirmation(response: FormSubmissionParams): Promise<boolean> {
        if (this.dispatcher == null) {
            throw new Error("Dispatcher is not initialized")
        }

        const form = getFormById(response.formId)
        if (!form) {
            throw new Error("Form not found")
        }

        if (!response.confirmationId) {
            return true
        }

        const result = await this.dispatcher.emit(MessageTypes.CONFIRMATION_RESPONSE, {formId: response.formId, confirmationId: response.confirmationId} as ResponseConfirmation)
        return result != false
    }
}