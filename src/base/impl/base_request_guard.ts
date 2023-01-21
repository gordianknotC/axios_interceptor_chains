import { BaseClientServicesPluginChains } from "@/base/itf/plugin_chains_itf";
import { BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import { IBaseClient } from "@/base/itf/client_itf";
import { Logger, NotImplementedError } from "@gdknot/frontend_common";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import { LogModules } from "@/setup/logger.setup";

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
    return super.processFulFill(config);
  }
}
