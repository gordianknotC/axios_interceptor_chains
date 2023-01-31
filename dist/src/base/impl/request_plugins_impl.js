"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClientServiceRequestPlugin = void 0;
const frontend_common_1 = require("@gdknot/frontend_common");
const plugin_chains_itf_1 = require("../itf/plugin_chains_itf");
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * 所有 request chain 均繼承 {@link BaseClientServiceRequestPlugin} */
class BaseClientServiceRequestPlugin extends plugin_chains_itf_1.BaseClientServicesPluginChains {
    constructor() {
        super();
        (0, frontend_common_1.assert)(() => this.assertCanAssemble() == undefined, ``);
    }
    /** resolve request 並且繼續下一個 request fulfill chain */
    resolve(configOrResponse) {
        return (0, plugin_chains_itf_1.processRequestFulFill)(configOrResponse, this.next);
    }
    /** resolve request 並結束整個 request chain */
    resolveAndIgnoreAll(configOrResponse) {
        return Promise.resolve(configOrResponse);
    }
    /** reject request 並且繼續下一個 request reject chain */
    reject(input) {
        return (0, plugin_chains_itf_1.processRequestReject)(input, this.next);
    }
    /** reject request 不執行於此後的 chain */
    rejectAndIgnoreAll(input) {
        return Promise.reject(input);
    }
    assertCanAssemble() {
        return undefined;
    }
    canGoNext(config) {
        return super.canGoNext(config);
    }
    /**
     * 決定是否能夠進行至 {@link processFulFill}
     * default: true */
    canProcessFulFill(config) {
        return super.canProcessFulFill(config);
    }
    /**
     * 決定是否能夠進行至 {@link processReject}
     * default: true */
    canProcessReject(error) {
        return super.canProcessReject(error);
    }
    /**
     * axios request interceptor onFulFill 時執行，
     * 覆寫請記得 call super，不然 responsibility chain 不會繼續
     * - call super: 繼續 responsibility chain
     * - 不 call super: 中斷 responsibility chain
     * - 若 Promise.reject, axios返回錯
     * - 若 Promise.resolve, axios不返回錯
     */
    processFulFill(config) {
        return (0, plugin_chains_itf_1.processRequestFulFill)(config, this.next);
    }
    /**
     * axios request interceptor onReject 時執行,
     * 覆寫請記得 call super，不然 responsibility chain 不會繼續
     * - call super: 繼續 responsibility chain
     * - 不 call super: 中斷 responsibility chain
     * - 若 Promise.reject, axios返回錯
     * - 若 Promise.resolve, axios不返回錯
     */
    processReject(error) {
        return (0, plugin_chains_itf_1.processRequestReject)(error, this.next);
    }
}
exports.BaseClientServiceRequestPlugin = BaseClientServiceRequestPlugin;
//# sourceMappingURL=request_plugins_impl.js.map