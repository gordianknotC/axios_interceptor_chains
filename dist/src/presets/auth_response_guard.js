"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResponseGuard = exports.ForbiddenResponseGuard = void 0;
const tslib_1 = require("tslib");
const base_auth_response_guard_1 = require("../base/impl/base_auth_response_guard");
const plugin_chains_itf_1 = require("../base/itf/plugin_chains_itf");
const response_plugins_impl_1 = require("../base/impl/response_plugins_impl");
const axios_1 = tslib_1.__importDefault(require("axios"));
const request_replacer_1 = require("../presets/request_replacer");
const auth_client_guards_1 = require("../presets/auth_client_guards");
class ForbiddenResponseGuard extends response_plugins_impl_1.BaseClientServiceResponsePlugin {
    canProcessReject(error) {
        const status = error.response.status;
        return status == axios_1.default.HttpStatusCode.Forbidden;
    }
}
exports.ForbiddenResponseGuard = ForbiddenResponseGuard;
/**{@inheritdoc} BaseAuthResponseGuard */
class AuthResponseGuard extends base_auth_response_guard_1.BaseAuthResponseGuard {
    onRequestNewAuth(error) {
        return super.onRequestNewAuth(error);
    }
    onRestoreRequest(error) {
        return super.onRestoreRequest(error);
    }
    processReject(error) {
        if (this.isDirtiedBy(error, auth_client_guards_1.ACAuthResponseGuard.name, plugin_chains_itf_1.ChainActionStage.processResponse)) {
            return this.rejectAndIgnoreAll(error);
        }
        return this.reject(error);
    }
    /**
     * @returns - 用來攔截以下二種情況
     * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
     */
    canProcessReject(error) {
        var _a;
        const isUnAuthorizedResponse = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) == axios_1.default.HttpStatusCode.Unauthorized;
        const isRaisedFromRequestReplacer = this.isDirtiedBy(error, request_replacer_1.RequestReplacer.name);
        return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
    }
}
exports.AuthResponseGuard = AuthResponseGuard;
//# sourceMappingURL=auth_response_guard.js.map