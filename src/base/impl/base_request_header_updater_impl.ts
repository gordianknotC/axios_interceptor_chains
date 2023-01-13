import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import {
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { NotImplementedError } from "@gdknot/frontend_common";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

export class BaseRequestGuard<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseClientServiceRequestPlugin {
  client?: IRemoteClientService<RESPONSE, ERROR, SUCCESS>;
  prev?: BaseClientServicesPluginChains<
    AxiosRequestConfig<any>,
    AxiosRequestConfig<any>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosRequestConfig<any>,
    AxiosRequestConfig<any>
  >;
  _enabled: boolean = true;

  constructor(){
    super();
  }
  enable(){
    this._enabled = true;
  }
  disable(){
    this._enabled = false;
  }
  canProcessFulFill(config: AxiosRequestConfig<any>): boolean {
    if (!this._enabled)
      return false;
    return super.canProcessFulFill(config);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    if (!this._enabled)
      return false
    return super.canProcessReject(error);
  }
}

/** 用來 UpdateRequest Configuration */
export class BaseRequestHeaderGuard<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestGuard<
  RESPONSE,
  ERROR,
  SUCCESS
> {
  constructor(){
    super();
  }
  protected appendRequestHeader(): RawAxiosHeaders {
    throw new NotImplementedError("getRequestHeader");
  }
  processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    const header = config.headers as AxiosHeaders;
    const appendedHeader = this.appendRequestHeader();
    header.set(appendedHeader);
    return super.processFulFill(config);
  }
}