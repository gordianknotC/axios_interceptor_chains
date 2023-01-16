import { EClientStage, IClientService, ClientAuthOption } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AsyncQueue } from "@gdknot/frontend_common";
import { RawAxiosHeaders } from "../../presets/request_header_updater";
export type ClientOption<DATA, ERROR, SUCCESS> = {
    config: AxiosRequestConfig;
    requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
    responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>[];
    authOption: ClientAuthOption;
    isErrorResponse: (error: ERROR | SUCCESS | DATA) => boolean;
    isSuccessResponse: (success: ERROR | SUCCESS | DATA) => boolean;
    isDataResponse: (data: ERROR | SUCCESS | DATA) => boolean;
};
export declare class BaseClient<DATA, ERROR, SUCCESS> implements IClientService<DATA, ERROR, SUCCESS> {
    queue: AsyncQueue;
    client: AxiosInstance;
    authOption: Required<ClientAuthOption>;
    requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
    responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>[];
    private _authClient;
    private _authRequester;
    private __stage;
    private get _stage();
    private set _stage(value);
    get stage(): EClientStage;
    isDataResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    isErrorResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    isSuccessResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    constructor(option: ClientOption<DATA, ERROR, SUCCESS>);
    protected setStage(stage: EClientStage): void;
    private _onIdle?;
    onIdle(cb: () => void): void;
    protected _request(method: "get" | "post" | "put" | "delete", url: string, data: any, headers?: RawAxiosHeaders, responseTransformer?: (response: AxiosResponse) => any, config?: AxiosRequestConfig): Promise<DATA | ERROR | SUCCESS>;
    requestByConfig(config: AxiosRequestConfig): Promise<AxiosResponse>;
    get(url: string, payload: Record<string, any>): Promise<DATA | ERROR>;
    post(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
    postForm(url: string, formData: FormData): Promise<DATA | ERROR | SUCCESS>;
    auth(): Promise<DATA | ERROR | SUCCESS>;
    put(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
    del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS>;
}
