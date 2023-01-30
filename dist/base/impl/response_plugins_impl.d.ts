import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
/** 所有 response chain 均繼承 {@link BaseClientServiceResponsePlugin} */
export declare abstract class BaseClientServiceResponsePlugin<CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any> = IBaseClient<any, any, any>> extends BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, CLIENT> {
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
