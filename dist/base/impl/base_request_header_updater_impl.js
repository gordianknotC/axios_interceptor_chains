import { BaseClientServiceRequestPlugin } from "../../base/impl/request_plugins_impl";
import { NotImplementedError } from "@gdknot/frontend_common";
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
/** 用來 UpdateRequest Configuration */
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
        return super.processFulFill(config);
    }
}
//# sourceMappingURL=base_request_header_updater_impl.js.map