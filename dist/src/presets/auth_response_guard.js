import { BaseAuthResponseGuard } from "../../base/impl/base_auth_response_guard";
import { ChainActionStage } from "../../base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "../../base/impl/response_plugins_impl";
import axios from "axios";
import { RequestReplacer } from "..";
import { ACAuthResponseGuard } from "./auth_client_guards";
export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
    canProcessReject(error) {
        const status = error.response.status;
        return status == axios.HttpStatusCode.Forbidden;
    }
}
/**{@inheritdoc} BaseAuthResponseGuard */
export class AuthResponseGuard extends BaseAuthResponseGuard {
    onRequestNewAuth(error) {
        return super.onRequestNewAuth(error);
    }
    onRestoreRequest(error) {
        return super.onRestoreRequest(error);
    }
    processReject(error) {
        if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)) {
            return this.rejectAndIgnoreAll(error);
        }
        return this.reject(error);
    }
    /**
     * @returns - 用來攔截以下二種情況
     * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
     */
    canProcessReject(error) {
        const isUnAuthorizedResponse = error.response?.status == axios.HttpStatusCode.Unauthorized;
        const isRaisedFromRequestReplacer = this.isDirtiedBy(error, RequestReplacer.name);
        return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
    }
}
//# sourceMappingURL=auth_response_guard.js.map