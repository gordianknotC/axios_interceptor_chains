"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraRequestHeaderUpdater = exports.AuthRequestHeaderUpdater = void 0;
const base_request_guard_1 = require("../base/impl/base_request_guard");
const frontend_common_1 = require("@gdknot/frontend_common");
/** 自動將 axios request config 寫入正確的 authorization header
 * @example
 * ```ts
  const requestChain = [
      new UpdateAuthHeaderPlugin(()=>{
        return authorizationStore.token
      })
  ];
  ```
 */
class AuthRequestHeaderUpdater extends base_request_guard_1.BaseRequestHeaderGuard {
    constructor(
    /** 使用者自定義 AuthToken 參照*/
    tokenGetter) {
        super();
        this.tokenGetter = tokenGetter;
    }
    /**
     * 用來返回慾更新寫入 AxiosRequestConfig 的 header
     * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
     * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
    */
    appendRequestHeader() {
        (0, frontend_common_1.assert)(() => this.tokenGetter() != undefined, "unexpected tokenGetter returns");
        return {
            Authorization: this.tokenGetter(),
        };
    }
}
exports.AuthRequestHeaderUpdater = AuthRequestHeaderUpdater;
class ExtraRequestHeaderUpdater extends base_request_guard_1.BaseRequestHeaderGuard {
    constructor(headerGetter) {
        super();
        this.headerGetter = headerGetter;
    }
    /**
     * 用來返回慾更新寫入 AxiosRequestConfig 的 header
     * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
     * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
    */
    appendRequestHeader() {
        return this.headerGetter();
    }
}
exports.ExtraRequestHeaderUpdater = ExtraRequestHeaderUpdater;
//# sourceMappingURL=request_header_updater.js.map