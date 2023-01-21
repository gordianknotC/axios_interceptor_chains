import { LogModules } from "../../setup/logger.setup";
import { ensureCanProcessFulFill, ensureCanReject } from "../../utils/common_utils";
import { assert, Logger } from "@gdknot/frontend_common";
const D = new Logger(LogModules.Plugin);
var EMethod;
(function (EMethod) {
    EMethod["processFulFill"] = "processFulFill";
    EMethod["canProcessFulFill"] = "canProcessFulFill";
    EMethod["processReject"] = "processReject";
    EMethod["canProcessReject"] = "canProcessReject";
})(EMethod || (EMethod = {}));
const byPassAll = false;
function callMethod(chain, input, method) {
    const ret = chain[method](input);
    switch (method) {
        case EMethod.processFulFill:
            chain._onProcess?.(input);
            break;
        case EMethod.canProcessFulFill:
            chain._onCanProcess?.(input);
            break;
        case EMethod.processReject:
            chain._onProcessReject?.(input);
            break;
        case EMethod.canProcessReject:
            chain._onCanProcessReject?.(input);
            break;
        default: break;
    }
    return ret;
}
//
//    R E S P O N S E 
//
//
export function processResponseFulFill(response, chain) {
    if (!chain)
        return Promise.resolve(response);
    if (ensureCanProcessFulFill(() => {
        const canGo = callMethod(chain, response, EMethod.canProcessFulFill);
        D.info([chain.constructor.name, "Response.canProcessFulFill", response.config.url, response.config.headers, canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Response.processFulFill", response.config.url, response.config.headers,]);
        return callMethod(chain, response, EMethod.processFulFill);
    }
    else {
        if (chain.next && chain.canGoNext(response.config)) {
            return processResponseFulFill(response, chain.next);
        }
        return processResponseFulFill(response, undefined);
    }
}
export function processResponseReject(error, chain) {
    if (!chain)
        return Promise.reject(error);
    if (ensureCanReject(() => {
        const canGo = callMethod(chain, error, EMethod.canProcessReject);
        D.info([chain.constructor.name, "Response.canProcessReject", error.config?.url, error.config?.headers, , canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Response.processReject", error.config?.url, error.config?.headers,]);
        return callMethod(chain, error, EMethod.processReject);
        ;
    }
    else {
        if (chain.next && chain.canGoNext(error.config)) {
            return processResponseReject(error, chain.next);
        }
        return processResponseReject(error, undefined);
    }
}
function onResponseFulFilled(chain) {
    return (response) => {
        D.current(["Start FulFull Response Chain", chain.constructor.name, response.config?.url, "with response:\n", response.data]);
        if (byPassAll)
            return Promise.resolve(response);
        return processResponseFulFill(response, chain);
    };
}
function onResponseError(chain) {
    return (error) => {
        D.current(["Start Reject Response Chain", chain.constructor.name, error.config?.url]);
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
export function processRequestFulFill(config, chain) {
    if (!chain)
        return config;
    if (ensureCanProcessFulFill(() => {
        const canGo = callMethod(chain, config, EMethod.canProcessFulFill);
        D.info([chain.constructor.name, "Request.canProcessFulFill", config.url, config.headers, canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Request.processFulFill", config.url, config.headers,]);
        return callMethod(chain, config, EMethod.processFulFill);
    }
    else {
        if (chain.next && chain.canGoNext(config))
            return processRequestFulFill(config, chain.next);
        return processRequestFulFill(config, undefined);
    }
}
export function processRequestReject(error, chain) {
    if (!chain)
        return Promise.reject(error);
    if (ensureCanReject(() => {
        const canGo = callMethod(chain, error, EMethod.canProcessReject);
        D.info([chain.constructor.name, "Request.canProcessReject", chain.constructor.name, error.config?.url, error.config?.headers, canGo]);
        return canGo;
    })) {
        D.info([chain.constructor.name, "Request.processReject", chain.constructor.name, error.config?.url, error.config?.headers]);
        return callMethod(chain, error, EMethod.processReject);
    }
    else {
        if (chain.next && chain.canGoNext(error.config))
            return processRequestReject(error, chain.next);
        return processRequestReject(error, undefined);
    }
}
function onRequestFulFilled(chain) {
    return (config) => {
        D.current(["Start FulFull Request Chain", chain.constructor.name, config?.url]);
        if (byPassAll)
            return config;
        return processRequestFulFill(config, chain);
    };
}
function onRequestError(chain) {
    return (error) => {
        D.current(["Start Reject Request Chain", chain.constructor.name, error.config?.url, error.config?.headers]);
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
export class BaseClientServicesPluginChains {
    /** instal request/response responsibility chain
     * @see {@link BaseClient}
     * @example - 於 BaseClient 內部
     * ```ts
       if (is.not.empty(requestChain)){
          BaseClientServicesPluginChains.install(requestChain, this, "request");
       }
       if (is.not.empty(responseChain)){
          BaseClientServicesPluginChains.install(responseChain, this, "response");
       }
     * ```
     */
    static install(chain, client, interceptors) {
        assert(() => chain.length >= 1);
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
        assert(() => this.client != undefined, "undefined client");
        this.next = next;
        next.prev = this;
        next.init(this.client);
    }
    /** 增加上一個 chain */
    addPrev(prev) {
        assert(() => this.client != undefined, "undefined client");
        this.prev = prev;
        prev.next = this;
        prev.init(this.client);
    }
    addAll(_all) {
        assert(() => this.client != undefined, "undefined client");
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
//# sourceMappingURL=plugin_chains_itf.js.map