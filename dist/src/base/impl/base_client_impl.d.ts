import { EClientStage, IBaseClient as IBaseClient, ClientAuthOption, ClientOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AsyncQueue } from "@gdknot/frontend_common";
import { RawAxiosHeaders } from "@/presets/request_header_updater";
export declare const DEFAULT_AUTH_CLIENT_OPTION: Partial<ClientAuthOption>;
/** {@inheritdoc IClientService}
*
* @typeParam DATA - response 型別
* @typeParam ERROR - error 型別
* @typeParam SUCCESS - success 型別
*/
export declare class BaseClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClient<DATA, ERROR, SUCCESS, QUEUE> {
    option: ClientOption<DATA, ERROR, SUCCESS>;
    queue: AsyncQueue<QUEUE>;
    axios: AxiosInstance;
    requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
    responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>[];
    /** {@link IBaseAuthClient} */
    authClient?: IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE>;
    /** stage {@link EClientStage} */
    private __stage;
    /** stage {@link EClientStage} */
    private get _stage();
    /** stage {@link EClientStage} */
    private set _stage(value);
    get stage(): EClientStage;
    isDataResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    isErrorResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    isSuccessResponse: (response: DATA | ERROR | SUCCESS) => boolean;
    constructor(option: ClientOption<DATA, ERROR, SUCCESS>);
    /** 設置 client 當前 stage */
    protected setStage(stage: EClientStage): void;
    private _onStageChanged?;
    onStageChanged(cb: (stage: EClientStage) => void, wipeAfterCall?: boolean): void;
    private _onIdle?;
    onIdle(cb: (prev: EClientStage) => void, wipeAfterCall?: boolean): void;
    private _onFetching?;
    onFetching(cb: () => void, wipeAfterCall?: boolean): void;
    private _onAuthorizing?;
    onAuthorizing(cb: (prev: EClientStage) => void, wipeAfterCall?: boolean): void;
    private _onAuthFetched?;
    onAuthFetched(cb: (prev: EClientStage) => void, wipeAfterCall?: boolean): void;
    private _onAuthUpdated?;
    onAuthUpdated(cb: (prev: EClientStage) => void, wipeAfterCall?: boolean): void;
    protected _request(method: "get" | "post" | "put" | "delete", url: string, data: any, headers?: RawAxiosHeaders, responseTransformer?: (response: AxiosResponse) => any, config?: AxiosRequestConfig): Promise<DATA | ERROR | SUCCESS>;
    requestByConfig(config: AxiosRequestConfig): Promise<AxiosResponse>;
    get(url: string, payload: Record<string, any>): Promise<DATA | ERROR>;
    post(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
    postForm(url: string, formData: FormData): Promise<DATA | ERROR | SUCCESS>;
    auth(): Promise<DATA | ERROR | SUCCESS>;
    put(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
    del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS>;
}
