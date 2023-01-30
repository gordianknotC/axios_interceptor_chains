/// <reference types="jest" />
declare module "src/setup/logger.setup" {
    import { Logger } from "@gdknot/frontend_common";
    import { AllowedModule } from "@gdknot/frontend_common/dist/utils/logger.types";
    export enum EModules {
        Client = "Client",
        AuthGuard = "AuthGuard",
        AuthClient = "AuthClient",
        RequestReplacer = "RequestReplacer",
        HeaderUpdater = "HeaderUpdater",
        Plugin = "Plugin",
        Test = "Test"
    }
    export function logger(module: AllowedModule<EModules>): Logger<EModules>;
    export const LogModules: Partial<import("@gdknot/frontend_common").RawAllowedLogger<EModules>>;
}
declare module "src/utils/common_utils" {
    export function wait(span: number): Promise<boolean>;
    export function ensureNoRaise<T>(action: () => T, defaults: (error?: any) => T): T;
    export function ensureCanProcessFulFill(action: () => boolean): boolean;
    export function ensureCanReject(action: () => boolean): boolean;
}
declare module "src/base/impl/request_plugins_impl" {
    import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
    import { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    export type AxiosConfigHeader = {
        common: {
            Authorization: string;
        };
    };
    /**
     * {@inheritdoc BaseClientServicesPluginChains}
     * 所有 request chain 均繼承 {@link BaseClientServiceRequestPlugin} */
    export abstract class BaseClientServiceRequestPlugin<CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any> = IBaseClient<any, any, any>> extends BaseClientServicesPluginChains<AxiosRequestConfig, AxiosRequestConfig, CLIENT> {
        constructor();
        /** resolve request 並且繼續下一個 request fulfill chain */
        resolve<T = AxiosRequestConfig<any>>(configOrResponse: T): T;
        /** resolve request 並結束整個 request chain */
        resolveAndIgnoreAll<T = AxiosResponse<any, any> | AxiosRequestConfig<any>>(configOrResponse: T): Promise<T>;
        /** reject request 並且繼續下一個 request reject chain */
        reject<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T>;
        /** reject request 不執行於此後的 chain */
        rejectAndIgnoreAll<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T>;
        assertCanAssemble(): string | undefined;
        canGoNext(config: AxiosRequestConfig): boolean;
        /**
         * 決定是否能夠進行至 {@link processFulFill}
         * default: true */
        canProcessFulFill(config: AxiosRequestConfig): boolean;
        /**
         * 決定是否能夠進行至 {@link processReject}
         * default: true */
        canProcessReject(error: AxiosError<unknown, any>): boolean;
        /**
         * axios request interceptor onFulFill 時執行，
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processFulFill(config: AxiosRequestConfig): AxiosRequestConfig;
        /**
         * axios request interceptor onReject 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processReject(error: AxiosError): Promise<any>;
    }
}
declare module "src/base/itf/plugin_chains_itf" {
    import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
    import type { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "src/base/itf/client_itf";
    export interface ResponseInterceptorUse<V> {
        onFulfilled?: ((value: V) => V | Promise<V>) | null;
        onRejected?: ((error: any) => any) | null;
    }
    export enum ChainActionStage {
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
    enum EMethod {
        processFulFill = "processFulFill",
        canProcessFulFill = "canProcessFulFill",
        processReject = "processReject",
        canProcessReject = "canProcessReject"
    }
    type ChainInput = AxiosError | AxiosResponse | AxiosRequestConfig;
    export function processResponseFulFill(response: AxiosResponse, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosResponse>;
    export function processResponseReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosError | AxiosResponse>;
    export function processRequestFulFill(config: AxiosRequestConfig, chain?: BaseClientServicesPluginChains<any, any, any>): AxiosRequestConfig;
    export function processRequestReject(error: AxiosError, chain?: BaseClientServicesPluginChains<any, any, any>): Promise<AxiosError | AxiosResponse>;
    /**
     * {@inheritdoc BaseClientServicesPluginChains}
     * @typeParam INPUT -  process function 的輸入型別
     * @typeParam OUTPUT - process function 的輸出型別
     * @typeParam CLIENT - client 型別
     */
    export abstract class BaseClientServicesPluginChains<INPUT, OUTPUT = INPUT, CLIENT extends (IBaseClientResponsibilityChain & IBaseClientProperties<any>) = IBaseClient<any, any, any>> {
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
}
declare module "src/base/itf/client_itf" {
    import { AsyncQueue, Completer } from "@gdknot/frontend_common";
    import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    /** 代表 client 當前的狀態表示, idle/fetching/authorizing*/
    export enum EClientStage {
        idle = "idle",
        fetching = "fetching",
        authorizing = "authorizing",
        authFetched = "authFetched",
        authUpdated = "authUpdated"
    }
    export type RedirectAction = {
        /** redirect 如返回 true － clear Queue */
        clearQueue?: boolean;
    };
    /** 用於 {@link QueueItem} 的 meta 型別 */
    export type QueueRequest = {
        requestConfig: AxiosRequestConfig;
    };
    /** client 初始化時所注入與 authorization 相關的設定 */
    export type ClientAuthOption = {
        /** 創建一般性的 axios instance 所需的 Config，用於非 auth token 換發的請求*/
        axiosConfig: AxiosRequestConfig;
        /** axios.interceptors.request 以責任鍊方式實作 */
        requestChain: BaseClientServicesPluginChains<AxiosRequestConfig, AxiosRequestConfig, IBaseAuthClient<any, any, any>>[];
        /** axios.interceptors.response 以責任鍊方式實作 */
        responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>[];
        /** 如果換發 auth token 需要指定 payload，於內部會取用這個方法 */
        payloadGetter: () => any;
        /** 發出請求時，需要取當當前最新的 auth token，於內部會以此方法取得最新的 auth token 以更新 request header */
        tokenGetter: () => any;
        /** 當換發 token 後，內部需要調用寫入 token 的方法 */
        tokenUpdater: (response: AxiosResponse) => void;
        /** 當 authorization 失敗後，會呼叫這個方法，以重新導向 */
        redirect?: (response: AxiosResponse) => RedirectAction | undefined | null;
        /** 每二次 authorization 請求間的最小 interval */
        interval?: number;
    };
    /**
     * {@link IBaseClient} 實例化的輸入參數 */
    export type ClientOption<DATA, ERROR, SUCCESS> = {
        /** 創建一般性的 axios instance 所需的 Config，用於非 auth token 換發的請求*/
        axiosConfig: AxiosRequestConfig;
        /** axios.interceptors.request 以責任鍊方式實作 */
        requestChain: BaseClientServicesPluginChains<AxiosRequestConfig, AxiosRequestConfig, IBaseClient<any, any, any>>[];
        /** axios.interceptors.response 以責任鍊方式實作 */
        responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseClient<any, any, any>>[];
        /** 創建特別針對請求 auth token 換發所需的 axios instance，僅用於 auth token 換發*/
        authOption: ClientAuthOption;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        isErrorResponse: (error: ERROR | SUCCESS | DATA) => boolean;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        isSuccessResponse: (success: ERROR | SUCCESS | DATA) => boolean;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        isDataResponse: (data: ERROR | SUCCESS | DATA) => boolean;
    };
    export abstract class IBaseClientMethods<DATA, ERROR, SUCCESS> {
        /** onIdle callback, e.g.: client.onIdle(()=>console.log("..."))*/
        abstract onIdle(cb: () => void): void;
        /** onFetching callback, e.g.: client.onFetching(()=>console.log("...")) */
        abstract onFetching(cb: () => void): void;
        /** onAuthorizing callback, e.g.: client.onAuthorizing(()=>console.log("...")) */
        abstract onAuthorizing(cb: () => void): void;
        abstract auth(): Promise<DATA | ERROR | SUCCESS>;
        abstract requestByConfig(option: AxiosRequestConfig): Promise<AxiosResponse>;
        abstract get(url: string, payload: Record<string, any>): Promise<DATA | ERROR>;
        abstract post(url: string, payload: Record<string, any>): Promise<SUCCESS | DATA | ERROR>;
        abstract put(url: string, payload: Record<string, any>): Promise<SUCCESS | DATA | ERROR>;
        abstract del(url: string, payload: Record<string, any>): Promise<SUCCESS | ERROR>;
    }
    export abstract class IBaseClientResponsibilityChain {
        /** axios.interceptors.request 以責任鍊方式實作 */
        abstract requestChain: BaseClientServicesPluginChains<AxiosRequestConfig, AxiosRequestConfig, any>[];
        /** axios.interceptors.response 以責任鍊方式實作 */
        abstract responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, any>[];
    }
    export abstract class IBaseClientProperties<OPTION, QUEUE extends QueueRequest = QueueRequest> {
        /** 用來放置需要先存入 pending 中的請求，如當 {@link stage} 處於
         * {@link EClientStage.authorizing} 時，所有的請求會先存入 queue,
         * 直到換發 auth token 成功後再從 queue 裡面，取得相應的 completer 並次發出請求，以返回相應的結果至特定的 completer client request 不會因為一些錯誤（如 unauthorized error) 而中斷請求 */
        abstract queue: AsyncQueue<QUEUE>;
        abstract axios: AxiosInstance;
        abstract option: OPTION;
    }
    export abstract class IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClientResponsibilityChain, IBaseClientProperties<ClientAuthOption, QUEUE> {
        abstract requestChain: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>, any>[];
        abstract responseChain: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, any>[];
        abstract get callInterval(): number;
        abstract get canAuth(): boolean;
        abstract queue: AsyncQueue<QUEUE>;
        /** authorization 專用 axios instance, 不走 request/response interceptors */
        abstract axios: AxiosInstance;
        abstract option: ClientAuthOption;
        abstract markIdle(): void;
        abstract markFetched(): void;
        abstract markUpdated(): void;
        abstract hostClient?: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>;
        /** 加上 debounce 功能後專門用來請求 auth request 的方法, 防止短時間重複換發 auth token */
        abstract requester?: (() => Promise<DATA | ERROR | SUCCESS>) | undefined;
        abstract authCompleter?: Completer<any>;
    }
    /**  api client service
     * @typeParam DATA - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
     * @typeParam QUEUE - {@link QueueItem} 裡的 Meta 型別
     */
    export abstract class IBaseClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClientMethods<DATA, ERROR, SUCCESS>, IBaseClientResponsibilityChain, IBaseClientProperties<ClientOption<DATA, ERROR, SUCCESS>, QUEUE> {
        abstract option: ClientOption<DATA, ERROR, SUCCESS>;
        /** axios.interceptors.request 以責任鍊方式實作 */
        abstract requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
        /** axios.interceptors.response 以責任鍊方式實作 */
        abstract responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>[];
        /** 用來放置需要先存入 pending 中的請求，如當 {@link stage} 處於
         * {@link EClientStage.authorizing} 時，所有的請求會先存入 queue,
         * 直到換發 auth token 成功後再從 queue 裡面，取得相應的 completer 並次發出請求，以返回相應的結果至特定的 completer client request 不會因為一些錯誤（如 unauthorized error) 而中斷請求 */
        abstract queue: AsyncQueue<QUEUE>;
        abstract axios: AxiosInstance;
        abstract authClient?: IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE>;
        /** @readonly 用來代表 client 當前狀態 - idle / fetching / authorizing */
        abstract readonly stage: EClientStage;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        abstract isDataResponse: (response: DATA | ERROR | SUCCESS) => boolean;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        abstract isErrorResponse: (response: DATA | ERROR | SUCCESS) => boolean;
        /** 用來實作判定所返回的 response 屬於哪種資料型別 */
        abstract isSuccessResponse: (response: DATA | ERROR | SUCCESS) => boolean;
        /** onIdle callback, e.g.: client.onIdle(()=>console.log("..."))*/
        abstract onIdle(cb: () => void): void;
        /** onFetching callback, e.g.: client.onFetching(()=>console.log("...")) */
        abstract onFetching(cb: () => void): void;
        /** onAuthorizing callback, e.g.: client.onAuthorizing(()=>console.log("...")) */
        abstract onAuthorizing(cb: () => void): void;
        /** 同 get/post/put/del 只是 param 型別不同
         * @param option - {@link AxiosRequestConfig} */
        abstract requestByConfig(option: AxiosRequestConfig): Promise<AxiosResponse>;
        abstract get(url: string, payload: Record<string, any>): Promise<DATA | ERROR>;
        abstract auth(): Promise<DATA | ERROR | SUCCESS>;
        abstract post(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
        abstract put(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS>;
        abstract del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS>;
    }
}
declare module "src/base/impl/base_request_guard" {
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { BaseClientServiceRequestPlugin } from "src/base/impl/request_plugins_impl";
    import { IBaseClient } from "src/base/itf/client_itf";
    import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
    export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
    /** Axios 所定義，為單層物件, 複雜物件可能要轉 JSONString */
    export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
    /**
     * @typeParam RESPONSE - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
    */
    export class BaseRequestGuard<RESPONSE, ERROR, SUCCESS> extends BaseClientServiceRequestPlugin {
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
    export class BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
        constructor();
        protected appendRequestHeader(): RawAxiosHeaders;
        processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any>;
    }
}
declare module "src/presets/request_header_updater" {
    import { BaseRequestHeaderGuard } from "src/base/impl/base_request_guard";
    import { AxiosHeaders } from "axios";
    export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
    export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
    /** 自動將 axios request config 寫入正確的 authorization header
     * @example
     * ```ts
      const requestChain = [
          new UpdateAuthHeaderPlugin(()=>{
            return authorizationStore.token
          })
      ];
      ```
     */
    export class ClientRequestAuthHeaderUpdater<RESPONSE, ERROR, SUCCESS> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
        /** 使用者自定義 AuthToken 參照*/
        tokenGetter: () => string;
        constructor(
        /** 使用者自定義 AuthToken 參照*/
        tokenGetter: () => string);
        /**
         * 用來返回慾更新寫入 AxiosRequestConfig 的 header
         * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
         * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
        */
        protected appendRequestHeader(): RawAxiosHeaders;
    }
    export class ClientRequestExtraHeaderUpdater<RESPONSE, ERROR, SUCCESS> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
        private headerGetter;
        constructor(headerGetter: () => RawAxiosHeaders);
        /**
         * 用來返回慾更新寫入 AxiosRequestConfig 的 header
         * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
         * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
        */
        protected appendRequestHeader(): RawAxiosHeaders;
    }
}
declare module "src/base/impl/base_auth_client" {
    import { IBaseClient as IBaseClient, ClientAuthOption, QueueRequest, IBaseAuthClient } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
    import { Queue, Completer } from "@gdknot/frontend_common";
    export class BaseAuthClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE> {
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
}
declare module "src/base/impl/base_client_impl" {
    import { EClientStage, IBaseClient as IBaseClient, ClientAuthOption, ClientOption, QueueRequest, IBaseAuthClient } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
    import { AsyncQueue } from "@gdknot/frontend_common";
    import { RawAxiosHeaders } from "src/presets/request_header_updater";
    export const DEFAULT_AUTH_CLIENT_OPTION: Partial<ClientAuthOption>;
    /** {@inheritdoc IClientService}
    *
    * @typeParam DATA - response 型別
    * @typeParam ERROR - error 型別
    * @typeParam SUCCESS - success 型別
    */
    export class BaseClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClient<DATA, ERROR, SUCCESS, QUEUE> {
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
}
declare module "src/base/impl/response_plugins_impl" {
    import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
    import { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    /** 所有 response chain 均繼承 {@link BaseClientServiceResponsePlugin} */
    export abstract class BaseClientServiceResponsePlugin<CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any> = IBaseClient<any, any, any>> extends BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, CLIENT> {
        constructor();
        prev?: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, CLIENT> | undefined;
        next?: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, CLIENT> | undefined;
        client?: CLIENT | undefined;
        /** resolve response 並且繼續下一個 response fulfill chain */
        protected resolve<T = AxiosResponse<any, any> | AxiosRequestConfig<any>>(configOrResponse: T): Promise<T>;
        /** resolve response 不執行於此後的 chain */
        protected resolveAndIgnoreAll<T = AxiosResponse<any, any> | AxiosRequestConfig<any>>(configOrResponse: T): Promise<T>;
        /** reject response 並且繼續下一個 response reject chain */
        protected reject<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T>;
        /** reject response 不執行於此後的 chain */
        protected rejectAndIgnoreAll<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T>;
        assertCanAssemble(): string | undefined;
        /**
         * 決定是否能夠進行 next chain
         * @returns - default: true */
        canGoNext(config: AxiosResponse): boolean;
        /**
         * 決定是否能夠進行至 {@link processFulFill}
         * @returns - default: true */
        canProcessFulFill(response: AxiosResponse): boolean;
        /**
         * 決定是否能夠進行至 {@link processReject}
         * @returns - default: true */
        canProcessReject(error: AxiosError<unknown, any>): boolean;
        /**
         * axios response interceptor onFulFill 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processFulFill(response: AxiosResponse): Promise<AxiosResponse>;
        /**
         * axios response interceptor onReject 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processReject(error: AxiosError): Promise<AxiosError | AxiosResponse>;
    }
}
declare module "src/base/impl/base_auth_response_guard" {
    import { Completer, QueueItem } from "@gdknot/frontend_common";
    import { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
    import { IBaseClient } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { BaseClientServiceResponsePlugin } from "src/base/impl/response_plugins_impl";
    /**
     * {@inheritdoc BaseClientServiceResponsePlugin}
     * 用來處理當 request 發出後出現 401/Unauthorized error，處理流程為
     * - {@link canProcessReject} > {@link processReject}
     *    - {@link onRestoreRequest}
     *    - {@link onRequestNewAuth}
     *        - {@link onAuthError}
     *        - {@link onAuthSuccess}
     *        - {@link onAuthUncaughtError}
    */
    export class BaseAuthResponseGuard extends BaseClientServiceResponsePlugin<IBaseClient<any, any, any>> {
        client?: IBaseClient<any, any, any>;
        prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
        next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
        constructor();
        /** ### 用來生成代替 unauthorized error 的空請求
         * 當 unauthorized error 後，auth token 換發前，會生成一個空的 Promise 請求，
         * 以代替原請求因 unauthorized error 所產生的錯誤，{@link BaseAuthResponseGuard} 會先
         * 返回這個空的 Promise 好讓原 axios 的請求持續等待。
         * @param error - {@link AxiosError}
         * @returns - {@link Completer<any, QueueItem>}
         */
        protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>;
        /** ### 用來定義當 unauthorized error 後，auth token 換發時的主要邏輯, 預設為 this.client.auth()
         * @param error - {@link AxiosError}
         * @param pendingRequest - 由{@link onRestoreRequest} 所生成的 pendingRequest，
         * 其內容為一個永不 resolve 的 Promise 物件，直到 auth token 重新換發後再次重新送出原請求，才
         * 會更新 pendingRequest 的內容，在這之前 pendingRequest 的 Promise 物件會一直保持 pending，
         * 除非 timeout
         */
        protected onRequestNewAuth(error: AxiosError): Promise<AxiosResponse>;
        /**
        * @extendSummary - 用來處理當特定 response error 下，保流原請求後，進行 token 換發，流程為：
        * - {@link onRestoreRequest} 保留請請
        * - {@link onRequestNewAuth} 換發 auth token
        *     - {@link onAuthError} 當 auth token 換發失败
        *     - {@link onAuthSuccess} 當 auth token 換發成功
        *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
        */
        protected reject<T = AxiosResponse<any, any> | AxiosRequestConfig<any> | AxiosError<unknown, any>>(input: T): Promise<T>;
        protected rejectAndIgnoreAll<T = AxiosResponse<any, any> | AxiosRequestConfig<any> | AxiosError<unknown, any>>(input: T): Promise<T>;
        /** @returns - false */
        canProcessFulFill(config: AxiosResponse<any, any>): boolean;
        /**
         * @extendSummary -
         * 當 error.response?.status == axios.HttpStatusCode.Unauthorized
         * 時可進行至 processReject 處理
         */
        canProcessReject(error: AxiosError<unknown, any>): boolean;
        /**
        * @extendSummary - 用來處理 unauthorized error 下，保流原請求後，進行 token 換發，流程為：
        * - {@link onRestoreRequest} 保留請請
        * - {@link onRequestNewAuth} 換發 auth token
        *     - {@link onAuthError} 當 auth token 換發失败
        *     - {@link onAuthSuccess} 當 auth token 換發成功
        *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
        */
        processReject(error: AxiosError): Promise<AxiosResponse | AxiosError>;
    }
}
declare module "src/base/impl/base_request_replacer" {
    import { AxiosError, AxiosRequestConfig } from "axios";
    import { BaseRequestGuard } from "src/base/impl/base_request_guard";
    /**
     * {@inheritdoc BaseRequestGuard}
     *
     * 使用情境如，當第一個 request 出現 Unauthorized 錯誤時，
     * 後續所有的 request 在第一個 request 重新換發 token 並返回正確的 request 前, 都
     * 需要等待，這時就需要直接取代 request, 讓它保持 pending 待第一個 request 換發成功
     * 後再行處理，流程為
     * - request
     *    {@link canProcessFulFill} > {@link processFulFill}
     * - response
     *    {@link canProcessReject} > {@link processReject}
     *
     * @typeParam RESPONSE - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
     */
    export class BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
        /**
         * 當 {@link canProcessFulFill} 為 true 則可以進行 {@link processFulFill}，這裡
         * {@link canProcessFulFill} 只處理當 client 狀態為 {@link EClientStage.authorizing} 時，
         * 代表client正處於換發 authorization token， 這時應處理所有進來的 request, 替代成 pending
         * @returns -
         * ```ts
         * this.client!.stage == EClientStage.authorizing
         * ```
         * */
        canProcessFulFill(config: AxiosRequestConfig<any>): boolean;
        /**
         * @extendSummary -
         * 當{@link canProcessFulFill}成立，強制將 request raise exception, 好進行至
         * reject進行攔截
         * */
        processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any>;
        /** false */
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
}
declare module "src/presets/network_error_response_guard" {
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { BaseClientServiceResponsePlugin } from "src/base/impl/response_plugins_impl";
    import { IBaseClient } from "src/base/itf/client_itf";
    import { AxiosError, AxiosResponse } from "axios";
    /**
     * {@inheritdoc BaseClientServiceResponsePlugin}
     * 用來攔截 Network Error
     * */
    export class NetworkErrorResponseGuard extends BaseClientServiceResponsePlugin {
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
}
declare module "src/base/impl/base_auth_client_response_guard" {
    import { AsyncQueue } from "@gdknot/frontend_common";
    import { AxiosResponse, AxiosError } from "axios";
    import { IBaseClient, QueueRequest, IBaseAuthClient } from "src/base/itf/client_itf";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { BaseClientServiceResponsePlugin } from "src/base/impl/response_plugins_impl";
    export class AuthClientResponseGuard extends BaseClientServiceResponsePlugin<IBaseAuthClient<any, any, any>> {
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
    export class AuthClientStageMarker extends AuthClientResponseGuard {
        canProcessFulFill(config: AxiosResponse<any, any>): boolean;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
        processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>>;
        processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
    }
}
declare module "src/presets/auth_client_guards" {
    import type { AxiosError, AxiosResponse } from "axios";
    import { AuthClientResponseGuard, AuthClientStageMarker } from "src/base/impl/base_auth_client_response_guard";
    /** 處理以下請況
     *
     * 1) 用來處理當非AuthClient 送出的請求於遠端返回 unauthorized error
     * (response error) 發生後 AuthResponseGuard 會將原請求放到駐列中，並透過
     * AuthClient 發出換發 token 請求, AuthClient interceptor 透過讀取當
     * auth token 成功換發且更新後，若駐列中有未完成的請求，則 ACAuthResponseGuard
     * 會負責將這些請求重新送出
     *
     * 2) 當 AuthClient 換發 token 失敗
     **/
    export class ACAuthResponseGuard extends AuthClientResponseGuard {
        /** ### 用來處理當 unauthorized error 後 auth token 換發成功
         * @param errorResponseBeforeReAuth - auth token 換發「前」失敗的 response
         * @param queueItem - 於 {@link onBeforeRequestNewAuth} 所生成的新 Promise 請求，用來代替 ReAuth 前的失敗請求
         */
        protected onAuthSuccess(response: AxiosResponse<any, any>): AxiosResponse;
        /** ### 用來處理當 unauthorized error 後 auth token 可預期下的換發失敗
         * @param authFailedResponse - auth token 換發前失敗的 response
         * @returns - {@link AxiosResponse}
         */
        protected onAuthError(authFailedResponse: AxiosResponse): void;
        protected onAuthUncaughtError(error: AxiosError<unknown, any>): void;
        /**
         * 當 response 處於, 代表我們可以使用最新的 auth token 重新送出並清空 request queue 的的請求
         * 1) auth token updated 2) request queue 有東西
         */
        canProcessFulFill(response: AxiosResponse<any, any>): boolean;
        processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>>;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
        processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
    }
    /** markIdle */
    export class ACTokenUpdater extends AuthClientResponseGuard {
        canProcessFulFill(response: AxiosResponse<any, any>): boolean;
        processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>>;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
    /** 用來標定目前的 auth client stage 處於 auth token fetched 階段
     * @see {@link EClientStage}
    */
    export class ACFetchedMarker extends AuthClientStageMarker {
        canProcessFulFill(config: AxiosResponse<any, any>): boolean;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
    /** 用來標定目前的 auth client stage 處於 idle 階段
     * @see {@link EClientStage}
    */ export class ACIdleMarker extends AuthClientStageMarker {
        canProcessFulFill(config: AxiosResponse<any, any>): boolean;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
}
declare module "src/presets/request_replacer" {
    import { BaseRequestReplacer } from "src/base/impl/base_request_replacer";
    import { AxiosHeaders } from "axios";
    export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
    export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
    /**
     * {@inheritdoc BaseRequestReplacer}
     * 用來取代當前的 request, @see {@link BaseRequestReplacer}
     * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
     * {@link canProcessFulFill} / {@link newRequest}
     * */
    export class RequestReplacer<RESPONSE, ERROR, SUCCESS> extends BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> {
    }
}
declare module "__tests__/__mocks__/axios" {
    import { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance, AxiosStatic, HttpStatusCode } from "axios";
    import { ErrorResponse } from "__tests__/setup/client.test.setup";
    export const authToken: {
        value: string;
    };
    export enum _EErrorCode {
        ACCESS_TOKEN_MISSING = 3101,
        ACCESS_TOKEN_EXPIRED = 3102,
        PAYLOAD_MISSING_KEY = 2102,
        INVALID_PERMISSION = 3002,
        USER_IS_BLOCK = 205,
        USER_NOT_VERIFY = 206
    }
    export enum EServerResponse {
        resolved = 0,
        reject = 1
    }
    export const AuthTokenExpiredError: ErrorResponse;
    export const AuthTokenMissingError: ErrorResponse;
    export const UnauthorizedResponseError: ErrorResponse;
    type RegisteredResponse = Omit<AxiosResponse, "config"> & {
        useValidator: boolean;
    };
    class MockedServer {
        validToken: string;
        registry: Record<string, RegisteredResponse>;
        defaultResponse: Omit<AxiosResponse, "config"> & {
            useValidator: boolean;
        };
        constructor(validToken: string);
        private headerValidator?;
        setHeaderValidator(validator: (config: AxiosRequestConfig) => AxiosResponse | AxiosError | undefined | null): void;
        registerResponse(url: string, responseCB: () => Promise<any>, useValidator?: boolean, status?: HttpStatusCode): void;
        getResponse(config: AxiosRequestConfig): Promise<AxiosResponse | AxiosError>;
        private _onStage?;
        onResponse(cb: (stage: EServerResponse, data: any) => boolean): void;
        clear(): void;
    }
    const mockAxios: jest.Mocked<AxiosStatic>;
    export const mockServer: MockedServer;
    export const mockAdapter: jest.Mock<any, any>;
    export const getMockAxiosInstances: () => jest.Mocked<AxiosInstance>[], clearMockAxios: () => void, mostRecentAxiosInstanceSatisfying: (fn: (a: AxiosInstance) => boolean) => jest.Mocked<AxiosInstance>;
    export default mockAxios;
}
declare module "__tests__/helpers/chain.test.helper" {
    import { ErrorResponse } from "__tests__/setup/client.test.setup";
    export const expectedChainFlow: {
        partial_acRedirectUnAuth(authUrl: string, initialAuthToken: string, errorData: ErrorResponse): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_acUnauthorized(authUrl: string, initialAuthToken: string, authFailedErr: ErrorResponse): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_acAuth(authUrl: string, authToken: string, hasQueuedItem?: boolean): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_redirectedAuthorizedGet(data: object, authToken: string, initialToken: string, getUrl: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_authorizedGet(data: object, authToken: string, getUrl: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_UnAuthorizedGet(unauthorizedErr: ErrorResponse, getUrl: string, initialAuthToken?: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        simpleAuth(authUrl: string, authToken: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        simpleAuthorizedGet(authToken: string, data: any, getUrl: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        simpleUnAuthorizedGet(unauthorizedErr: ErrorResponse, authErr: ErrorResponse, getUrl: string, authUrl: string, initialAuthToken: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        simpleUnauthorizedGetTurningIntoAuthorized(authToken: string, initialAuthToken: string, authUrl: string, data: any, errorData: any, getUrl: string): {
            name: string;
            input: string;
            output: string;
            stage: string;
        }[];
        partial_unAuthorizedGet: () => any;
    };
}
declare module "__tests__/helpers/axo.test.helper" {
    import { BaseClient } from "src/base/impl/base_client_impl";
    import { AuthResponseGuard } from "src/presets/auth_response_guard";
    import { ClientRequestAuthHeaderUpdater, ClientRequestExtraHeaderUpdater } from "src/presets/request_header_updater";
    import { EServerResponse } from "__tests__/__mocks__/axios";
    import { NetworkErrorResponseGuard } from "src/presets/network_error_response_guard";
    import { ACAuthResponseGuard, ACFetchedMarker, ACIdleMarker, ACTokenUpdater } from "src/presets/auth_client_guards";
    import { EClientStage, RequestReplacer } from "src/index";
    type ClientRequestChain = ClientRequestExtraHeaderUpdater<any, any, any> | ClientRequestAuthHeaderUpdater<any, any, any> | RequestReplacer<any, any, any>;
    type ClientResponseChain = AuthResponseGuard | NetworkErrorResponseGuard;
    type ACRequestChain = undefined;
    type ACResponseChain = ACFetchedMarker | ACTokenUpdater | ACAuthResponseGuard | ACIdleMarker;
    type Chains = ClientRequestChain | ClientResponseChain | ACRequestChain | ACResponseChain;
    export enum ChainCondition {
        untouchedAll = 0,
        processUntouched = 1,
        rejectUntouched = 2,
        processOnly = 3,
        bypassProcess = 4,
        rejectOnly = 5,
        bypassReject = 6,
        processAndReject = 7,
        bypassProcessAndReject = 8
    }
    export enum RequestScenario {
        unauthorizeRequest = 0,
        unauthorizeRequestTurningIntoAuthorizedByChain = 1,
        pendingIntoQueue = 2,
        pendingByDebounce = 3
    }
    export enum RequestAuthRejectStage {
        sendingOrigRequest = "sendingOrigRequest",
        origRequestBeingRejected = "origRequestBeingRejected",
        rejectedRequestPendingInQueue = "rejectedRequestPendingInQueue",
        sendingReAuthRequestOnAuthGuard = "sendingReAuthRequestOnAuthGuard",
        reAuthRequestFetched = "reAuthRequestFetched",
        newAuthTokenBeingUpdated = "newAuthTokenBeingUpdated",
        newAuthSuccessfullyFetchedMarkIdle = "newAuthMarkIdle",
        origPendingRequestBeingResponse = "origPendingRequestBeingResponse"
    }
    export enum ResponseScenario {
        unauthorizedResponse = 0,
        unauthorizedResponseTurningIntoAuthorizedByChain = 1
    }
    export const env = "production";
    type TestRecord = {
        name: string;
        input?: string;
        output?: string;
        stage: EClientStage;
    };
    export function wait(span: number): Promise<boolean>;
    export function wrapImplementation<T extends {}, Key extends keyof T>(helper: AxiosTestHelper, inst: T, propName: Key, newImpl: (origImplResult: any, ...args: any[]) => any, stage: EClientStage): void;
    export class AxiosTestHelper {
        client: BaseClient<any, any, any>;
        authToken: string;
        chainTestStacks: TestRecord[];
        constructor(client: BaseClient<any, any, any>, authToken: string);
        get authGuard(): jest.Mocked<AuthResponseGuard>;
        get networkErrorGuard(): jest.Mocked<NetworkErrorResponseGuard>;
        get authHeaderUpdater(): jest.Mocked<ClientRequestAuthHeaderUpdater<any, any, any>>;
        get extraHeaderUpdater(): jest.Mocked<ClientRequestExtraHeaderUpdater<any, any, any>>;
        get requestReplacer(): jest.Mocked<RequestReplacer<any, any, any>>;
        get acAuthGuard(): jest.Mocked<ACAuthResponseGuard>;
        get acFetchedMarker(): jest.Mocked<ACFetchedMarker>;
        get acTokenUpdater(): jest.Mocked<ACTokenUpdater>;
        get acIdleMarker(): jest.Mocked<ACIdleMarker>;
        get(url: string, payload: any, result: () => Promise<any>): Promise<any>;
        auth(result: () => Promise<any>, useValidator?: boolean): Promise<any>;
        put(url: string, data: any, result: () => Promise<any>): Promise<any>;
        post(url: string, data: any, result: () => Promise<any>): Promise<any>;
        del(url: string, data: any, result: () => Promise<any>): Promise<any>;
        expectUnauthorized(url: string, payload: any, mockReturns: any, expectedFetched: any): Promise<{}>;
        expectGetPassed(url: string, payload: any, mockReturns: () => Promise<any>, expectedFetched: any): Promise<any>;
        protected get unAuthorizedResponse(): import("@/__tests__/setup/client.test.setup").ErrorResponse;
        spyOnAllGuards(): void;
        expectRequestReject_OnServerPerspective(): void;
        expectACAuthChainNotStartedYet(): void;
        expectRequestRestored_andAuthRequestBeingSend_onAuthGuard(): void;
        expectReAuthSuccess_OnACAuthGuard(): void;
        expectAuthRequestNotYetCall(): void;
        expectRequestReject_OnChainPerspectiveByCondition(option: {
            chain: Chains;
            condition: ChainCondition;
        }, internalCall?: boolean): void;
        private acCalls;
        expectAcResponseCalled(option: {
            acFetcher: boolean;
            acToken: boolean;
            acAuth: boolean;
            acIdle: boolean;
        }): void;
        expectRequestReject_OnAdapterPerspective(): void;
        onExpectServer(stage: EServerResponse): void;
        expectStage_OnChainPerspective(stage: RequestAuthRejectStage): Promise<void>;
        expectUnAuthRequestTurningIntoAuth(option: {
            url: string;
            expected: string;
        }): Promise<void>;
        clearTestRecords(): void;
        expectMatchSimpleAuthClientChain(preRenderedAuthToken: string, authUrl: string): void;
    }
}
declare module "__tests__/setup/client.test.setup" {
    import { ClientOption } from "src/base/itf/client_itf";
    import { _EErrorCode } from "__tests__/__mocks__/axios";
    export const EErrorCode: typeof _EErrorCode;
    export type DataResponse<T> = {
        data: T;
        pager: any;
    };
    export type ErrorResponse = {
        error_key: string;
        error_code: string;
        error_msg: string;
        message: string;
    };
    export type SuccessResponse = {
        succeed: boolean;
    };
    export type AuthResponse = DataResponse<{
        token: string;
    }>;
    export const formatHeader: {
        value: {
            format: string;
        };
    };
    export const requestClientOption: ClientOption<DataResponse<any>, ErrorResponse, SuccessResponse>;
}
declare module "src/presets/auth_response_guard" {
    import { BaseAuthResponseGuard } from "src/base/impl/base_auth_response_guard";
    import { BaseClientServicesPluginChains } from "src/base/itf/plugin_chains_itf";
    import { BaseClientServiceResponsePlugin } from "src/base/impl/response_plugins_impl";
    import { IBaseClient } from "src/base/itf/client_itf";
    import { Completer, QueueItem } from "@gdknot/frontend_common";
    import type { AxiosError, AxiosResponse } from "axios";
    export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
        client?: IBaseClient<any, any, any>;
        prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
        next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
    /**{@inheritdoc} BaseAuthResponseGuard */
    export class AuthResponseGuard extends BaseAuthResponseGuard {
        protected onRequestNewAuth(error: AxiosError): Promise<AxiosResponse>;
        protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>;
        processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
        /**
         * @returns - 用來攔截以下二種情況
         * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
         */
        canProcessReject(error: AxiosError<unknown, any>): boolean;
    }
}
declare module "src/index" {
    export type { IBaseAuthClient, IBaseClient, IBaseClientMethods, IBaseClientProperties, IBaseClientResponsibilityChain, QueueRequest, } from "src/base/itf/client_itf";
    export type { IBaseClientMethods as IApiClientMethods } from "src/base/itf/client_itf";
    export type { AxiosConfigHeader } from "src/base/impl/request_plugins_impl";
    export { EClientStage, ClientAuthOption } from "src/base/itf/client_itf";
    export type { IBaseClient as IClientService, ClientOption, RedirectAction, } from "src/base/itf/client_itf";
    export { BaseClientServicesPluginChains, ChainActionStage, } from "src/base/itf/plugin_chains_itf";
    export { BaseClientServiceRequestPlugin } from "src/base/impl/request_plugins_impl";
    export { BaseClient as BaseClient } from "src/base/impl/base_client_impl";
    export { BaseClientServiceResponsePlugin } from "src/base/impl/response_plugins_impl";
    export { BaseAuthResponseGuard } from "src/base/impl/base_auth_response_guard";
    export { BaseRequestReplacer } from "src/base/impl/base_request_replacer";
    export { BaseRequestHeaderGuard, RawAxiosHeaders } from "src/base/impl/base_request_guard";
    export { ClientRequestAuthHeaderUpdater as UpdateAuthHeaderPlugin, ClientRequestExtraHeaderUpdater as UpdateExtraHeaderPlugin, } from "src/presets/request_header_updater";
    export { NetworkErrorResponseGuard } from "src/presets/network_error_response_guard";
    export { AuthResponseGuard } from "src/presets/auth_response_guard";
    export { RequestReplacer } from "src/presets/request_replacer";
    export { ACAuthResponseGuard, ACFetchedMarker, ACTokenUpdater, ACIdleMarker, } from "src/presets/auth_client_guards";
}
