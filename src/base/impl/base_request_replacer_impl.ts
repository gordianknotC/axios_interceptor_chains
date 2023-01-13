import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { AxiosConfigHeader, BaseClientServiceRequestPlugin } from "@/base/impl/request_plugins_impl";
import {
  EClientStage,
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { assert, NotImplementedError } from "@gdknot/frontend_common";
import { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import { BaseRequestGuard } from "./base_request_header_updater_impl";

/** 用來 UpdateRequest Configuration */
export class BaseRequestReplacer<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestGuard<
  RESPONSE,
  ERROR,
  SUCCESS
> {
  static errorMessageForReplacement: string = "BaseRequestReplacer.replaceRequest";

  canProcessFulFill(config: AxiosRequestConfig<any>): boolean {
    return this.client!.stage == EClientStage.authorizing;
  }
  processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    throw new AxiosError(BaseRequestReplacer.errorMessageForReplacement)
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return this.client!.stage == EClientStage.authorizing 
      && error.message == BaseRequestReplacer.errorMessageForReplacement;
  }
  processReject(error: AxiosError<unknown, any>): Promise<any> {
    return this.newRequest(error.config!);
  }
  protected newRequest(config: AxiosRequestConfig): Promise<any>{
    throw new NotImplementedError();
  }
}