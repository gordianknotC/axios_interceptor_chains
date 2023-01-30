"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClientServicesPluginChains = exports.processRequestReject = exports.processRequestFulFill = exports.processResponseReject = exports.processResponseFulFill = exports.ChainActionStage = void 0;
const logger_setup_1 = require("../../setup/logger.setup");
const common_utils_1 = require("../../utils/common_utils");
const frontend_common_1 = require("@gdknot/frontend_common");
const D = new frontend_common_1.Logger(logger_setup_1.LogModules.Plugin);
const byPassAll = false;
var ChainActionStage;
(function (ChainActionStage) {
    ChainActionStage[ChainActionStage["processRequest"] = 0] = "processRequest";
    ChainActionStage[ChainActionStage["processResponse"] = 1] = "processResponse";
    ChainActionStage[ChainActionStage["rejectRequest"] = 2] = "rejectRequest";
    ChainActionStage[ChainActionStage["rejectResponse"] = 3] = "rejectResponse";
    ChainActionStage[ChainActionStage["canProcessRequest"] = 4] = "canProcessRequest";
    ChainActionStage[ChainActionStage["canProcessResponse"] = 5] = "canProcessResponse";
    ChainActionStage[ChainActionStage["canRejectRequest"] = 6] = "canRejectRequest";
    ChainActionStage[ChainActionStage["canRejectResponse"] = 7] = "canRejectResponse";
})(ChainActionStage = exports.ChainActionStage || (exports.ChainActionStage = {}));
var EMethod;
(function (EMethod) {
    EMethod["processFulFill"] = "processFulFill";
    EMethod["canProcessFulFill"] = "canProcessFulFill";
    EMethod["processReject"] = "processReject";
    EMethod["canProcessReject"] = "canProcessReject";
})(EMethod || (EMethod = {}));
function isAxiosError(input) {
    return input.isAxiosError != undefined;
}
function isAxiosResponse(input) {
    return input.status != undefined;
}
function isAxiosConfig(input) {
    return !isAxiosError(input) && !isAxiosResponse(input);
}
function onStage(chain, input, method) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    chain.setStage(input, method);
    const ret = chain[method](input);
    switch (method) {
        case EMethod.processFulFill:
            (_b = (_a = chain)._onProcess) === null || _b === void 0 ? void 0 : _b.call(_a, input);
            break;
        case EMethod.canProcessFulFill:
            (_d = (_c = chain)._onCanProcess) === null || _d === void 0 ? void 0 : _d.call(_c, input);
            break;
        case EMethod.processReject:
            (_f = (_e = chain)._onProcessReject) === null || _f === void 0 ? void 0 : _f.call(_e, input);
            break;
        case EMethod.canProcessReject:
            (_h = (_g = chain)._onCanProcessReject) === null || _h === void 0 ? void 0 : _h.call(_g, input);
            break;
        default:
            break;
    }
    return ret;
}
//
//    R E S P O N S E 
//
//
function processResponseFulFill(response, chain) {
    if (!chain)
        return Promise.resolve(response); // 結束責任鍊
    if ((0, common_utils_1.ensureCanProcessFulFill)(() => onStage(chain, response, EMethod.canProcessFulFill))) {
        return onStage(chain, response, EMethod.processFulFill); // chain
    }
    else {
        if (chain.next && chain.canGoNext(response.config)) {
            return processResponseFulFill(response, chain.next); // next chain
        }
        return processResponseFulFill(response, undefined);
    }
}
exports.processResponseFulFill = processResponseFulFill;
function processResponseReject(error, chain) {
    var _a, _b;
    if (!chain)
        return Promise.reject(error);
    if ((0, common_utils_1.ensureCanReject)(() => {
        var _a, _b;
        const canGo = onStage(chain, error, EMethod.canProcessReject);
        D.info([chain.constructor.name, "Response.canProcessReject", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers, , canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Response.processReject", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers,]);
        return onStage(chain, error, EMethod.processReject);
        ;
    }
    else {
        if (chain.next && chain.canGoNext(error.config)) {
            return processResponseReject(error, chain.next);
        }
        return processResponseReject(error, undefined);
    }
}
exports.processResponseReject = processResponseReject;
function onResponseFulFilled(chain) {
    return (response) => {
        var _a;
        D.current(["Start FulFull Response Chain", chain.constructor.name, (_a = response.config) === null || _a === void 0 ? void 0 : _a.url, "with response:\n", response.data]);
        if (byPassAll)
            return Promise.resolve(response);
        return processResponseFulFill(response, chain);
    };
}
function onResponseError(chain) {
    return (error) => {
        var _a;
        D.current(["Start Reject Response Chain", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url]);
        if (byPassAll)
            return Promise.reject(error.response);
        return processResponseReject(error, chain);
    };
}
//
//
//       R E Q U E S T
//
//
//
function processRequestFulFill(config, chain) {
    if (!chain)
        return config;
    if ((0, common_utils_1.ensureCanProcessFulFill)(() => {
        const canGo = onStage(chain, config, EMethod.canProcessFulFill);
        D.info([chain.constructor.name, "Request.canProcessFulFill", config.url, config.headers, canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Request.processFulFill", config.url, config.headers,]);
        return onStage(chain, config, EMethod.processFulFill);
    }
    else {
        if (chain.next && chain.canGoNext(config))
            return processRequestFulFill(config, chain.next);
        return processRequestFulFill(config, undefined);
    }
}
exports.processRequestFulFill = processRequestFulFill;
function processRequestReject(error, chain) {
    var _a, _b;
    if (!chain)
        return Promise.reject(error);
    if ((0, common_utils_1.ensureCanReject)(() => {
        var _a, _b;
        const canGo = onStage(chain, error, EMethod.canProcessReject);
        D.info([chain.constructor.name, "Request.canProcessReject", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers, canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Request.processReject", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers]);
        return onStage(chain, error, EMethod.processReject);
    }
    else {
        if (chain.next && chain.canGoNext(error.config))
            return processRequestReject(error, chain.next);
        return processRequestReject(error, undefined);
    }
}
exports.processRequestReject = processRequestReject;
function onRequestFulFilled(chain) {
    return (config) => {
        D.current(["Start FulFull Request Chain", chain.constructor.name, config === null || config === void 0 ? void 0 : config.url]);
        if (byPassAll)
            return config;
        return processRequestFulFill(config, chain);
    };
}
function onRequestError(chain) {
    return (error) => {
        var _a, _b;
        D.current(["Start Reject Request Chain", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers]);
        if (byPassAll)
            return Promise.reject(error.response);
        return processRequestReject(error, chain);
    };
}
// export abstract class PluginChainActionRegistry {
//   abstract name: string;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
// }
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 * @typeParam CLIENT - client 型別
 */
class BaseClientServicesPluginChains {
    /** instal request/response responsibility chain
    * @see {@link BaseClient}
    * @example - 於 BaseClient 內部
    ```ts
       if (is.not.empty(requestChain)){
          BaseClientServicesPluginChains.install(requestChain, this, "request");
       }
       if (is.not.empty(responseChain)){
          BaseClientServicesPluginChains.install(responseChain, this, "response");
       }
    ```
    */
    static install(chain, client, interceptors) {
        (0, frontend_common_1.assert)(() => chain.length >= 1);
        const masterChain = chain[0];
        const tail = chain.slice(1);
        masterChain.init(client);
        if (tail.length >= 1) {
            masterChain.addAll(tail);
        }
        if (interceptors == "response") {
            client.axios.interceptors.response.use(onResponseFulFilled(masterChain), onResponseError(masterChain));
        }
        else {
            client.axios.interceptors.request.use(onRequestFulFilled(masterChain), onRequestError(masterChain));
        }
    }
    constructor() { }
    /** 增加下一個 chain */
    addNext(next) {
        (0, frontend_common_1.assert)(() => this.client != undefined, "undefined client");
        this.next = next;
        next.prev = this;
        next.init(this.client);
    }
    /** 增加上一個 chain */
    addPrev(prev) {
        (0, frontend_common_1.assert)(() => this.client != undefined, "undefined client");
        this.prev = prev;
        prev.next = this;
        prev.init(this.client);
    }
    addAll(_all) {
        (0, frontend_common_1.assert)(() => this.client != undefined, "undefined client");
        const allSerial = [this, ..._all];
        for (let i = 0; i < allSerial.length - 1; i++) {
            const next = allSerial[i + 1];
            if (next)
                allSerial[i].addNext(next);
        }
    }
    /** default: true */
    canGoNext(config) {
        return this.next != undefined;
    }
    /** default: true */
    canProcessFulFill(config) {
        return true;
    }
    /** default: true */
    canProcessReject(error) {
        return true;
    }
    setStage(input, method) {
        switch (method) {
            case EMethod.processFulFill:
                this.stage = isAxiosConfig(input)
                    ? ChainActionStage.processRequest
                    : ChainActionStage.processResponse;
                break;
            case EMethod.canProcessFulFill:
                this.stage = isAxiosConfig(input)
                    ? ChainActionStage.canProcessRequest
                    : ChainActionStage.canProcessResponse;
                break;
            case EMethod.processReject:
                this.stage = isAxiosConfig(input)
                    ? ChainActionStage.rejectRequest
                    : ChainActionStage.rejectResponse;
                break;
            case EMethod.canProcessReject:
                this.stage = isAxiosConfig(input)
                    ? ChainActionStage.canRejectRequest
                    : ChainActionStage.canRejectResponse;
                break;
            default:
                break;
        }
    }
    /** {@link AxiosResponse}|{@link AxiosError} 轉換為 {@link axiosConfig} */
    toAxiosConfig(input) {
        return isAxiosConfig(input)
            ? input
            : isAxiosError(input)
                ? input.config
                : isAxiosResponse(input)
                    ? input.config
                    : (function () { throw new Error(); })();
    }
    /**
     * 以當前的物件名稱及 {@link ChanActionStage} 註記於 {@link AxiosRequestConfig}.header
     * 中, 用於當 RequestChain / ResponseChain 轉發流程時，得以透過 header 得知該流程由哪裡轉發而來
     * @example
     * reject 當前 request, 並標記於 header 中, 好讓其他 chain 能夠知道這個 AxiosError
     * 是由哪一個 chain reject 而來
     * ```ts
      // RequestChain
      protected switchIntoRejectResponse(config: AxiosRequestConfig, ident:string){
        this.markDirty(config);
        const stage = this.stage!;
        const axiosError: AxiosError = {
          isAxiosError: false,
          toJSON: function (): object {
            return axiosError;
          },
          name: ident,
          message: ident,
          config
        };
        return Promise.reject(axiosError) as any;
      }
      // ResponseChain
      processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
        if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)){
          console.log("processReject - requests from ACAuthGuard")
          return Promise.reject(error);
        }
        return this.reject(error);
      }
     *
     * ```
     * mark request header as dirty */
    markDirty(input) {
        const config = this.toAxiosConfig(input);
        const name = this.constructor.name;
        config.headers[`__chain_action_${name}__`] = this.stage;
        return config;
    }
    /** read request header to see if it's dirtied or not */
    isDirtiedBy(input, identity, stage) {
        const config = this.toAxiosConfig(input);
        const result = stage
            ? config.headers[`__chain_action_${identity}__`] == stage
            : config.headers[`__chain_action_${identity}__`] != undefined;
        return result;
    }
    onProcess(cb, terminateAfterCall = true) {
        this._onProcess = () => {
            cb();
            if (terminateAfterCall) {
                this._onProcess = undefined;
            }
        };
    }
    onProcessReject(cb, terminateAfterCall = true) {
        this._onProcessReject = () => {
            cb();
            if (terminateAfterCall) {
                this._onCanProcess = undefined;
            }
        };
    }
    onCanProcess(cb, terminateAfterCall = true) {
        this._onCanProcess = () => {
            cb();
            if (terminateAfterCall) {
                this._onCanProcess = undefined;
            }
        };
    }
    onCanProcessReject(cb, terminateAfterCall = true) {
        this._onCanProcessReject = () => {
            cb();
            if (terminateAfterCall) {
                this._onCanProcessReject = undefined;
            }
        };
    }
    init(client) {
        this.client = client;
    }
}
exports.BaseClientServicesPluginChains = BaseClientServicesPluginChains;
//# sourceMappingURL=plugin_chains_itf.js.map