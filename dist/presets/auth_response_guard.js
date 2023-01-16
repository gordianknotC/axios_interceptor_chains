import { BaseAuthResponseGuard, BaseAuthResponseGuardForAuthClient } from "../base/impl/base_auth_response_guard_impl";
import { BaseClientServiceResponsePlugin } from "../base/impl/response_plugins_impl";
import axios from "axios";
export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
    canProcessReject(error) {
        const status = error.response.status;
        return status == axios.HttpStatusCode.Forbidden;
    }
}
export class AuthResponseGuard extends BaseAuthResponseGuard {
    onRequestNewAuth(error, pendingRequest) {
        return super.onRequestNewAuth(error, pendingRequest);
    }
}
export class AuthResponseGuardForAuthClient extends BaseAuthResponseGuardForAuthClient {
}
//# sourceMappingURL=auth_response_guard.js.map