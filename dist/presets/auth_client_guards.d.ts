import type { AxiosError, AxiosResponse } from "axios";
import { AuthClientResponseGuard, AuthClientStageMarker } from "../base/impl/base_auth_client_response_guard";
export declare class ACAuthResponseGuard extends AuthClientResponseGuard {
    /** 當request 進行取代持會 raise 這個 exception */
    static configActionName: string;
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
      * 1) 當 authorizing 發出時，2) request queue 有東西
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
/** markIdle */
export declare class ACFetchedMarker extends AuthClientStageMarker {
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
/** markIdle */
export declare class ACIdleMarker extends AuthClientStageMarker {
    canProcessFulFill(config: AxiosResponse<any, any>): boolean;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
