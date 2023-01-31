"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthClientStageMarker = exports.AuthClientResponseGuard = void 0;
const frontend_common_1 = require("@gdknot/frontend_common");
const client_itf_1 = require("../itf/client_itf");
const response_plugins_impl_1 = require("./response_plugins_impl");
class AuthClientResponseGuard extends response_plugins_impl_1.BaseClientServiceResponsePlugin {
    get isAuthorizing() {
        return this.client.hostClient.stage == client_itf_1.EClientStage.authorizing;
    }
    get isFetched() {
        return this.client.hostClient.stage == client_itf_1.EClientStage.authFetched;
    }
    get isUpdated() {
        return this.client.hostClient.stage == client_itf_1.EClientStage.authUpdated;
    }
    get hasQueue() {
        return !this.client.hostClient.queue.isEmpty;
    }
    get host() {
        return this.client.hostClient;
    }
    get queue() {
        return this.client.hostClient.queue;
    }
    constructor() {
        super();
    }
}
exports.AuthClientResponseGuard = AuthClientResponseGuard;
class AuthClientStageMarker extends AuthClientResponseGuard {
    canProcessFulFill(config) {
        return false;
    }
    canProcessReject(error) {
        return false;
    }
    processFulFill(response) {
        throw new frontend_common_1.UnExpectedError("");
    }
    processReject(error) {
        throw new frontend_common_1.UnExpectedError("");
    }
}
exports.AuthClientStageMarker = AuthClientStageMarker;
//# sourceMappingURL=base_auth_client_response_guard.js.map