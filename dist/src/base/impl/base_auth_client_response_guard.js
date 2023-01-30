import { UnExpectedError } from "@gdknot/frontend_common";
import { EClientStage } from "../itf/client_itf";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";
export class AuthClientResponseGuard extends BaseClientServiceResponsePlugin {
    get isAuthorizing() {
        return this.client.hostClient.stage == EClientStage.authorizing;
    }
    get isFetched() {
        return this.client.hostClient.stage == EClientStage.authFetched;
    }
    get isUpdated() {
        return this.client.hostClient.stage == EClientStage.authUpdated;
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
export class AuthClientStageMarker extends AuthClientResponseGuard {
    canProcessFulFill(config) {
        return false;
    }
    canProcessReject(error) {
        return false;
    }
    processFulFill(response) {
        throw new UnExpectedError("");
    }
    processReject(error) {
        throw new UnExpectedError("");
    }
}
//# sourceMappingURL=base_auth_client_response_guard.js.map