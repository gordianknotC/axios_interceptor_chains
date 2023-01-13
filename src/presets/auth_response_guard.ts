import { BaseAuthResponseGuard } from "@/base/impl/base_auth_response_guard_impl";
import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import {
  EClientStage,
  IRemoteClientService,
} from "@/base/itf/remote_client_service_itf";
import { wait } from "@/utils/common_utils";
import { Completer, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

export type QueueRequest = {
  requestConfig: AxiosRequestConfig;
};

export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;

  canProcessReject(error: AxiosError<unknown, any>): boolean {
    const status = error.response!.status;
    return status == axios.HttpStatusCode.Forbidden;
  }
}


/**
 * 流程
 * {@link onBeforeRequestNewAuth} > {@link onRequestNewAuth}
 *                                      |
 * -------------------------------------|
 * |                                    |
 * {@link onAuthError}              {@link onAuthSuccess}
 */
export class AuthResponseGuard extends BaseAuthResponseGuard {
  protected onAuthError(response: AxiosResponse): AxiosResponse {
    return super.onAuthError(response);
  }
  protected async onAuthSuccess(
    response: AxiosResponse,
    queueItem: Completer<any, QueueItem>
  ): Promise<AxiosResponse> {
    return super.onAuthSuccess(response, queueItem);
  }
  protected onAuthUnexpectedReturn(response: AxiosResponse): AxiosResponse {
    return super.onAuthUnexpectedReturn(response);
  }
  protected onRequestNewAuth(error: AxiosError,  pendingRequest: Completer<any, QueueItem>): Promise<AxiosResponse>{
    return super.onRequestNewAuth(error, pendingRequest);
  }
}
