import { EClientStage } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import axios from "axios";
import { is, AsyncQueue, Logger, Completer } from "@gdknot/frontend_common";
import { LogModules } from "@/setup/logger.setup";
const D = new Logger(LogModules.Client);
export class BaseAuthClient {
    get callInterval() {
        return (new Date()).getTime() - this._lastT;
    }
    get canAuth() {
        return this.authCompleter == undefined
            && (this.hostClient.stage == EClientStage.idle
                || this.hostClient.stage == EClientStage.fetching);
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
        this.queue = new AsyncQueue();
        this.axios = axios.create(config);
        this.requester = async () => {
            try {
                this.authCounter++;
                if (!this.canAuth) {
                    D.info(["auth already called, wait for response, completer:", this.hostClient.stage, this.authCompleter]);
                    return this.authCompleter.future;
                }
                this.authCompleter = new Completer();
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
                this.resetCompleter(interval ?? 600);
                return completer.future;
            }
            catch (err) {
                console.error("Exception on auth request:", err);
                this.authCompleter = undefined;
                markIdle();
                return Promise.reject(err);
            }
        };
        if (is.not.empty(requestChain)) {
            BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (is.not.empty(responseChain)) {
            BaseClientServicesPluginChains.install(responseChain, this, "response");
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
//# sourceMappingURL=base_auth_client.js.map