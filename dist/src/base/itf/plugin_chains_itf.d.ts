import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "./client_itf";
export interface ResponseInterceptorUse<V> {
    onFulfilled?: ((value: V) => V | Promise<V>) | null;
    onRejected?: ((error: any) => any) | null;
}
export declare enum ChainActionStage {
    processRequest = 0,
    processResponse = 1,
    rejectRequest = 2,
    rejectResponse = 3,
    canProcessRequest = 4,
    canProcessResponse = 5,
    canRejectRequest = 6,
    canRejectResponse = 7
}
export type ChainAction = {
    headerKey: string;
    headerVal: string;
    stage: ChainActionStage;
    action: (error: AxiosError) => Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
};
declare enum EMethod {
    processFulFill = "processFulFill",
    canProcessFulFill = "canProcessFulFill",
    processReject = "processReject",
    canProcessReject = "canProcessReject"
}
type ChainInput = AxiosError | AxiosResponse | AxiosRequestConfig;
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
    ```ts
       if (is.not.empty(requestChain)){
          BaseClientServicesPluginChains.install(requestChain, this, "request");
       }
       if (is.not.empty(responseChain)){
          BaseClientServicesPluginChains.install(responseChain, this, "response");
       }
    ```
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
    protected abstract resolve<T = AxiosRequestConfig | AxiosResponse>(configOrResponse: T): Promise<T> | T;
    protected abstract resolveAndIgnoreAll<T = AxiosRequestConfig | AxiosResponse>(configOrResponse: T): Promise<T> | T;
    protected abstract reject<T = AxiosRequestConfig | AxiosResponse | AxiosError>(input: T): Promise<T>;
    protected abstract rejectAndIgnoreAll<T = AxiosRequestConfig | AxiosResponse | AxiosError>(input: T): Promise<T>;
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
    protected stage?: ChainActionStage;
    protected setStage(input: ChainInput, method: EMethod): void;
    /** {@link AxiosResponse}|{@link AxiosError} 轉換為 {@link axiosConfig} */
    protected toAxiosConfig(input: ChainInput): AxiosRequestConfig;
    /**
     * 以當前的物件名稱及 {@link ChanActionStage} 註記於 {@link AxiosRequestConfig}.header
     * 中, 用於當 RequestChain / ResponseChain 轉發流程時，得以透過 header 得知該流程由哪裡轉發而來
     * @example
     * reject 當前 request, 並標記於 header 中, 好讓其他 chain 能夠知道這個 AxiosError
     * 是由哪一個 chain reject 而來
     * ```ts
      // RequestChain
      protected switchIntoRejectResponse(config: AxiosRequestConfig, ident:string){
        this.markDirty(config);
        const stage = this.stage!;
        const axiosError: AxiosError = {
          isAxiosError: false,
          toJSON: function (): object {
            return axiosError;
          },
          name: ident,
          message: ident,
          config
        };
        return Promise.reject(axiosError) as any;
      }
      // ResponseChain
      processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
        if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)){
          console.log("processReject - requests from ACAuthGuard")
          return Promise.reject(error);
        }
        return this.reject(error);
      }
     *
     * ```
     * mark request header as dirty */
    protected markDirty(input: ChainInput): AxiosRequestConfig;
    /** read request header to see if it's dirtied or not */
    protected isDirtiedBy(input: ChainInput, identity: string, stage?: ChainActionStage): boolean;
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
export {};
