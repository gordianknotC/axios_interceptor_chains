import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { AxiosConfigHeader, BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import type {
  DataResponse,
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { NotImplementedError } from "@gdknot/frontend_common";
import type { AxiosRequestConfig } from "axios";
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

  protected getRequestHeader(): any {
    throw new NotImplementedError("getRequestHeader");
  }

  process(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    const header = config.headers as any as AxiosConfigHeader;
    merge(header, this.getRequestHeader());
    return super.process(config);
  }

  processError(error: any): Promise<any> {
    return super.processError(error);
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
  processError(error: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  protected getRequestHeader(): Partial<AxiosConfigHeader> {
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
  processError(error: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  protected getRequestHeader() {
    return {
      ...this.headerGetter(),
    };
  }
}

