import { BaseClientServicesPluginChains } from "../../base/impl/plugin_chains_impl";
import { BaseClientServiceRequestPlugin } from "../../base/impl/request_plugins_impl";
import { IClientService } from "../../base/itf/remote_client_service_itf";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
export declare class BaseRequestGuard<RESPONSE, ERROR, SUCCESS> extends BaseClientServiceRequestPlugin {
    client?: IClientService<RESPONSE, ERROR, SUCCESS>;
    prev?: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>>;
    next?: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>>;
    _enabled: boolean;
    constructor();
    enable(): void;
    disable(): void;
    canProcessFulFill(config: AxiosRequestConfig<any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
/** 用來 UpdateRequest Configuration */
export declare class BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
    constructor();
    protected appendRequestHeader(): RawAxiosHeaders;
    processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any>;
}
