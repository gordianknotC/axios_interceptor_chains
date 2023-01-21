import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "./client_itf";
export interface ResponseInterceptorUse<V> {
    onFulfilled?: ((value: V) => V | Promise<V>) | null;
    onRejected?: ((error: any) => any) | null;
}
export declare function processResponseFulFill(response: AxiosResponse, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosResponse>;
export declare function processResponseReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosError | AxiosResponse>;
export declare function processRequestFulFill(config: AxiosRequestConfig, chain?: BaseClientServicesPluginChains<any, any, any>): AxiosRequestConfig;
export declare function processRequestReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosError | AxiosResponse>;
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 * @typeParam CLIENT - client 型別
 */
export declare abstract class BaseClientServicesPluginChains<INPUT, OUTPUT = INPUT, CLIENT extends (IBaseClientResponsibilityChain & IBaseClientProperties<any>) = IBaseClient<any, any, any>> {
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
    static install<CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any>>(chain: BaseClientServicesPluginChains<any, any, any>[], client: CLIENT, interceptors: "response" | "request"): void;
    constructor();
    /** 上一個 chain */
    abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>;
    /** 下一個 chain */
    abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>;
    /** ClientService */
    abstract client?: CLIENT;
    /** assertion for assembling responsibility chain */
    abstract assertCanAssemble(): string | undefined;
    abstract processFulFill(config: INPUT): OUTPUT;
    abstract processReject(error: AxiosError): Promise<AxiosError | AxiosResponse>;
    /** 增加下一個 chain */
    protected addNext(next: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>): void;
    /** 增加上一個 chain */
    protected addPrev(prev: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>): void;
    addAll(_all: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>[]): void;
    /** default: true */
    canGoNext(config: INPUT): boolean;
    /** default: true */
    canProcessFulFill(config: INPUT): boolean;
    /** default: true */
    canProcessReject(error: AxiosError): boolean;
    protected _onProcess?: () => void;
    onProcess(cb: () => void, terminateAfterCall?: boolean): void;
    protected _onProcessReject?: () => void;
    onProcessReject(cb: () => void, terminateAfterCall?: boolean): void;
    protected _onCanProcess?: () => void;
    onCanProcess(cb: () => void, terminateAfterCall?: boolean): void;
    protected _onCanProcessReject?: () => void;
    onCanProcessReject(cb: () => void, terminateAfterCall?: boolean): void;
    init(client: CLIENT): void;
}
