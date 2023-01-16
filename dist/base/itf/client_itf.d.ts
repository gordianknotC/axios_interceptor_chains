import { AsyncQueue } from "@gdknot/frontend_common";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseClientServicesPluginChains } from "./plugin_chains_itf";
/** 代表 client 當前的狀態表示, idle/fetching/authorizing*/
export declare enum EClientStage {
    idle = "idle",
    fetching = "fetching",
    authorizing = "authorizing"
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
export type ClientAuthOption = AxiosRequestConfig & {
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
export declare abstract class IBaseClientMethods<DATA, ERROR, SUCCESS> {
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
export declare abstract class IBaseClientResponsibilityChain {
    /** axios.interceptors.request 以責任鍊方式實作 */
    abstract requestChain: BaseClientServicesPluginChains<AxiosRequestConfig, AxiosRequestConfig, any>[];
    /** axios.interceptors.response 以責任鍊方式實作 */
    abstract responseChain: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, any>[];
}
export declare abstract class IBaseClientProperties<OPTION, QUEUE extends QueueRequest = QueueRequest> {
    /** 用來放置需要先存入 pending 中的請求，如當 {@link stage} 處於
     * {@link EClientStage.authorizing} 時，所有的請求會先存入 queue,
     * 直到換發 auth token 成功後再從 queue 裡面，取得相應的 completer 並次發出請求，以返回相應的結果至特定的 completer client request 不會因為一些錯誤（如 unauthorized error) 而中斷請求 */
    abstract queue: AsyncQueue<QUEUE>;
    abstract axios: AxiosInstance;
    abstract option: OPTION;
}
export declare abstract class IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClientResponsibilityChain, IBaseClientProperties<ClientAuthOption, QUEUE> {
    abstract requestChain: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>, any>[];
    abstract responseChain: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, any>[];
    abstract queue: AsyncQueue<QUEUE>;
    /** authorization 專用 axios instance, 不走 request/response interceptors */
    abstract axios: AxiosInstance;
    abstract option: ClientAuthOption;
    abstract hostClient?: IBaseClient<DATA, ERROR, SUCCESS, QUEUE>;
    /** 加上 debounce 功能後專門用來請求 auth request 的方法, 防止短時間重複換發 auth token */
    abstract requester?: (() => Promise<DATA | ERROR | SUCCESS>) & {
        clear: () => void;
    };
}
/**  api client service
 * @typeParam DATA - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
 * @typeParam QUEUE - {@link QueueItem} 裡的 Meta 型別
 */
export declare abstract class IBaseClient<DATA, ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> implements IBaseClientMethods<DATA, ERROR, SUCCESS>, IBaseClientResponsibilityChain, IBaseClientProperties<ClientOption<DATA, ERROR, SUCCESS>, QUEUE> {
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
