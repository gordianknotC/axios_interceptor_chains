import { BaseClientServicesPluginChains } from "../../base/itf/plugin_chains_itf";
import { BaseClientServiceRequestPlugin } from "../../base/impl/request_plugins_impl";
import { IBaseClient } from "../../base/itf/client_itf";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
/** Axios 所定義，為單層物件, 複雜物件可能要轉 JSONString */
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
/**
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export declare class BaseRequestGuard<RESPONSE, ERROR, SUCCESS> extends BaseClientServiceRequestPlugin {
    client?: IBaseClient<RESPONSE, ERROR, SUCCESS>;
    prev?: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>>;
    next?: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>>;
    _enabled: boolean;
    constructor();
    enable(): void;
    disable(): void;
    canProcessFulFill(config: AxiosRequestConfig<any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
    /** reject request chain 中斷 request chain 進入 response chain 並標記 request header,
     * 這時流程會走到 onReject response chain
     * @example -
     * 替換 request
     ```ts
      // request chain - 流程會轉到 axios.interceptors.response.onReject
      processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
        return this.switchIntoRejectResponse(config, BaseRequestReplacer.name);
      }
      // response chain
      processReject
  
     ```
     * */
    protected switchIntoRejectResponse(config: AxiosRequestConfig): any;
}
/** 用來更新 AxiosRequestConfig
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export declare class BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
    constructor();
    protected appendRequestHeader(): RawAxiosHeaders;
    processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any>;
}
