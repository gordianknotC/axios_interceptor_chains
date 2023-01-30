import { BaseClientServicesPluginChains } from "~/base/itf/plugin_chains_itf";
import { BaseClientServiceRequestPlugin } from "~/base/impl/request_plugins_impl";
import { IBaseClient } from "~/base/itf/client_itf";
import { ColorConfig, Logger, NotImplementedError } from "@gdknot/frontend_common";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import { LogModules } from "~/setup/logger.setup";

const D = new Logger(LogModules.HeaderUpdater)
export type AxiosHeaderValue =
  | AxiosHeaders
  | string
  | string[]
  | number
  | boolean
  | null;

/** Axios 所定義，為單層物件, 複雜物件可能要轉 JSONString */
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

/**  
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestGuard<
  RESPONSE,
  ERROR,
  SUCCESS
> extends BaseClientServiceRequestPlugin {
  client?: IBaseClient<RESPONSE, ERROR, SUCCESS>;
  prev?: BaseClientServicesPluginChains<
    AxiosRequestConfig<any>,
    AxiosRequestConfig<any>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosRequestConfig<any>,
    AxiosRequestConfig<any>
  >;
  _enabled: boolean = true;

  constructor() {
    super();
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  canProcessFulFill(config: AxiosRequestConfig<any>): boolean {
    if (!this._enabled) return false;
    return super.canProcessFulFill(config);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    if (!this._enabled) return false;
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
  protected switchIntoRejectResponse(config: AxiosRequestConfig){
    this.markDirty(config);
    const ident = this.constructor.name;
    const stage = this.stage!;
    const axiosError: AxiosError = {
      isAxiosError: false,
      toJSON: function (): object {
        return axiosError;
      },
      name: ident,
      message: ident,
      config
    };
    return Promise.reject(axiosError) as any;
  }
}

/** 用來更新 AxiosRequestConfig 
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
*/
export class BaseRequestHeaderGuard<
  RESPONSE,
  ERROR,
  SUCCESS
> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
  constructor() {
    super();
  }
  protected appendRequestHeader(): RawAxiosHeaders {
    throw new NotImplementedError("getRequestHeader");
  }
  processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    const header = config.headers as AxiosHeaders;
    const appendedHeader = this.appendRequestHeader();
    header.set(appendedHeader);
    D.info(["update header:", appendedHeader, "new header:", header])
    return this.resolve(config); 
  }
}
