import { AsyncQueue } from "@gdknot/frontend_common";
import { AxiosResponse, AxiosError } from "axios";
import { IBaseClient, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";
export declare class AuthClientResponseGuard extends BaseClientServiceResponsePlugin<IBaseAuthClient<any, any, any>> {
    client?: IBaseAuthClient<any, any, any>;
    prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;
    next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;
    get isAuthorizing(): boolean;
    get isFetched(): boolean;
    get isUpdated(): boolean;
    get hasQueue(): boolean;
    get host(): IBaseClient<any, any, any>;
    get queue(): AsyncQueue<QueueRequest>;
    constructor();
}
export declare class AuthClientStageMarker extends AuthClientResponseGuard {
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
    processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>>;
    processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
}
