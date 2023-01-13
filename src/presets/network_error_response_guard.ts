import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import { IRemoteClientService } from "@/base/itf/remote_client_service_itf";
import { AxiosError, AxiosResponse } from "axios";



export class NetworkErrorResponseGuard
  extends BaseClientServiceResponsePlugin {
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<
    AxiosResponse, Promise<AxiosResponse>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosResponse, Promise<AxiosResponse>
  >;
  constructor(public networkErrorHandler: (error: AxiosError) => void) {
    super();
  }

  //
  //  processFulFill
  //
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return false;
  }
  //
  //  process error
  //
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    try {
      return error.message.toLowerCase() == "network error";
    } catch (e) {
      console.error("Exception on canProcessReject, error:", error);
      return false;
    }
  }
  processReject(error: AxiosError<unknown, any>): Promise<any> {
    this.networkErrorHandler(error);
    return super.processReject(error);
  }
}
