import { BaseClientServiceResponsePlugin } from "../base/impl/response_plugins_impl";
/**
 * {@inheritdoc BaseClientServiceResponsePlugin}
 * 用來攔截 Network Error
 * */
export class NetworkErrorResponseGuard extends BaseClientServiceResponsePlugin {
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
        return super.processReject(error);
    }
}
//# sourceMappingURL=network_error_response_guard.js.map