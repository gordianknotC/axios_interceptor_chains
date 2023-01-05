import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import { IRemoteClientService } from "@/base/itf/remote_client_service_itf";
import type { AxiosResponse } from "axios";

export class AuthResponseGuard 
  extends BaseClientServiceResponsePlugin{
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;

  process(response: AxiosResponse): Promise<AxiosResponse> {
    if (this.canProcess(response)) {
    }
    return super.process(response);
  }

  processError(error: any): any {
    console.log(error);
    return super.processError(error);
  }
}
