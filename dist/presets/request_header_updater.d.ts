import { BaseRequestHeaderGuard } from "../base/impl/base_request_guard_impl";
import { AxiosHeaders } from "axios";
export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
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
export declare class UpdateAuthHeaderPlugin<RESPONSE, ERROR, SUCCESS> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
    /** 使用者自定義 AuthToken 參照*/
    private tokenGetter;
    constructor(
    /** 使用者自定義 AuthToken 參照*/
    tokenGetter: () => string);
    /**
     * 用來返回慾更新寫入 AxiosRequestConfig 的 header
     * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
     * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
    */
    protected appendRequestHeader(): RawAxiosHeaders;
}
export declare class UpdateExtraHeaderPlugin<RESPONSE, ERROR, SUCCESS> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
    private headerGetter;
    constructor(headerGetter: () => RawAxiosHeaders);
    /**
     * 用來返回慾更新寫入 AxiosRequestConfig 的 header
     * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
     * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
    */
    protected appendRequestHeader(): RawAxiosHeaders;
}
