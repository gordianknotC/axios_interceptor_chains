import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { AxiosConfigHeader, BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import {
  DataResponse,
  EClientStage,
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { NotImplementedError } from "@gdknot/frontend_common";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import axios from "axios";
import {merge} from "merge-anything"

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

export class BaseRequestGuard<
  RESPONSE extends DataResponse<any>,
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
  canProcess(config: AxiosRequestConfig<any>): boolean {
    if (this._enabled)
      return super.canProcess(config);
    return false;
  }
  canProcessError(error: AxiosError<unknown, any>): boolean {
    if (this._enabled)
      return true
    return false;
  }
}

/** 用來 UpdateRequest Configuration */
export class BaseRequestHeaderGuard<
  RESPONSE extends DataResponse<any>,
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
  process(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    const header = config.headers as AxiosHeaders;
    const appendedHeader = this.appendRequestHeader();
    header.set(appendedHeader);
    return super.process(config);
  }
}


export class UpdateAuthHeaderPlugin<
  RESPONSE extends DataResponse<any>,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private tokenGetter: ()=>string
  ){
    super();
  }
  protected appendRequestHeader():  RawAxiosHeaders{
    return {
      Authorization: this.tokenGetter(),
    }
  }
}

export class UpdateExtraHeaderPlugin<
  RESPONSE extends DataResponse<any>,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private headerGetter: ()=>any
  ){
    super();
  }
  protected appendRequestHeader(): RawAxiosHeaders {
    return this.headerGetter();
  }
}




