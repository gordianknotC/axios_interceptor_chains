import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type { IClientService } from "../itf/remote_client_service_itf";
export interface ResponseInterceptorUse<V> {
    onFulfilled?: ((value: V) => V | Promise<V>) | null;
    onRejected?: ((error: any) => any) | null;
}
export declare function processResponseFulFill(response: AxiosResponse, chain?: BaseClientServicesPluginChains<any>): Promise<AxiosResponse>;
export declare function processResponseReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any>): Promise<AxiosError | AxiosResponse>;
export declare function processRequestFulFill(config: AxiosRequestConfig, chain?: BaseClientServicesPluginChains<any>): AxiosRequestConfig;
export declare function processRequestReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any>): Promise<AxiosError | AxiosResponse>;
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 */
export declare abstract class BaseClientServicesPluginChains<INPUT, OUTPUT = INPUT> {
    /** instal request/response responsibility chain
     * @see {@link BaseClient}
     * @example - 於 BaseClient 內部
     * ```ts
       if (is.not.empty(requestChain)){
          BaseClientServicesPluginChains.install(requestChain, this, "request");
       }
       if (is.not.empty(responseChain)){
          BaseClientServicesPluginChains.install(responseChain, this, "response");
       }
     * ```
     */
    static install(chain: BaseClientServicesPluginChains<any>[], client: IClientService<any, any, any>, interceptors: "response" | "request"): void;
    constructor();
    /** 上一個 chain */
    abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
    /** 下一個 chain */
    abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
    /** ClientService */
    abstract client?: IClientService<any, any, any>;
    abstract processFulFill(config: INPUT): OUTPUT;
    abstract processReject(error: AxiosError): Promise<AxiosError | AxiosResponse>;
    /** 增加下一個 chain */
    protected addNext(next: BaseClientServicesPluginChains<INPUT, OUTPUT>): void;
    /** 增加上一個 chain */
    protected addPrev(prev: BaseClientServicesPluginChains<INPUT, OUTPUT>): void;
    addAll(_all: BaseClientServicesPluginChains<INPUT, OUTPUT>[]): void;
    /** default: true */
    canGoNext(config: INPUT): boolean;
    /** default: true */
    canProcessFulFill(config: INPUT): boolean;
    /** default: true */
    canProcessReject(error: AxiosError): boolean;
    init(client: IClientService<any, any, any>): void;
}
