import { BaseAuthResponseGuard } from "@/base/impl/base_auth_response_guard";
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
import { AuthClientResponseGuard } from "@/base/impl/base_auth_client_response_guard";
import { BaseRequestReplacer } from "..";
import { ACAuthResponseGuard } from "./auth_client_guards";
import { ErrorResponse } from "@/../__tests__/setup/client.test.setup";



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
  protected onRequestNewAuth(error: AxiosError,  ): Promise<AxiosResponse>{
    return super.onRequestNewAuth(error);
  }

  protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>{
    return super.onRestoreRequest(error);
  }

  processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
    //if (this.isDirtiedBy(error, ACAuthResponseGuard.name)){
    if ((error.config as any).headers["__chain_action__"] == ACAuthResponseGuard.configActionName){
      console.log("processReject - requests from ACAuthGuard")
      return Promise.reject(error);
    }
    //FIXME: 改為 this.nextChain(error);
    return super.processReject(error);
  }
 
  /** 
   * @returns - 
   * error.response?.status == axios.HttpStatusCode.Unauthorized
      || error.message == BaseRequestReplacer.errorMessageForReplacement;
   */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    const isUnAuthorizedResponse = error.response?.status == axios.HttpStatusCode.Unauthorized;
    const isRaisedFromRequestReplacer = error.message == BaseRequestReplacer.configActionName;
    return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
  }
}


