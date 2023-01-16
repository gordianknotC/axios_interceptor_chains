import { ensureCanProcessFulFill, ensureCanReject } from "../../utils/common_utils";
import { assert } from "@gdknot/frontend_common";
const byPassAll = false;
//
//    R E S P O N S E 
//
//
export function processResponseFulFill(response, chain) {
    if (!chain)
        return Promise.resolve(response);
    if (ensureCanProcessFulFill(() => chain.canProcessFulFill(response))) {
        return chain.processFulFill(response);
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
    if (ensureCanReject(() => chain.canProcessReject(error))) {
        return chain.processReject(error);
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
        if (byPassAll)
            return Promise.resolve(response);
        return processResponseFulFill(response, chain);
    };
}
function onResponseError(chain) {
    return (error) => {
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
    if (ensureCanProcessFulFill(() => chain.canProcessFulFill(config))) {
        return chain.processFulFill(config);
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
    if (ensureCanReject(() => chain.canProcessReject(error))) {
        return chain.processReject(error).catch((e) => {
            console.error("catch on processError", e);
            return Promise.reject(e);
        });
    }
    else {
        if (chain.next && chain.canGoNext(error.config))
            return processRequestReject(error, chain.next);
        return processRequestReject(error, undefined);
    }
}
function onRequestFulFilled(chain) {
    return (config) => {
        if (byPassAll)
            return config;
        return processRequestFulFill(config, chain);
    };
}
function onRequestError(chain) {
    return (error) => {
        if (byPassAll)
            return Promise.reject(error.response);
        return processRequestReject(error, chain);
    };
}
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
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
            client.client.interceptors.response.use(onResponseFulFilled(masterChain), onResponseError(masterChain));
        }
        else {
            client.client.interceptors.request.use(onRequestFulFilled(masterChain), onRequestError(masterChain));
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
    init(client) {
        this.client = client;
    }
}
//# sourceMappingURL=plugin_chains_impl.js.map