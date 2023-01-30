import { BaseClientServicesPluginChains } from "@/base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import { IBaseClient } from "@/base/itf/client_itf";
import { AxiosError, AxiosResponse } from "axios";
/**
 * {@inheritdoc BaseClientServiceResponsePlugin}
 * 用來攔截 Network Error
 * */
export declare class NetworkErrorResponseGuard extends BaseClientServiceResponsePlugin {
    networkErrorHandler: (error: AxiosError) => void;
    client?: IBaseClient<any, any, any>;
    prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    constructor(networkErrorHandler: (error: AxiosError) => void);
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    /**
     * @extendSummary -
     * 這裡只查找 error.message.toLowerCase() == "network error" 者, 若成立則 {@link processReject}
     */
    canProcessReject(error: AxiosError<unknown, any>): boolean;
    /**
     * @extendSummary -
     * 執行 {@link networkErrorHandler} 並繼續 responsibility chain
     */
    processReject(error: AxiosError<unknown, any>): Promise<any>;
}
