import { EClientStage } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import axios from "axios";
import { is, assert, AsyncQueue, Logger } from "@gdknot/frontend_common";
import { LogModules } from "@/setup/logger.setup";
import { BaseAuthClient } from "./base_auth_client";
const D = new Logger(LogModules.Client);
export const DEFAULT_AUTH_CLIENT_OPTION = {
    interval: 600,
    payloadGetter: (() => { }),
    tokenGetter: (() => ""),
    tokenUpdater: ((response) => { }),
    redirect: ((response) => {
        return { clearQueue: true };
    }),
};
/** {@inheritdoc IClientService}
*
* @typeParam DATA - response 型別
* @typeParam ERROR - error 型別
* @typeParam SUCCESS - success 型別
*/
export class BaseClient {
    /** stage {@link EClientStage} */
    get _stage() {
        return this.__stage;
    }
    ;
    /** stage {@link EClientStage} */
    set _stage(_) {
        if (this.__stage != _) {
            switch (_) {
                case EClientStage.authorizing:
                    console.log("call authorizing:", this._onAuthorizing);
                    this._onAuthorizing?.(this.__stage);
                    break;
                case EClientStage.fetching:
                    this._onFetching?.(this.__stage);
                    break;
                case EClientStage.idle:
                    this._onIdle?.(this.__stage);
                    break;
                case EClientStage.authFetched:
                    this._onAuthFetched?.(this.__stage);
                    break;
                case EClientStage.authUpdated:
                    this._onAuthUpdated?.(this.__stage);
                    break;
            }
        }
        D.info(["set stage:", _.toString(), this.__stage.toString()]);
        this.__stage = _;
        this._onStageChanged?.(this.stage);
    }
    get stage() {
        return this._stage;
    }
    ;
    constructor(option) {
        this.option = option;
        /** stage {@link EClientStage} */
        this.__stage = EClientStage.idle;
        const { requestChain, responseChain, axiosConfig: config, isErrorResponse, isDataResponse, isSuccessResponse } = option;
        this.isErrorResponse = isErrorResponse;
        this.isDataResponse = isDataResponse;
        this.isSuccessResponse = isSuccessResponse;
        const authDebounceImmediate = true;
        this.requestChain = requestChain;
        this.responseChain = responseChain;
        this.axios = axios.create(config);
        this._stage = EClientStage.idle;
        this.queue = new AsyncQueue();
        if (option.authOption) {
            option.authOption = Object.freeze(Object.assign({
                ...DEFAULT_AUTH_CLIENT_OPTION,
            }, option.authOption ?? {}));
            this.authClient = new BaseAuthClient(option.authOption, this, () => this._stage = EClientStage.authorizing, () => this._stage = EClientStage.idle, () => this._stage = EClientStage.authFetched, () => this._stage = EClientStage.authUpdated);
        }
        if (is.not.empty(requestChain)) {
            BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (is.not.empty(responseChain)) {
            BaseClientServicesPluginChains.install(responseChain, this, "response");
        }
    }
    // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
    /** 設置 client 當前 stage */
    setStage(stage) {
        switch (stage) {
            case EClientStage.authUpdated:
            case EClientStage.authFetched:
            case EClientStage.authorizing:
                this._stage = stage;
                break;
            case EClientStage.fetching:
                if (this.stage == EClientStage.authorizing || this.stage == EClientStage.authFetched) {
                    return;
                }
                this._stage = stage;
                break;
            case EClientStage.idle:
                if (this.stage == EClientStage.authorizing || this.stage == EClientStage.authFetched) {
                    return;
                }
                this._stage = stage;
                break;
        }
    }
    onStageChanged(cb, wipeAfterCall = false) {
        this._onStageChanged = wipeAfterCall
            ? () => { cb(this.stage); this._onStageChanged = undefined; }
            : cb;
    }
    onIdle(cb, wipeAfterCall = false) {
        this._onIdle = wipeAfterCall
            ? (prev) => { cb(prev); this._onIdle = undefined; }
            : cb;
    }
    onFetching(cb, wipeAfterCall = false) {
        this._onFetching = wipeAfterCall
            ? () => { cb(); this._onFetching = undefined; }
            : cb;
    }
    onAuthorizing(cb, wipeAfterCall = false) {
        this._onAuthorizing = wipeAfterCall
            ? (prev) => { cb(prev); this._onAuthorizing = undefined; }
            : cb;
    }
    onAuthFetched(cb, wipeAfterCall = false) {
        this._onAuthFetched = wipeAfterCall
            ? (prev) => { cb(prev); this._onAuthFetched = undefined; }
            : cb;
    }
    onAuthUpdated(cb, wipeAfterCall = false) {
        this._onAuthUpdated = wipeAfterCall
            ? (prev) => { cb(prev); this._onAuthUpdated = undefined; }
            : cb;
    }
    async _request(method, url, data, headers, responseTransformer, config) {
        try {
            const option = method == "get"
                ? Object.freeze({ method, url, params: data, headers })
                : Object.freeze({ method, url, data, headers });
            responseTransformer ?? (responseTransformer = (res) => {
                return res.data;
            });
            D.info(["_request, before fetch", option]);
            this.setStage(EClientStage.fetching);
            const res = await this.axios(option);
            const isValidAxiosResponse = res.data != undefined;
            isValidAxiosResponse
                ? D.info(["_request, after fetch, with response", option])
                : D.info(["_request, after fetch, no data response", option]);
            this.setStage(EClientStage.idle);
            return responseTransformer(res);
        }
        catch (e) {
            this.setStage(EClientStage.idle);
            if (e == undefined) {
                console.error(`Network Error: url - ${url}, method - ${method}`);
                const code = undefined;
                throw new axios.AxiosError("Network Error", code, config);
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
            throw new Error(`${e}`);
        }
    }
    async requestByConfig(config) {
        const { method, url, data, headers } = config;
        D.info(["requestByConfig", url, data]);
        return this._request(method, url, Object.freeze(data), headers ?? {}, (response) => {
            return response;
        }, config);
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
        assert(() => this.authClient != undefined && this.authClient.requester != undefined, "axios client for authorization not initialized properly");
        return this.authClient.requester().then((_) => {
            D.info(["auth response:", _]);
            return _;
        });
    }
    async put(url, payload) {
        return this._request("put", url, Object.freeze(payload));
    }
    async del(url, payload) {
        return this._request("delete", url, Object.freeze(payload));
    }
}
//# sourceMappingURL=base_client_impl.js.map