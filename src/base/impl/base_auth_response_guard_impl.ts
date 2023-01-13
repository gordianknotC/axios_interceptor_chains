import { QueueRequest } from "@/presets/auth_response_guard";
import { wait } from "@/utils/common_utils";
import { Completer, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import axios, { AxiosResponse, AxiosError } from "axios";
import { IRemoteClientService, EClientStage } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";

export class BaseAuthResponseGuard extends BaseClientServiceResponsePlugin {
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;

  private _stage: EClientStage;
  get stage() {
    return this._stage;
  }

  constructor() {
    super();
    this._stage = EClientStage.idle;
  }

  protected onAuthError(response: AxiosResponse): AxiosResponse {
    console.log("onAuthError");
    const action = this.client!.authOption.redirect(response) ?? {
      clearQueue: true,
    };
    if (action.clearQueue) this.client?.queue.clearQueue();
    return response;
  }

  protected async onAuthSuccess(
    response: AxiosResponse,
    queueItem: Completer<any, QueueItem>
  ): Promise<AxiosResponse> {
    if (this.client!.queue.isEmpty) return Promise.resolve(response);
    console.log("onAuthSuccess");
    const allFutures: Completer<any>[] = [];
    for (let index = 0; index < this.client!.queue.queue.length; index++) {
      const completer = this.client!.queue.queue[index];
      const id = completer._meta!.id;
      this.client!.requestByConfig(
        (completer._meta!.meta as QueueRequest).requestConfig
      ).then((_) => {
        this.client!.queue.dequeueByResult({ id, result: _ });
      });
    }
    console.log("onAuthSuccess, return future:", queueItem);
    return queueItem.future as Promise<AxiosResponse>;
  }

  protected onAuthUnexpectedReturn(response: AxiosResponse): AxiosResponse {
    return response;
  }

  protected onBeforeRequestNewAuth(error: AxiosError): Completer<any, QueueItem>{
    const requestConfig = error.config!;
    console.log("enqueue request:", requestConfig);
    const timeout = this.client!.client.defaults.timeout ?? 10 * 1000;
    const item = this.client?.queue.enqueueWithoutId(() => {
      return wait(timeout);
    })!;
    (item!._meta!.meta as QueueRequest) = { requestConfig };
    return item;
  }

  protected onRequestNewAuth(error: AxiosError,  pendingRequest: Completer<any, QueueItem>): Promise<AxiosResponse>{
    return this.client!.auth();
  }

  canGoNext(config: AxiosResponse<any, any>): boolean {
    return true;
  }
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return false;
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return error.response?.status == axios.HttpStatusCode.Unauthorized;
  }

  async processReject(error: AxiosError): Promise<AxiosResponse | AxiosError> {
    try {
      const pending = this.onBeforeRequestNewAuth(error);
      const authResponse = await this.onRequestNewAuth(error, pending);
      if (this.client?.isErrorResponse(authResponse)) {
        this.onAuthError(error.response!);
        return super.processReject(error);
      } else if (this.client?.isDataResponse(authResponse)) {
        // 這裡 processFulFill, 走 FullFill 的 chain
        return super.processFulFill(
          await this.onAuthSuccess(error.response!, pending)
        );
      } else {
        console.error(
          new UnExpectedError(`
            authorization request returns an unexpected response: ${JSON.stringify(
              authResponse
            )}
          `)
        );
        this.onAuthUnexpectedReturn(authResponse);
        return super.processReject(error);
      }
    } catch (e) {
      // fixme: 這裡是要 throw 還是 super.processReject
      // need further testing
      throw e;
    }
  }
}
