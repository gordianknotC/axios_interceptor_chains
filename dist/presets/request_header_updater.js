import { BaseRequestHeaderGuard } from "../base/impl/base_request_guard_impl";
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
export class UpdateAuthHeaderPlugin extends BaseRequestHeaderGuard {
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
        return {
            Authorization: this.tokenGetter(),
        };
    }
}
export class UpdateExtraHeaderPlugin extends BaseRequestHeaderGuard {
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
//# sourceMappingURL=request_header_updater.js.map