import { DataResponse, EClientStage, IRemoteClientService } from "../itf/remote_client_service_itf";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios, {formToJSON} from "axios";

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

  isDataResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }
  isErrorResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }
  isSuccessResponse(response: T | ERROR | SUCCESS): boolean {
    throw new Error("Method not implemented.");
  }

  protected async _request(method: string, url: string, payload: any): Promise<T | ERROR | SUCCESS>{
    try{
      const axiosResponse =  await this.client({
        method,
        url,
        params: payload
      })
      return axiosResponse.data;
    }catch(e){
      throw e;
    }
  }

  async get(url: string, payload: Record<string, any>): Promise<T | ERROR> {
    return this._request("get", url, payload) as Promise<T | ERROR>;
  }
  async post(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("post", url, payload);
  }
  async put(url: string, payload: Record<string, any>): Promise<T | ERROR | SUCCESS> {
    return this._request("put", url, payload);
  }
  async del(url: string, payload: Record<string, any>): Promise<ERROR | SUCCESS> {
    return this._request("delete", url, payload) as Promise<ERROR | ERROR>;
  }
}