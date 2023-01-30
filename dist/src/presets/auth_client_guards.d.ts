import type { AxiosError, AxiosResponse } from "axios";
import { AuthClientResponseGuard, AuthClientStageMarker } from "../../base/impl/base_auth_client_response_guard";
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
export declare class ACAuthResponseGuard extends AuthClientResponseGuard {
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
export declare class ACTokenUpdater extends AuthClientResponseGuard {
    canProcessFulFill(response: AxiosResponse<any, any>): boolean;
    processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>>;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
/** 用來標定目前的 auth client stage 處於 auth token fetched 階段
 * @see {@link EClientStage}
*/
export declare class ACFetchedMarker extends AuthClientStageMarker {
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
/** 用來標定目前的 auth client stage 處於 idle 階段
 * @see {@link EClientStage}
*/ export declare class ACIdleMarker extends AuthClientStageMarker {
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
