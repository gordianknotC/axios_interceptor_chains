import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { AxiosConfigHeader, BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import type {
  DataResponse,
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { NotImplementedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig } from "axios";
import {merge} from "merge-anything"


/** 用來 UpdateRequest Configuration */
export class BaseRequestHeaderUpdater<
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
  enable(){
    this._enabled = true;
  }
  disable(){
    this._enabled = false;
  }
  protected appendRequestHeader(): any {
    throw new NotImplementedError("getRequestHeader");
  }
  canProcess(config: AxiosRequestConfig<any>): boolean {
    if (this._enabled)
      return super.canProcess(config);
    return false;
  }
  process(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    const header = config.headers as any as AxiosConfigHeader;
    config.headers = merge(header, this.appendRequestHeader());
    console.log("return processed header:", this.appendRequestHeader(), JSON.stringify(config.headers));
    return super.process(config);
  }
  canProcessError(error: AxiosError<unknown, any>): boolean {
    return false;
  }
}

export class UpdateAuthHeaderPlugin<
  RESPONSE extends DataResponse<any>,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderUpdater<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private tokenGetter: ()=>string
  ){
    super();
  }
  protected appendRequestHeader(): Partial<AxiosConfigHeader> {
    return {
      common: {
        Authorization: this.tokenGetter(),
      },
    };
  }
}

export class UpdateExtraHeaderPlugin<
  RESPONSE extends DataResponse<any>,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderUpdater<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private headerGetter: ()=>any
  ){
    super();
  }
  protected appendRequestHeader() {
    console.log("this.headerGetter:", this.headerGetter());
    return {
      ...this.headerGetter(),
    };
  }
}




