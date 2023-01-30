import { BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import { Logger, NotImplementedError } from "@gdknot/frontend_common";
import { LogModules } from "@/setup/logger.setup";
const D = new Logger(LogModules.HeaderUpdater);
/**
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestGuard extends BaseClientServiceRequestPlugin {
    constructor() {
        super();
        this._enabled = true;
    }
    enable() {
        this._enabled = true;
    }
    disable() {
        this._enabled = false;
    }
    canProcessFulFill(config) {
        if (!this._enabled)
            return false;
        return super.canProcessFulFill(config);
    }
    canProcessReject(error) {
        if (!this._enabled)
            return false;
        return super.canProcessReject(error);
    }
    /** reject request chain 中斷 request chain 進入 response chain 並標記 request header,
     * 這時流程會走到 onReject response chain
     * @example -
     * 替換 request
     ```ts
      // request chain - 流程會轉到 axios.interceptors.response.onReject
      processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
        return this.switchIntoRejectResponse(config, BaseRequestReplacer.name);
      }
      // response chain
      processReject
  
     ```
     * */
    switchIntoRejectResponse(config) {
        this.markDirty(config);
        const ident = this.constructor.name;
        const stage = this.stage;
        const axiosError = {
            isAxiosError: false,
            toJSON: function () {
                return axiosError;
            },
            name: ident,
            message: ident,
            config
        };
        return Promise.reject(axiosError);
    }
}
/** 用來更新 AxiosRequestConfig
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestHeaderGuard extends BaseRequestGuard {
    constructor() {
        super();
    }
    appendRequestHeader() {
        throw new NotImplementedError("getRequestHeader");
    }
    processFulFill(config) {
        const header = config.headers;
        const appendedHeader = this.appendRequestHeader();
        header.set(appendedHeader);
        D.info(["update header:", appendedHeader, "new header:", header]);
        return this.resolve(config);
    }
}
//# sourceMappingURL=base_request_guard.js.map