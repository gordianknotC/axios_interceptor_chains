import { EClientStage } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import axios from "axios";
import { is, assert, AsyncQueue, Logger } from "@gdknot/frontend_common";
import { LogModules } from "../../setup/logger.setup";
import { BaseAuthClient } from "./auth_client_impl";
const D = new Logger(LogModules.Client);
export const DEFAULT_CLIENT_OPTION = {
    interval: 600,
    url: "",
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
        D.current(["set stage:", _.toString()], { stackNumber: 1 });
        if (this.__stage != _) {
            switch (_) {
                case EClientStage.authorizing:
                    this._onAuthorizing?.();
                    break;
                case EClientStage.fetching:
                    this._onFetching?.();
                    break;
                case EClientStage.idle:
                    this._onIdle?.();
                    break;
            }
        }
        this.__stage = _;
    }
    get stage() {
        return this._stage;
    }
    ;
    constructor(option) {
        this.option = option;
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
            option.authOption = Object.assign({
                ...DEFAULT_CLIENT_OPTION
            }, option.authOption ?? {});
            this.authClient = new BaseAuthClient(option.authOption, this, () => this._stage = EClientStage.idle);
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
    onFetching(cb) {
        this._onFetching = cb;
    }
    onAuthorizing(cb) {
        this._onAuthorizing = cb;
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
            const res = await this.axios(option);
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
        assert(() => this.authClient != undefined && this.authClient.requester != undefined, "axios client for authorization not initialized properly");
        this.setStage(EClientStage.authorizing);
        return this.authClient.requester();
    }
    async put(url, payload) {
        return this._request("put", url, Object.freeze(payload));
    }
    async del(url, payload) {
        return this._request("delete", url, Object.freeze(payload));
    }
}
//# sourceMappingURL=client_impl.js.map