"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = exports.DEFAULT_AUTH_CLIENT_OPTION = void 0;
const tslib_1 = require("tslib");
const client_itf_1 = require("../itf/client_itf");
const plugin_chains_itf_1 = require("../itf/plugin_chains_itf");
const axios_1 = tslib_1.__importDefault(require("axios"));
const frontend_common_1 = require("@gdknot/frontend_common");
const logger_setup_1 = require("../../setup/logger.setup");
const base_auth_client_1 = require("../../base/impl/base_auth_client");
const D = new frontend_common_1.Logger(logger_setup_1.LogModules.Client);
exports.DEFAULT_AUTH_CLIENT_OPTION = {
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
class BaseClient {
    /** stage {@link EClientStage} */
    get _stage() {
        return this.__stage;
    }
    ;
    /** stage {@link EClientStage} */
    set _stage(_) {
        var _a, _b, _c, _d, _e, _f;
        if (this.__stage != _) {
            switch (_) {
                case client_itf_1.EClientStage.authorizing:
                    console.log("call authorizing:", this._onAuthorizing);
                    (_a = this._onAuthorizing) === null || _a === void 0 ? void 0 : _a.call(this, this.__stage);
                    break;
                case client_itf_1.EClientStage.fetching:
                    (_b = this._onFetching) === null || _b === void 0 ? void 0 : _b.call(this, this.__stage);
                    break;
                case client_itf_1.EClientStage.idle:
                    (_c = this._onIdle) === null || _c === void 0 ? void 0 : _c.call(this, this.__stage);
                    break;
                case client_itf_1.EClientStage.authFetched:
                    (_d = this._onAuthFetched) === null || _d === void 0 ? void 0 : _d.call(this, this.__stage);
                    break;
                case client_itf_1.EClientStage.authUpdated:
                    (_e = this._onAuthUpdated) === null || _e === void 0 ? void 0 : _e.call(this, this.__stage);
                    break;
            }
        }
        D.info(["set stage:", _.toString(), this.__stage.toString()]);
        this.__stage = _;
        (_f = this._onStageChanged) === null || _f === void 0 ? void 0 : _f.call(this, this.stage);
    }
    get stage() {
        return this._stage;
    }
    ;
    constructor(option) {
        var _a;
        this.option = option;
        /** stage {@link EClientStage} */
        this.__stage = client_itf_1.EClientStage.idle;
        const { requestChain, responseChain, axiosConfig: config, isErrorResponse, isDataResponse, isSuccessResponse } = option;
        this.isErrorResponse = isErrorResponse;
        this.isDataResponse = isDataResponse;
        this.isSuccessResponse = isSuccessResponse;
        const authDebounceImmediate = true;
        this.requestChain = requestChain;
        this.responseChain = responseChain;
        this.axios = axios_1.default.create(config);
        this._stage = client_itf_1.EClientStage.idle;
        this.queue = new frontend_common_1.AsyncQueue();
        if (option.authOption) {
            option.authOption = Object.freeze(Object.assign({
                ...exports.DEFAULT_AUTH_CLIENT_OPTION,
            }, (_a = option.authOption) !== null && _a !== void 0 ? _a : {}));
            this.authClient = new base_auth_client_1.BaseAuthClient(option.authOption, this, () => this._stage = client_itf_1.EClientStage.authorizing, () => this._stage = client_itf_1.EClientStage.idle, () => this._stage = client_itf_1.EClientStage.authFetched, () => this._stage = client_itf_1.EClientStage.authUpdated);
        }
        if (frontend_common_1.is.not.empty(requestChain)) {
            plugin_chains_itf_1.BaseClientServicesPluginChains.install(requestChain, this, "request");
        }
        if (frontend_common_1.is.not.empty(responseChain)) {
            plugin_chains_itf_1.BaseClientServicesPluginChains.install(responseChain, this, "response");
        }
    }
    // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
    /** 設置 client 當前 stage */
    setStage(stage) {
        switch (stage) {
            case client_itf_1.EClientStage.authUpdated:
            case client_itf_1.EClientStage.authFetched:
            case client_itf_1.EClientStage.authorizing:
                this._stage = stage;
                break;
            case client_itf_1.EClientStage.fetching:
                if (this.stage == client_itf_1.EClientStage.authorizing || this.stage == client_itf_1.EClientStage.authFetched) {
                    return;
                }
                this._stage = stage;
                break;
            case client_itf_1.EClientStage.idle:
                if (this.stage == client_itf_1.EClientStage.authorizing || this.stage == client_itf_1.EClientStage.authFetched) {
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
        var _a, _b, _c, _d;
        try {
            const option = method == "get"
                ? Object.freeze({ method, url, params: data, headers })
                : Object.freeze({ method, url, data, headers });
            responseTransformer !== null && responseTransformer !== void 0 ? responseTransformer : (responseTransformer = (res) => {
                return res.data;
            });
            D.info(["_request, before fetch", option]);
            this.setStage(client_itf_1.EClientStage.fetching);
            const res = await this.axios(option);
            const isValidAxiosResponse = res.data != undefined;
            isValidAxiosResponse
                ? D.info(["_request, after fetch, with response", option])
                : D.info(["_request, after fetch, no data response", option]);
            this.setStage(client_itf_1.EClientStage.idle);
            return responseTransformer(res);
        }
        catch (e) {
            this.setStage(client_itf_1.EClientStage.idle);
            if (e == undefined) {
                console.error(`Network Error: url - ${url}, method - ${method}`);
                const code = undefined;
                throw new axios_1.default.AxiosError("Network Error", code, config);
            }
            else if (e.isAxiosError) {
                const error = e;
                const msg = {
                    message: error.message,
                    response: error.response,
                    requestConfig: {
                        method: (_a = error.config) === null || _a === void 0 ? void 0 : _a.method,
                        url: (_b = error.config) === null || _b === void 0 ? void 0 : _b.url,
                        params: (_c = error.config) === null || _c === void 0 ? void 0 : _c.params,
                        data: (_d = error.config) === null || _d === void 0 ? void 0 : _d.data
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
        return this._request(method, url, Object.freeze(data), headers !== null && headers !== void 0 ? headers : {}, (response) => {
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
        (0, frontend_common_1.assert)(() => this.authClient != undefined && this.authClient.requester != undefined, "axios client for authorization not initialized properly");
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
exports.BaseClient = BaseClient;
//# sourceMappingURL=base_client_impl.js.map