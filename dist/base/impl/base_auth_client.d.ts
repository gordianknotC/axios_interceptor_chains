import { IBaseClient as IBaseClient, ClientAuthOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Queue, Completer } from "@gdknot/frontend_common";
export declare class BaseAuthClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE> {
    option: ClientAuthOption;
    hostClient: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>;
    markAuthorizing: () => void;
    markIdle: () => void;
    markFetched: () => void;
    markUpdated: () => void;
    requestChain: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>, any>[];
    responseChain: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, any>[];
    queue: Queue<QUEUE>;
    axios: AxiosInstance;
    requester?: (() => Promise<DATA | ERROR | SUCCESS>) | undefined;
    authCompleter?: Completer<any>;
    /** numbers of all authorization calls */
    private _totalAuthCounter;
    /** numbers of all authorization calls in last second*/
    private authCounter;
    private authCounterTimeout?;
    private authCompleterTimeout?;
    private _lastT;
    get callInterval(): number;
    get canAuth(): boolean;
    constructor(option: ClientAuthOption, hostClient: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>, markAuthorizing: () => void, markIdle: () => void, markFetched: () => void, markUpdated: () => void);
    protected resetCompleter(interval: number): void;
    protected resetAuthCounter(idleTime?: number): void;
}
