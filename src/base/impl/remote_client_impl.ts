import { DataResponse, EClientStage, IRemoteClientService } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

export type RemoteClientOption = {
  config: AxiosRequestConfig,
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[] ,
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[] 
};


export class BaseRemoteClient<T extends DataResponse<any>, ERROR, SUCCESS> 
  implements IRemoteClientService<T  , ERROR, SUCCESS> 
{
  constructor(option: RemoteClientOption){
    const {requestChain, responseChain, config} = option;
    this.requestChain = requestChain;
    this.responseChain = responseChain;
    this.client = axios.create(config);
    if (requestChain){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (responseChain){
      BaseClientServicesPluginChains.install(requestChain, this, "response");
    }
    this.stage = EClientStage.idle;
  }

  client: AxiosInstance;
  stage: EClientStage;
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig>[];
  responseChain: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >[];
  
  isDataResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }
  isErrorResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }
  isSuccessResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }

  protected cancelIdle(): void{

  }
  protected registerIdle(): void{

  }
  protected async _request(method: "get" | "post" | "put" | "delete", url: string, data: any, config?: AxiosRequestConfig, stage?: EClientStage): Promise<T | ERROR | SUCCESS>{
    this.cancelIdle();
    this.stage = stage ?? EClientStage.fetching;
    if (method == "get")
      return new Promise((resolve, reject)=>{
        console.log(`call axios.${method}`, url);
        this.client({
          method,
          url,
          params: data
        }).then(res => {
          console.log(`   resolve ${method} - ${url}`, res.data);
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
      });
    return new Promise((resolve, reject) => {
      console.log(`call axios.${method}`, url);
      this.client({
        method,
        url,
        data
      }).then(res => {
        console.log(`   resolve ${method} - ${url}`, res.data);
        resolve(res.data);
      }).catch(err => {
        reject(err);
      });
    });
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
  async auth(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("post", url, payload, undefined, EClientStage.authorizing);
  }
  async put(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("put", url, payload);
  }
  async del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS> {
    return this._request("delete", url, payload) as Promise<ERROR | ERROR>;
  }
}