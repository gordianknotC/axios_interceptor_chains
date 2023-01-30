import { Logger } from "@gdknot/frontend_common";
import axios from "axios";
import { AuthClientResponseGuard, AuthClientStageMarker } from "../../base/impl/base_auth_client_response_guard";
import { LogModules } from "../../setup/logger.setup";
const D = new Logger(LogModules.AuthClient);
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
    onAuthSuccess(response) {
        D.info(["onAuthSuccess, pending queues:", this.queue.queue.length]);
        for (let index = 0; index < this.queue.queue.length; index++) {
            const completer = this.queue.queue[index];
            const id = completer._meta.id;
            const config = this.markDirty(completer._meta.meta.requestConfig);
            this.host.requestByConfig(config).then((_) => {
                this.queue.dequeueByResult({ id, result: _ });
                D.info(["dequeueByResult, id:", id, "result:", _]);
            }).catch(async (e) => {
                if (completer.isRejected) {
                    this.queue.dequeueByResult({ id: completer._meta.id, result: {} });
                    return completer.future;
                }
                completer.reject(e);
                this.queue.dequeueByResult({ id: completer._meta.id, result: {} });
                return e;
            });
        }
        return response;
    }
    /** ### 用來處理當 unauthorized error 後 auth token 可預期下的換發失敗
     * @param authFailedResponse - auth token 換發前失敗的 response
     * @returns - {@link AxiosResponse}
     */
    onAuthError(authFailedResponse) {
        D.info(["onAuthError"]);
        if (this.host.option.authOption) {
            const action = this.host.option.authOption.redirect?.(authFailedResponse) ?? {
                clearQueue: true,
            };
            if (action.clearQueue)
                this.client?.queue.clearQueue();
        }
    }
    onAuthUncaughtError(error) {
    }
    /**
     * 當 response 處於, 代表我們可以使用最新的 auth token 重新送出並清空 request queue 的的請求
     * 1) auth token updated 2) request queue 有東西
     */
    canProcessFulFill(response) {
        return (this.isUpdated) && this.hasQueue;
    }
    processFulFill(response) {
        return this.resolve(this.onAuthSuccess(response));
    }
    canProcessReject(error) {
        return true;
    }
    processReject(error) {
        if (this.host.isErrorResponse(error.response)) {
            this.onAuthError(error.response);
        }
        else {
            this.onAuthUncaughtError(error);
        }
        return this.reject(error);
    }
}
/** markIdle */
export class ACTokenUpdater extends AuthClientResponseGuard {
    canProcessFulFill(response) {
        D.info(["ACTokenUpdater.canProcessFulFill, response:", response]);
        return this.host.isDataResponse(response)
            && (response.status == axios.HttpStatusCode.Ok);
    }
    processFulFill(response) {
        this.client?.option.tokenUpdater(response);
        D.current(["ACTokenUpdater:", response.data, this.client?.option.tokenGetter()]);
        if (this.client?.option.tokenGetter() == undefined) {
            throw new Error("Unexpected tokenGetter/tokenUpdater");
        }
        this.client?.markUpdated();
        return this.resolve(response);
    }
    canProcessReject(error) {
        return false;
    }
}
/** 用來標定目前的 auth client stage 處於 auth token fetched 階段
 * @see {@link EClientStage}
*/
export class ACFetchedMarker extends AuthClientStageMarker {
    canProcessFulFill(config) {
        this.client.markFetched();
        return super.canProcessFulFill(config);
    }
    canProcessReject(error) {
        this.client.markFetched();
        return super.canProcessReject(error);
    }
}
/** 用來標定目前的 auth client stage 處於 idle 階段
 * @see {@link EClientStage}
*/ export class ACIdleMarker extends AuthClientStageMarker {
    canProcessFulFill(config) {
        this.client.markIdle();
        return super.canProcessFulFill(config);
    }
    canProcessReject(error) {
        this.client.markIdle();
        return super.canProcessReject(error);
    }
}
//# sourceMappingURL=auth_client_guards.js.map