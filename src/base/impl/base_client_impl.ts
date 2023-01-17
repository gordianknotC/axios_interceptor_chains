import { EClientStage, IBaseClient as IBaseClient, ClientAuthOption, ClientOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { is, Obj, Queue, assert, AsyncQueue, Logger } from "@gdknot/frontend_common";
import debounce from "debounce";
import { RawAxiosHeaders } from "@/presets/request_header_updater";
import { timeStamp } from "console";
import { LogModules } from "@/setup/logger.setup";
import { BaseAuthClient } from "./base_auth_client";

const D = new Logger(LogModules.Client) 

export
const DEFAULT_AUTH_CLIENT_OPTION: Partial<ClientAuthOption> = {
  interval: 600,
  url: "", 
  payloadGetter: (()=>{}),
  tokenGetter: (()=>""),
  tokenUpdater: ((response)=>{}),
  redirect: ((response)=>{
    return {clearQueue: true}
  }),
};

/** {@inheritdoc IClientService} 
* 
* @typeParam DATA - response 型別
* @typeParam ERROR - error 型別
* @typeParam SUCCESS - success 型別
*/
export class BaseClient<DATA , ERROR, SUCCESS, QUEUE extends QueueRequest = QueueRequest> 
  implements IBaseClient<DATA, ERROR, SUCCESS, QUEUE> 
{
  queue: AsyncQueue<QUEUE>;
  axios: AxiosInstance;
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[];

  /** {@link IBaseAuthClient} */
  authClient?: IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE>;

  /** stage {@link EClientStage} */
  private __stage!: EClientStage;

  /** stage {@link EClientStage} */
  private get _stage(): EClientStage{
    return this.__stage;
  };
  /** stage {@link EClientStage} */
  private set _stage(_: EClientStage){
    D.current(["set stage:", _.toString()], {stackNumber: 1})
    if (this.__stage != _){
      switch(_){
        case EClientStage.authorizing:
          this._onAuthorizing?.();
          break;
        case EClientStage.fetching:
          this._onFetching?.();
          break;
        case EClientStage.idle:
          this._onIdle?.();
          break;
        case EClientStage.authFetched:
          this._onAuthFetched?.();
          break;
      }
    }
    this.__stage = _;
  }
  get stage(){
    return this._stage;
  };

  isDataResponse: (response: DATA | ERROR | SUCCESS) => boolean;
  isErrorResponse: (response: DATA | ERROR | SUCCESS) => boolean;
  isSuccessResponse: (response: DATA | ERROR | SUCCESS) => boolean;

  constructor(public option: ClientOption<DATA, ERROR, SUCCESS>){
    const {requestChain, responseChain, axiosConfig: config, isErrorResponse, isDataResponse, isSuccessResponse} = option;
    this.isErrorResponse = isErrorResponse;
    this.isDataResponse = isDataResponse;
    this.isSuccessResponse = isSuccessResponse;
    
    const authDebounceImmediate = true;
    this.requestChain = requestChain;
    this.responseChain = responseChain;
    this.axios = axios.create(config);
    this._stage = EClientStage.idle;
    this.queue = new AsyncQueue();
    
    if (option.authOption){
      option.authOption = Object.assign(<Required<ClientAuthOption>>{
        ...DEFAULT_AUTH_CLIENT_OPTION
      }, option.authOption ?? {});

      this.authClient = new BaseAuthClient(
        option.authOption!, 
        this, 
        ()=>this._stage = EClientStage.idle,
        ()=>this._stage = EClientStage.authFetched,
        ()=>this._stage = EClientStage.authFetched
      );
    }

    if (is.not.empty(requestChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (is.not.empty(responseChain)){
      BaseClientServicesPluginChains.install(responseChain, this, "response");
    }
  }
  
  // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
  /** 設置 client 當前 stage */
  protected setStage(stage: EClientStage): void{
    switch(stage){
      case EClientStage.authUpdated:
      case EClientStage.authFetched:
      case EClientStage.authorizing:
        this._stage = stage;
        break;
      case EClientStage.fetching:
        if (this.stage == EClientStage.authorizing || this.stage == EClientStage.authFetched){
          return
        }
        this._stage = stage;
        break;
      case EClientStage.idle:
        if (this.stage == EClientStage.authorizing || this.stage == EClientStage.authFetched){
          return
        }
        this._stage = stage;
        break;
    }
  }

  private _onIdle?: ()=>void;
  onIdle(cb: ()=>void){
    this._onIdle = cb;
  }
  private _onFetching?: ()=>void;
  onFetching(cb: ()=>void){
    this._onFetching = cb;
  }
  private _onAuthorizing?: ()=>void;
  onAuthorizing(cb: ()=>void){
    this._onAuthorizing = cb;
  }
  private _onAuthFetched?: ()=>void;
  onAuthFetched(cb: ()=>void){
    this._onAuthFetched = cb;
  }
  private _onAuthUpdated?: ()=>void;
  onAuthUpdated(cb: ()=>void){
    this._onAuthUpdated = cb;
  }
  protected async _request(
    method: "get" | "post" | "put" | "delete", 
    url: string, 
    data: any, 
    headers?: RawAxiosHeaders,
    responseTransformer?: (response: AxiosResponse)=>any,
    config?: AxiosRequestConfig, 
  ): Promise<DATA | ERROR | SUCCESS>{
    try{
      const option: AxiosRequestConfig = method == "get"
        ? Object.freeze({method, url, params: data, headers })
        : Object.freeze({method, url, data, headers });

      responseTransformer ??= (res)=>{
        return res.data!;
      };

      D.current(["_request, before fetch", option]);
      this.setStage(EClientStage.fetching);
      const res = await this.axios(option);
      const isValidAxiosResponse = res.data != undefined;
      isValidAxiosResponse 
        ? D.current(["_request, after fetch, with response", option]) 
        : D.current(["_request, after fetch, no data response", option]);

      this.setStage(EClientStage.idle);
      return responseTransformer(res);
    }catch(e){
      this.setStage(EClientStage.idle);
      if (e == undefined){
        console.error(`Network Error: url - ${url}, method - ${method}`);
        const code = undefined;
        throw new axios.AxiosError("Network Error", code, config)
      } else if ((e as AxiosError).isAxiosError){
        const error = e as AxiosError;
        const msg = {
          message: error.message,
          response: error.response,
          requestConfig: {
            method: error.config?.method,
            url: error.config?.url,
            params: error.config?.params,
            data: error.config?.data
          },
        }
        throw new Error(`[AxiosError]: ${JSON.stringify(msg)}`)
      }
      throw new Error(`Catch Error on _request: ${JSON.stringify(e)}`);
    }
  }

  async requestByConfig(config: AxiosRequestConfig): Promise<AxiosResponse>{
    const {method, url, data} = config;
    D.current(["requestByConfig", url, data]);
    return this._request(method as any, url!, Object.freeze(data), undefined, (response)=>{
      return response;
    }) as any;
  }
  async get(url: string, payload: Record<string, any>): Promise<DATA | ERROR> {
    return this._request("get", url, Object.freeze(payload)) as Promise<DATA | ERROR>;
  }
  async post(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS> {
    return this._request("post", url, Object.freeze(payload));
  }
  async postForm(url: string, formData: FormData): Promise<DATA | ERROR | SUCCESS> {
    return this._request("post", url, Object.freeze(formData),{
      "Content-Type": "multipart/form-data"
    });
  }
  async auth(): Promise<DATA | ERROR | SUCCESS> {
    assert(()=>this.authClient != undefined && this.authClient.requester != undefined, "axios client for authorization not initialized properly");
    this.setStage(EClientStage.authorizing)
    return this.authClient!.requester!().then((_)=>{
      D.current(["auth response:", _]);
      return _;
    });
  }
  async put(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS> {
    return this._request("put", url, Object.freeze(payload));
  }
  async del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS> {
    return this._request("delete", url, Object.freeze(payload)) as Promise<ERROR | ERROR>;
  }
}