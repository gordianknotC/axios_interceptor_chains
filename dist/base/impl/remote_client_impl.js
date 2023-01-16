import { EClientStage } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import axios from "axios";
import { is, Queue, Logger } from "@gdknot/frontend_common";
import debounce from "debounce";
import { LogModules } from "../../setup/logger.setup";
const D = new Logger(LogModules.Client);
export class BaseClient {
    get _stage() {
        return this.__stage;
    }
    ;
    set _stage(_) {
        D.current(["set stage:", _.toString()], { stackNumber: 1 });
        this.__stage = _;
    }
    get stage() {
        return this._stage;
    }
    ;
    constructor(option) {
        const { requestChain, responseChain, config, isErrorResponse, isDataResponse, isSuccessResponse } = option;
        this.isErrorResponse = isErrorResponse;
        this.isDataResponse = isDataResponse;
        this.isSuccessResponse = isSuccessResponse;
        this.authOption = Object.assign({
            interval: 600,
            url: "",
            payloadGetter: (() => { }),
            tokenGetter: (() => ""),
            tokenUpdater: ((response) => { }),
            redirect: ((response) => {
                // window.location.href = "/"
            }),
        }, option.authOption ?? {});
        const authDebounceImmediate = true;
        this.requestChain = requestChain;
        this.responseChain = responseChain;
        this.client = axios.create(config);
        this._stage = EClientStage.idle;
        this.queue = new Queue();
        this._authClient = axios.create(this.authOption);
        this._authRequester = debounce(async () => {
            try {
                const _inst = this._authClient;
                const { url, payloadGetter, tokenGetter, tokenUpdater } = this.authOption;
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
                this._stage = EClientStage.idle;
                return response.data;
            }
            catch (err) {
                console.error("Exception on auth request:", err);
                this._stage = EClientStage.idle;
                throw err;
            }
        }, this.authOption.interval, authDebounceImmediate);
        if (is.not.empty(requestChain)) {
            BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (is.not.empty(responseChain)) {
            BaseClientServicesPluginChains.install(responseChain, this, "response");
        }
    }
    // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
    setStage(stage) {
        switch (stage) {
            case EClientStage.authorizing:
                this._stage = stage;
                break;
            case EClientStage.fetching:
                if (this.stage == EClientStage.authorizing) {
                    return;
                }
                this._stage = stage;
                break;
            case EClientStage.idle:
                if (this.stage == EClientStage.authorizing) {
                    return;
                }
                this._stage = stage;
                break;
        }
    }
    onIdle(cb) {
        this._onIdle = cb;
    }
    async _request(method, url, data, headers, responseTransformer, config) {
        try {
            const option = method == "get"
                ? Object.freeze({ method, url, params: data, headers })
                : Object.freeze({ method, url, data, headers });
            responseTransformer ?? (responseTransformer = (res) => {
                return res.data;
            });
            D.current(["_request, before fetch", option]);
            this.setStage(EClientStage.fetching);
            const res = await this.client(option);
            const isValidAxiosResponse = res.data != undefined;
            isValidAxiosResponse
                ? D.current(["_request, after fetch, with response", option])
                : D.current(["_request, after fetch, no data response", option]);
            this.setStage(EClientStage.idle);
            return responseTransformer(res);
        }
        catch (e) {
            this.setStage(EClientStage.idle);
            if (e == undefined) {
                console.error(`Network Error: url - ${url}, method - ${method}`);
                throw new axios.AxiosError("Network Error");
            }
            else if (e.isAxiosError) {
                const error = e;
                const msg = {
                    message: error.message,
                    response: error.response,
                    requestConfig: {
                        method: error.config?.method,
                        url: error.config?.url,
                        params: error.config?.params,
                        data: error.config?.data
                    },
                };
                throw new Error(`[AxiosError]: ${JSON.stringify(msg)}`);
            }
            throw new Error(`Catch Error on _request: ${JSON.stringify(e)}`);
        }
    }
    async requestByConfig(config) {
        const { method, url, data } = config;
        D.current(["requestByConfig", url, data]);
        return this._request(method, url, Object.freeze(data), undefined, (response) => {
            return response;
        });
    }
    async get(url, payload) {
        return this._request("get", url, Object.freeze(payload));
    }
    async post(url, payload) {
        return this._request("post", url, Object.freeze(payload));
    }
    async postForm(url, formData) {
        return this._request("post", url, Object.freeze(formData), {
            "Content-Type": "multipart/form-data"
        });
    }
    async auth() {
        this.setStage(EClientStage.authorizing);
        return this._authRequester();
        // return this._request("post", url, payload, undefined, EClientStage.authorizing);
    }
    async put(url, payload) {
        return this._request("put", url, Object.freeze(payload));
    }
    async del(url, payload) {
        return this._request("delete", url, Object.freeze(payload));
    }
}
//# sourceMappingURL=remote_client_impl.js.map