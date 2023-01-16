import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import axios from "axios";
import { is, AsyncQueue, Logger } from "@gdknot/frontend_common";
import debounce from "debounce";
import { LogModules } from "../../setup/logger.setup";
const D = new Logger(LogModules.Client);
export class BaseAuthClient {
    constructor(option, hostClient, idleSetter) {
        this.option = option;
        this.hostClient = hostClient;
        this.idleSetter = idleSetter;
        const { requestChain, responseChain, axiosConfig: config } = option;
        const authDebounceImmediate = true;
        this.requestChain = requestChain;
        this.responseChain = responseChain;
        this.queue = new AsyncQueue();
        this.axios = axios.create(config);
        this.requester = debounce(async () => {
            try {
                const _inst = this.axios;
                const { url, payloadGetter, tokenGetter, tokenUpdater } = option;
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
                D.current(["auth response!", response]);
                tokenUpdater(response);
                // 這裡直接存取私有屬性，以繞開 setStage 於 authorizing 下不能轉 idle
                // authorizing 變更為 idle 只能透過 private _stage
                idleSetter();
                return response.data;
            }
            catch (err) {
                console.error("Exception on auth request:", err);
                idleSetter();
                throw err;
            }
        }, option.interval, authDebounceImmediate);
        if (is.not.empty(requestChain)) {
            BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (is.not.empty(responseChain)) {
            BaseClientServicesPluginChains.install(responseChain, this, "response");
        }
    }
}
//# sourceMappingURL=auth_client_impl.js.map