import { IBaseClient as IBaseClient, ClientAuthOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Queue } from "@gdknot/frontend_common";
export declare class BaseAuthClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE> {
    option: ClientAuthOption;
    hostClient: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>;
    private idleSetter;
    requestChain: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>, any>[];
    responseChain: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, any>[];
    queue: Queue<QUEUE>;
    axios: AxiosInstance;
    requester?: ((() => Promise<DATA | ERROR | SUCCESS>) & {
        clear: () => void;
    }) | undefined;
    constructor(option: ClientAuthOption, hostClient: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>, idleSetter: () => void);
}
