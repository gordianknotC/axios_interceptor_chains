"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkErrorResponseGuard = void 0;
const response_plugins_impl_1 = require("../base/impl/response_plugins_impl");
/**
 * {@inheritdoc BaseClientServiceResponsePlugin}
 * 用來攔截 Network Error
 * */
class NetworkErrorResponseGuard extends response_plugins_impl_1.BaseClientServiceResponsePlugin {
    constructor(networkErrorHandler) {
        super();
        this.networkErrorHandler = networkErrorHandler;
    }
    canProcessFulFill(config) {
        return false;
    }
    /**
     * @extendSummary -
     * 這裡只查找 error.message.toLowerCase() == "network error" 者, 若成立則 {@link processReject}
     */
    canProcessReject(error) {
        try {
            return error.message.toLowerCase() == "network error";
        }
        catch (e) {
            console.error("Exception on canProcessReject, error:", error);
            return false;
        }
    }
    /**
     * @extendSummary -
     * 執行 {@link networkErrorHandler} 並繼續 responsibility chain
     */
    processReject(error) {
        this.networkErrorHandler(error);
        return this.reject(error);
        return super.processReject(error);
    }
}
exports.NetworkErrorResponseGuard = NetworkErrorResponseGuard;
//# sourceMappingURL=network_error_response_guard.js.map