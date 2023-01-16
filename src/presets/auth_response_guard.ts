import { BaseAuthResponseGuard, BaseAuthResponseGuardForAuthClient } from "@/base/impl/base_auth_response_guard_impl";
import { BaseClientServicesPluginChains } from "@/base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import {
  EClientStage,
  IBaseClient,
} from "@/base/itf/client_itf";
import { wait } from "@/utils/common_utils";
import { Completer, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";



export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
  client?: IBaseClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;

  canProcessReject(error: AxiosError<unknown, any>): boolean {
    const status = error.response!.status;
    return status == axios.HttpStatusCode.Forbidden;
  }
}

 
export class AuthResponseGuard extends BaseAuthResponseGuard {
  protected onRequestNewAuth(error: AxiosError,  pendingRequest: Completer<any, QueueItem>): Promise<AxiosResponse>{
    return super.onRequestNewAuth(error, pendingRequest);
  }
}


export class AuthResponseGuardForAuthClient extends BaseAuthResponseGuardForAuthClient {
 
}
