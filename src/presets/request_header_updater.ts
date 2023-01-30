import { BaseRequestHeaderGuard } from "~/base/impl/base_request_guard";
import { AxiosHeaders } from "axios";
import { assert } from "console";

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
export class AuthRequestHeaderUpdater<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    /** 使用者自定義 AuthToken 參照*/
    public tokenGetter: ()=>string
  ){
    super();
  }
  /** 
   * 用來返回慾更新寫入 AxiosRequestConfig 的 header 
   * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>, 
   * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
  */
  protected appendRequestHeader():  RawAxiosHeaders{
    assert(()=>this.tokenGetter() != undefined, "unexpected tokenGetter returns");
    return {
      Authorization: this.tokenGetter(),
    }
  }
}

export class ExtraRequestHeaderUpdater<
  RESPONSE  ,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private headerGetter: ()=>RawAxiosHeaders
  ){
    super();
  }
  /** 
   * 用來返回慾更新寫入 AxiosRequestConfig 的 header 
   * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>, 
   * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
  */
  protected appendRequestHeader(): RawAxiosHeaders {
    return this.headerGetter();
  }
}




