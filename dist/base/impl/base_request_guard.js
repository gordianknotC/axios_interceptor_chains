import { BaseClientServiceRequestPlugin } from "../../base/impl/request_plugins_impl";
import { Logger, NotImplementedError } from "@gdknot/frontend_common";
import { LogModules } from "../../setup/logger.setup";
const D = new Logger(LogModules.HeaderUpdater);
/**
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestGuard extends BaseClientServiceRequestPlugin {
    constructor() {
        super();
        this._enabled = true;
    }
    enable() {
        this._enabled = true;
    }
    disable() {
        this._enabled = false;
    }
    canProcessFulFill(config) {
        if (!this._enabled)
            return false;
        return super.canProcessFulFill(config);
    }
    canProcessReject(error) {
        if (!this._enabled)
            return false;
        return super.canProcessReject(error);
    }
}
/** 用來更新 AxiosRequestConfig
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestHeaderGuard extends BaseRequestGuard {
    constructor() {
        super();
    }
    appendRequestHeader() {
        throw new NotImplementedError("getRequestHeader");
    }
    processFulFill(config) {
        const header = config.headers;
        const appendedHeader = this.appendRequestHeader();
        header.set(appendedHeader);
        D.info(["update header:", appendedHeader, "new header:", header]);
        return super.processFulFill(config);
    }
}
//# sourceMappingURL=base_request_guard.js.map