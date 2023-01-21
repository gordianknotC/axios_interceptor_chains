import { Completer, QueueItem } from "@gdknot/frontend_common";
import { AxiosResponse, AxiosError } from "axios";
import { IBaseClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";
/**{@inheritdoc BaseClientServiceResponsePlugin}
 * 用來處理當 request 發出後出現 401/Unauthorized error，處理流程為
 * - {@link canProcessReject} > {@link processReject}
 *    - {@link onRestoreRequest}
 *    - {@link onRequestNewAuth}
 *        - {@link onAuthError}
 *        - {@link onAuthSuccess}
 *        - {@link onAuthUncaughtError}
*/
export declare class BaseAuthResponseGuard extends BaseClientServiceResponsePlugin<IBaseClient<any, any, any>> {
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
    * - {@link onRestoreRequest}
    * - {@link onRequestNewAuth}
    *     - {@link onAuthError}
    *     - {@link onAuthSuccess}
    *     - {@link onAuthUncaughtError}
    */
    processReject(error: AxiosError): Promise<AxiosResponse | AxiosError>;
}
