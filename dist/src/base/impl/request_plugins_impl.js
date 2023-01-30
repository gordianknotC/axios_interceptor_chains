import { assert } from "console";
import { BaseClientServicesPluginChains, processRequestFulFill, processRequestReject, } from "../itf/plugin_chains_itf";
/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * 所有 request chain 均繼承 {@link BaseClientServiceRequestPlugin} */
export class BaseClientServiceRequestPlugin extends BaseClientServicesPluginChains {
    constructor() {
        super();
        assert(() => this.assertCanAssemble() == undefined, ``);
    }
    /** resolve request 並且繼續下一個 request fulfill chain */
    resolve(configOrResponse) {
        return processRequestFulFill(configOrResponse, this.next);
    }
    /** resolve request 並結束整個 request chain */
    resolveAndIgnoreAll(configOrResponse) {
        return Promise.resolve(configOrResponse);
    }
    /** reject request 並且繼續下一個 request reject chain */
    reject(input) {
        return processRequestReject(input, this.next);
    }
    /** reject request 不執行於此後的 chain */
    rejectAndIgnoreAll(input) {
        return Promise.reject(input);
    }
    assertCanAssemble() {
        return "";
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
        return processRequestFulFill(config, this.next);
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
        return processRequestReject(error, this.next);
    }
}
//# sourceMappingURL=request_plugins_impl.js.map