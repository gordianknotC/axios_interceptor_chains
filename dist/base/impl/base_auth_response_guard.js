"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAuthResponseGuard = void 0;
const tslib_1 = require("tslib");
const logger_setup_1 = require("../../setup/logger.setup");
const common_utils_1 = require("../../utils/common_utils");
const frontend_common_1 = require("@gdknot/frontend_common");
const axios_1 = tslib_1.__importDefault(require("axios"));
const response_plugins_impl_1 = require("./response_plugins_impl");
const D = new frontend_common_1.Logger(logger_setup_1.LogModules.AuthGuard);
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
class BaseAuthResponseGuard extends response_plugins_impl_1.BaseClientServiceResponsePlugin {
    constructor() {
        super();
    }
    /** ### 用來生成代替 unauthorized error 的空請求
     * 當 unauthorized error 後，auth token 換發前，會生成一個空的 Promise 請求，
     * 以代替原請求因 unauthorized error 所產生的錯誤，{@link BaseAuthResponseGuard} 會先
     * 返回這個空的 Promise 好讓原 axios 的請求持續等待。
     * @param error - {@link AxiosError}
     * @returns - {@link Completer<any, QueueItem>}
     */
    onRestoreRequest(error) {
        var _a, _b;
        const requestConfig = error.config;
        const timeout = (_a = this.client.axios.defaults.timeout) !== null && _a !== void 0 ? _a : 10 * 1000;
        const id = error.config.url;
        //console.log("onRestoreRequest:", error.config);
        const completer = (_b = this.client) === null || _b === void 0 ? void 0 : _b.queue.enqueue(id, () => {
            return (0, common_utils_1.wait)(timeout);
        });
        const item = completer._meta;
        item.meta = { requestConfig };
        return completer;
    }
    /** ### 用來定義當 unauthorized error 後，auth token 換發時的主要邏輯, 預設為 this.client.auth()
     * @param error - {@link AxiosError}
     * @param pendingRequest - 由{@link onRestoreRequest} 所生成的 pendingRequest，
     * 其內容為一個永不 resolve 的 Promise 物件，直到 auth token 重新換發後再次重新送出原請求，才
     * 會更新 pendingRequest 的內容，在這之前 pendingRequest 的 Promise 物件會一直保持 pending，
     * 除非 timeout
     */
    onRequestNewAuth(error) {
        return this.client.auth();
    }
    /**
    * @extendSummary - 用來處理當特定 response error 下，保流原請求後，進行 token 換發，流程為：
    * - {@link onRestoreRequest} 保留請請
    * - {@link onRequestNewAuth} 換發 auth token
    *     - {@link onAuthError} 當 auth token 換發失败
    *     - {@link onAuthSuccess} 當 auth token 換發成功
    *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
    */
    async reject(input) {
        var _a, _b;
        try {
            const error = input;
            const pending = this.onRestoreRequest(error);
            D.info(["onRestoreRequest A", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = this.client) === null || _b === void 0 ? void 0 : _b.queue.queue.length]);
            const authResponse = await this.onRequestNewAuth(error);
            return pending.future;
        }
        catch (e) {
            throw e;
        }
    }
    rejectAndIgnoreAll(input) {
        return super.rejectAndIgnoreAll(input);
    }
    /** @returns - false */
    canProcessFulFill(config) {
        return false;
    }
    //
    //
    //    R E J E C T
    //
    //
    /**
     * @extendSummary -
     * 當 error.response?.status == axios.HttpStatusCode.Unauthorized
     * 時可進行至 processReject 處理
     */
    canProcessReject(error) {
        var _a;
        return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) == axios_1.default.HttpStatusCode.Unauthorized;
    }
    /**
    * @extendSummary - 用來處理 unauthorized error 下，保流原請求後，進行 token 換發，流程為：
    * - {@link onRestoreRequest} 保留請請
    * - {@link onRequestNewAuth} 換發 auth token
    *     - {@link onAuthError} 當 auth token 換發失败
    *     - {@link onAuthSuccess} 當 auth token 換發成功
    *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
    */
    async processReject(error) {
        throw new frontend_common_1.NotImplementedError();
    }
}
exports.BaseAuthResponseGuard = BaseAuthResponseGuard;
//# sourceMappingURL=base_auth_response_guard.js.map