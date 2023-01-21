import { Logger } from "@gdknot/frontend_common";
import { AuthClientResponseGuard, AuthClientStageMarker } from "../base/impl/base_auth_client_response_guard";
import { LogModules } from "../setup/logger.setup";
const D = new Logger(LogModules.AuthClient);
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
            const config = completer._meta.meta.requestConfig;
            config.headers["__chain_action__"] = ACAuthResponseGuard.configActionName;
            console.log("write", ACAuthResponseGuard.configActionName);
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
      * 1) 當 authorizing 發出時，2) request queue 有東西
     */
    canProcessFulFill(response) {
        return (this.isUpdated) && this.hasQueue;
    }
    processFulFill(response) {
        return super.processFulFill(this.onAuthSuccess(response));
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
        return super.processReject(error);
    }
}
/** 當request 進行取代持會 raise 這個 exception */
ACAuthResponseGuard.configActionName = "ACAuthResponseGuard.bypassAuthGuard";
/** markIdle */
export class ACTokenUpdater extends AuthClientResponseGuard {
    canProcessFulFill(response) {
        D.info(["ACTokenUpdater.canProcessFulFill, response:", response.data]);
        return this.host.isDataResponse(response);
    }
    processFulFill(response) {
        this.client?.option.tokenUpdater(response);
        D.current(["ACTokenUpdater:", response.data, this.client?.option.tokenGetter()]);
        if (this.client?.option.tokenGetter() == undefined) {
            throw new Error("Unexpected tokenGetter/tokenUpdater");
        }
        this.client?.markUpdated();
        return super.processFulFill(response);
    }
    canProcessReject(error) {
        return false;
    }
}
/** markIdle */
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
/** markIdle */
export class ACIdleMarker extends AuthClientStageMarker {
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