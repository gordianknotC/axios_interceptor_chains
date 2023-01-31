"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAuthClient = void 0;
const tslib_1 = require("tslib");
const client_itf_1 = require("../itf/client_itf");
const plugin_chains_itf_1 = require("../itf/plugin_chains_itf");
const axios_1 = tslib_1.__importDefault(require("axios"));
const frontend_common_1 = require("@gdknot/frontend_common");
const logger_setup_1 = require("../../setup/logger.setup");
const D = new frontend_common_1.Logger(logger_setup_1.LogModules.Client);
class BaseAuthClient {
    get callInterval() {
        return (new Date()).getTime() - this._lastT;
    }
    get canAuth() {
        return this.authCompleter == undefined
            && (this.hostClient.stage == client_itf_1.EClientStage.idle
                || this.hostClient.stage == client_itf_1.EClientStage.fetching);
    }
    constructor(option, hostClient, markAuthorizing, markIdle, markFetched, markUpdated) {
        this.option = option;
        this.hostClient = hostClient;
        this.markAuthorizing = markAuthorizing;
        this.markIdle = markIdle;
        this.markFetched = markFetched;
        this.markUpdated = markUpdated;
        /** numbers of all authorization calls */
        this._totalAuthCounter = 0;
        /** numbers of all authorization calls in last second*/
        this.authCounter = 0;
        this._lastT = (new Date()).getTime();
        D.info(["AuthClient init"]);
        const { requestChain, responseChain, axiosConfig: config, interval } = option;
        const authDebounceImmediate = true;
        this.requestChain = requestChain;
        this.responseChain = responseChain;
        this.queue = new frontend_common_1.AsyncQueue();
        this.axios = axios_1.default.create(config);
        this.requester = async () => {
            try {
                this.authCounter++;
                if (!this.canAuth) {
                    D.info(["auth already called, wait for response, completer:", this.hostClient.stage, this.authCompleter]);
                    return this.authCompleter.future;
                }
                this.authCompleter = new frontend_common_1.Completer();
                markAuthorizing();
                const _inst = this.axios;
                const { axiosConfig, payloadGetter, tokenGetter, tokenUpdater } = option;
                const { url } = axiosConfig;
                const axiosOption = {
                    method: "post",
                    url,
                    data: payloadGetter(),
                    headers: {
                        Authorization: tokenGetter()
                    }
                };
                if (payloadGetter())
                    axiosOption.data = payloadGetter();
                D.current(["auth before fetch!", url]);
                const response = await _inst(axiosOption);
                D.current(["auth response!"]);
                this.authCompleter.complete(response.data);
                const completer = this.authCompleter;
                this.resetCompleter(interval !== null && interval !== void 0 ? interval : 600);
                return completer.future;
            }
            catch (err) {
                console.error("Exception on auth request:", err);
                this.authCompleter = undefined;
                markIdle();
                return Promise.reject(err);
            }
        };
        if (frontend_common_1.is.not.empty(requestChain)) {
            plugin_chains_itf_1.BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (frontend_common_1.is.not.empty(responseChain)) {
            plugin_chains_itf_1.BaseClientServicesPluginChains.install(responseChain, this, "response");
        }
        setInterval(() => {
            this.resetAuthCounter();
        }, 1000);
    }
    resetCompleter(interval) {
        this._lastT = (new Date()).getTime();
        clearTimeout(this.authCompleterTimeout);
        this.authCompleterTimeout = setTimeout(() => {
            this.authCompleter = undefined;
        }, interval);
    }
    resetAuthCounter(idleTime = 2000) {
        this._totalAuthCounter += this.authCounter;
        this.authCounter = 0;
    }
}
exports.BaseAuthClient = BaseAuthClient;
//# sourceMappingURL=base_auth_client.js.map