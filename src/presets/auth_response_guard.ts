import { BaseAuthResponseGuard } from "~/base/impl/base_auth_response_guard";
import { BaseClientServicesPluginChains, ChainActionStage } from "~/base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "~/base/impl/response_plugins_impl";
import {
  IBaseClient,
} from "~/base/itf/client_itf";
import { Completer, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { RequestReplacer } from "~/presets/request_replacer";
import { ACAuthResponseGuard } from "~/presets/auth_client_guards";




export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
  client?: IBaseClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;

  canProcessReject(error: AxiosError<unknown, any>): boolean {
    const status = error.response!.status;
    return status == axios.HttpStatusCode.Forbidden;
  }
}

 
/**{@inheritdoc} BaseAuthResponseGuard */
export class AuthResponseGuard extends BaseAuthResponseGuard {
  
  protected onRequestNewAuth(error: AxiosError,  ): Promise<AxiosResponse>{
    return super.onRequestNewAuth(error);
  }

  protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>{
    return super.onRestoreRequest(error);
  }

  processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
    if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)){
      return this.rejectAndIgnoreAll(error);
    }
    return this.reject(error);
  }
 
  /** 
   * @returns - 用來攔截以下二種情況
   * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
   */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    const isUnAuthorizedResponse = error.response?.status == axios.HttpStatusCode.Unauthorized;
    const isRaisedFromRequestReplacer = this.isDirtiedBy(error, RequestReplacer.name);
    return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
  }
}


