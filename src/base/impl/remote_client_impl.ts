import { DataResponse, EClientStage, IRemoteClientService, RemoteClientAuthOption } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { is, Obj, Queue, assert } from "@gdknot/frontend_common";
import debounce from "debounce";

 
export type RemoteClientOption<T extends DataResponse<any>, ERROR, SUCCESS> = {
  config: AxiosRequestConfig,
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[] ,
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[] ,
  authOption: RemoteClientAuthOption,
  isErrorResponse: (error: ERROR|SUCCESS|T)=>boolean,
  isSuccessResponse: (success: ERROR|SUCCESS|T)=>boolean,
  isDataResponse: (data: ERROR|SUCCESS|T)=>boolean,
};

export class BaseRemoteClient<T extends DataResponse<any>, ERROR, SUCCESS> 
  implements IRemoteClientService<T, ERROR, SUCCESS> 
{
  queue: Queue;
  client: AxiosInstance;
  authOption: Required<RemoteClientAuthOption>;
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[];
  
  private _stage: EClientStage;
  get stage(){
    return this._stage;
  };
  isDataResponse: (response: T | ERROR | SUCCESS) => boolean;
  isErrorResponse: (response: T | ERROR | SUCCESS) => boolean;
  isSuccessResponse: (response: T | ERROR | SUCCESS) => boolean;

  constructor(option: RemoteClientOption<T, ERROR, SUCCESS>){
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
    this._authRequester = debounce(async ()=>{
      try{
        const _inst = axios.create(option.config);
        const {url, payloadGetter, tokenGetter} = this.authOption;
        _inst.defaults.headers.common.Authorization
        const response = await _inst({
          method: "post",
          url,
          data: payloadGetter(),
          headers: {
            Authorization: tokenGetter()
          }
        });
        this._stage = EClientStage.idle;
        return response.data;
      } catch(err){
        console.error(err);
        throw err;
      }
    }, this.authOption.interval, authDebounceImmediate);

    if (is.not.empty(requestChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (is.not.empty(responseChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "response");
    }
  }
  

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
        assert(()=>requestAnimationFrame != undefined);
        requestAnimationFrame(()=>{
          this._stage = stage
          console.log("set stage:", stage);
        });
        break;
    }
  }
  _authRequester: (()=>Promise<T | ERROR | SUCCESS>) & {clear: ()=>void};

  protected async _request(
    method: "get" | "post" | "put" | "delete", 
    url: string, data: any, config?: AxiosRequestConfig, stage?: EClientStage
  ): Promise<T | ERROR | SUCCESS>{
    try{
      const option = method == "get"
        ? {method, url, params: data }
        : {method, url, data };
      this.setStage(EClientStage.fetching);
      console.log(`call axios.${method}`, url);
      const res = await this.client(option);
      this.setStage(EClientStage.idle);
      return res.data;
    }catch(e){
      this.setStage(EClientStage.idle);
      console.error(e);
      throw e;
    }
  }

  async get(url: string, payload: Record<string, any>): Promise<T | ERROR> {
    return this._request("get", url, undefined, {params:payload}) as Promise<T | ERROR>;
  }
  async post(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("post", url, payload);
  }
  async postForm(url: string, formData: FormData): Promise<T | ERROR | SUCCESS> {
    return this._request("post", url, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }
  async auth(): Promise<T | ERROR | SUCCESS> {
    const url = "";
    const payload = {};
    return this._authRequester();
    // return this._request("post", url, payload, undefined, EClientStage.authorizing);
  }
  async put(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("put", url, payload);
  }
  async del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS> {
    return this._request("delete", url, payload) as Promise<ERROR | ERROR>;
  }
}