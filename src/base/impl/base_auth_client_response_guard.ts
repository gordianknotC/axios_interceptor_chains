import { AsyncQueue, Completer, Logger, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import axios, { AxiosResponse, AxiosError } from "axios";
import { IBaseClient, EClientStage, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";



export class AuthClientResponseGuard 
  extends BaseClientServiceResponsePlugin<IBaseAuthClient<any, any, any>> 
{
  client?: IBaseAuthClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;

  get isAuthorizing(): boolean{
    return this.client!.hostClient!.stage == EClientStage.authorizing;
  }
  get isFetched(): boolean{
    return this.client!.hostClient!.stage == EClientStage.authFetched;
  }
  get isUpdated(): boolean{
    return this.client!.hostClient!.stage == EClientStage.authUpdated;
  }
  get hasQueue(): boolean{
    return !this.client!.hostClient!.queue.isEmpty;
  }
  get host(): IBaseClient<any, any, any>{
    return this.client!.hostClient!;
  }
  get queue(): AsyncQueue<QueueRequest>{
    return this.client!.hostClient!.queue;
  }
  constructor() {
    super();
  }
}
export class AuthClientStageMarker extends AuthClientResponseGuard{
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return false;
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return false;
  }
  processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>> {
    throw new UnExpectedError("");
  }
  processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
    throw new UnExpectedError("");
  }
}
