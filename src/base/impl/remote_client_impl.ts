import { EClientStage, IRemoteClientService, RemoteClientAuthOption } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { is, Obj, Queue, assert, AsyncQueue, Logger } from "@gdknot/frontend_common";
import debounce from "debounce";
import { RawAxiosHeaders } from "@/presets/request_header_updater";
import { timeStamp } from "console";
import { LogModules } from "@/setup/logger.setup";

const D = new Logger(LogModules.Client) 

export type RemoteClientOption<DATA, ERROR, SUCCESS> = {
  config: AxiosRequestConfig,
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[] ,
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[] ,
  authOption: RemoteClientAuthOption,
  isErrorResponse: (error: ERROR|SUCCESS|DATA)=>boolean,
  isSuccessResponse: (success: ERROR|SUCCESS|DATA)=>boolean,
  isDataResponse: (data: ERROR|SUCCESS|DATA)=>boolean,
};

export class BaseRemoteClient<DATA , ERROR, SUCCESS> 
  implements IRemoteClientService<DATA, ERROR, SUCCESS> 
{
  queue: AsyncQueue;
  client: AxiosInstance;
  authOption: Required<RemoteClientAuthOption>;
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[];
  private _authClient: AxiosInstance;
  private _authRequester: (()=>Promise<DATA | ERROR | SUCCESS>) & {clear: ()=>void};
  private __stage!: EClientStage;
  private get _stage(): EClientStage{
    return this.__stage;
  };
  private set _stage(_: EClientStage){
    D.current(["set stage:", _.toString()], {stackNumber: 1})
    this.__stage = _;
  }
  get stage(){
    return this._stage;
  };
  isDataResponse: (response: DATA | ERROR | SUCCESS) => boolean;
  isErrorResponse: (response: DATA | ERROR | SUCCESS) => boolean;
  isSuccessResponse: (response: DATA | ERROR | SUCCESS) => boolean;

  constructor(option: RemoteClientOption<DATA, ERROR, SUCCESS>){
    const {requestChain, responseChain, config, isErrorResponse, isDataResponse, isSuccessResponse} = option;
    this.isErrorResponse = isErrorResponse;
    this.isDataResponse = isDataResponse;
    this.isSuccessResponse = isSuccessResponse;
    this.authOption = Object.assign(<Required<RemoteClientAuthOption>>{
      interval: 600,
      url: "", 
      payloadGetter: (()=>{}),
      tokenGetter: (()=>""),
      tokenUpdater: ((response)=>{}),
      redirect: ((response)=>{
        // window.location.href = "/"
      }),
    }, option.authOption ?? {});
    
    const authDebounceImmediate = true;
    this.requestChain = requestChain;
    this.responseChain = responseChain;
    this.client = axios.create(config);
    this._stage = EClientStage.idle;
    this.queue = new Queue();
    this._authClient = axios.create(this.authOption);
    this._authRequester = debounce(async ()=>{
      try{
        const _inst = this._authClient;
        const {url, payloadGetter, tokenGetter, tokenUpdater} = this.authOption;
        const axiosOption = {
          method: "post",
          url,
          data: payloadGetter(),
          headers: {
            Authorization: tokenGetter()
          }
        };
        if (payloadGetter())
          axiosOption.data = payloadGetter();

        D.current(["auth before fetch!", url]);
        const response = await _inst(axiosOption);
        D.current(["auth response!", response]);
        tokenUpdater(response);
        this._stage = EClientStage.idle;
        return response.data;
      } catch(err){
        console.error("Exception on auth request:", err);
        this._stage = EClientStage.idle;
        throw err;
      }
    }, this.authOption.interval, authDebounceImmediate);

    if (is.not.empty(requestChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (is.not.empty(responseChain)){
      BaseClientServicesPluginChains.install(responseChain, this, "response");
    }
  }
  
  // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
  protected setStage(stage: EClientStage): void{
    switch(stage){
      case EClientStage.authorizing:
        this._stage = stage;
        break;
      case EClientStage.fetching:
        if (this.stage == EClientStage.authorizing){
          return
        }
        this._stage = stage;
        break;
      case EClientStage.idle:
        if (this.stage == EClientStage.authorizing){
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
      const res = await this.client(option);
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
        throw new axios.AxiosError("Network Error")
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
    this.setStage(EClientStage.authorizing)
    return this._authRequester();
    // return this._request("post", url, payload, undefined, EClientStage.authorizing);
  }
  async put(url: string, payload: Record<string, any>): Promise<DATA | ERROR | SUCCESS> {
    return this._request("put", url, Object.freeze(payload));
  }
  async del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS> {
    return this._request("delete", url, Object.freeze(payload)) as Promise<ERROR | ERROR>;
  }
}