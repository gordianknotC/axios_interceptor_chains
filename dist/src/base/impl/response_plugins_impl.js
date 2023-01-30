import { assert } from "@gdknot/frontend_common";
import { BaseClientServicesPluginChains, processResponseFulFill, processResponseReject, } from "../itf/plugin_chains_itf";
/** 所有 response chain 均繼承 {@link BaseClientServiceResponsePlugin} */
export class BaseClientServiceResponsePlugin extends BaseClientServicesPluginChains {
    constructor() {
        super();
        assert(() => this.assertCanAssemble() == undefined, ``);
    }
    /** resolve response 並且繼續下一個 response fulfill chain */
    resolve(configOrResponse) {
        return processResponseFulFill(configOrResponse, this.next);
    }
    /** resolve response 不執行於此後的 chain */
    resolveAndIgnoreAll(configOrResponse) {
        return Promise.resolve(configOrResponse);
    }
    /** reject response 並且繼續下一個 response reject chain */
    reject(input) {
        return processResponseReject(input, this.next);
    }
    /** reject response 不執行於此後的 chain */
    rejectAndIgnoreAll(input) {
        return Promise.reject(input);
    }
    // todo: -------- 
    assertCanAssemble() {
        return undefined;
    }
    /**
     * 決定是否能夠進行 next chain
     * @returns - default: true */
    canGoNext(config) {
        return super.canGoNext(config);
    }
    /**
     * 決定是否能夠進行至 {@link processFulFill}
     * @returns - default: true */
    canProcessFulFill(response) {
        return super.canProcessFulFill(response);
    }
    /**
     * 決定是否能夠進行至 {@link processReject}
     * @returns - default: true */
    canProcessReject(error) {
        return super.canProcessReject(error);
    }
    /**
     * axios response interceptor onFulFill 時執行,
     * 覆寫請記得 call super，不然 responsibility chain 不會繼續
     * - call super: 繼續 responsibility chain
     * - 不 call super: 中斷 responsibility chain
     * - 若 Promise.reject, axios返回錯
     * - 若 Promise.resolve, axios不返回錯
     */
    processFulFill(response) {
        return processResponseFulFill(response, this.next);
    }
    /**
     * axios response interceptor onReject 時執行,
     * 覆寫請記得 call super，不然 responsibility chain 不會繼續
     * - call super: 繼續 responsibility chain
     * - 不 call super: 中斷 responsibility chain
     * - 若 Promise.reject, axios返回錯
     * - 若 Promise.resolve, axios不返回錯
     */
    processReject(error) {
        return processResponseReject(error, this.next);
    }
}
//# sourceMappingURL=response_plugins_impl.js.map