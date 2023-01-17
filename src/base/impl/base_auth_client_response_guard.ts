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
