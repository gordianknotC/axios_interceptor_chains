import { BaseAuthResponseGuard } from "../base/impl/base_auth_response_guard";
import { BaseClientServiceResponsePlugin } from "../base/impl/response_plugins_impl";
import axios from "axios";
import { BaseRequestReplacer } from "..";
import { ACAuthResponseGuard } from "./auth_client_guards";
export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
    canProcessReject(error) {
        const status = error.response.status;
        return status == axios.HttpStatusCode.Forbidden;
    }
}
export class AuthResponseGuard extends BaseAuthResponseGuard {
    onRequestNewAuth(error) {
        return super.onRequestNewAuth(error);
    }
    onRestoreRequest(error) {
        return super.onRestoreRequest(error);
    }
    processReject(error) {
        if (error.config.headers["__chain_action__"] == ACAuthResponseGuard.configActionName) {
            console.log("processReject - requests from ACAuthGuard");
            return Promise.reject(error);
        }
        return super.processReject(error);
    }
    /**
     * @returns -
     * error.response?.status == axios.HttpStatusCode.Unauthorized
        || error.message == BaseRequestReplacer.errorMessageForReplacement;
     */
    canProcessReject(error) {
        const isUnAuthorizedResponse = error.response?.status == axios.HttpStatusCode.Unauthorized;
        const isRaisedFromRequestReplacer = error.message == BaseRequestReplacer.configActionName;
        const isSendRestoredFromAcAuthGuard = (error.config?.headers)["__chain_action__"] == ACAuthResponseGuard.configActionName;
        // if (isSendRestoredFromAcAuthGuard){
        //   console.warn("isSendRestoredFromAcAuthGuard:", isSendRestoredFromAcAuthGuard);
        // }
        return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
    }
}
//# sourceMappingURL=auth_response_guard.js.map