import { assert, AssertMsg } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from "axios";
import type { IRemoteClientService,  } from "../itf/remote_client_service_itf";




function onRequestFulFilled(chain: BaseClientServicesPluginChains<any>){
  return (config: AxiosRequestConfig)=>{
    console.log("onRequestFulFilled called 1");
    if (chain.canProcess(config)){
      return chain.process(config);
    }
    return config;
  }
}
function onRequestError(chain: BaseClientServicesPluginChains<any>){
  return (error: AxiosError)=>{
    console.log("onRequestError called 1");
    if (chain.canProcessError(error)){
      return chain.processError(error);
    }
    return Promise.reject(error);
  }
}
function onResponseFulFilled(chain: BaseClientServicesPluginChains<any>){
  return (config: AxiosRequestConfig)=>{
    console.log("onResponseFulFilled called 1", config);
    if (chain.canProcess(config)){
      return chain.process(config);
    }
    return config;
  }
}
function onResponseError(chain: BaseClientServicesPluginChains<any>){
  return (error: AxiosError)=>{
    console.log("onResponseError called 1", error);
    if (chain.canProcessError(error)){
      return chain.processError(error);
    }
    return Promise.reject(error);
  }
}

/**
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 */
export abstract class BaseClientServicesPluginChains<INPUT, OUTPUT = INPUT> {
  static install(
    chain: BaseClientServicesPluginChains<any>[], 
    client: IRemoteClientService<any, any, any>,
    interceptors: "response" | "request"
  ){
    assert(chain.length >= 1);
    const masterChain = chain[0];
    const tail = chain.slice(1);
    masterChain.init(client);
    if (tail.length >= 1){
      masterChain.addAll(tail)
    }
    if (interceptors == "response"){
      client.client.interceptors.response.use(
        onResponseFulFilled(masterChain),
        onResponseError(masterChain)
      )
    }else{
      client.client.interceptors.request.use(
        onRequestFulFilled(masterChain),
        onRequestError(masterChain)
      )
    }
  }

  abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract client?: IRemoteClientService<any, any, any>;
  abstract process(config: INPUT): OUTPUT;
  abstract processError(error: any): Promise<any>;
  protected addNext(next: BaseClientServicesPluginChains<INPUT, OUTPUT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.next = next;
    next.prev = this;
    next.init(this.client!);
  }
  protected addPrev(prev: BaseClientServicesPluginChains<INPUT, OUTPUT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.prev = prev;
    prev.next = this;
    prev.init(this.client!);
  }
  addAll(_all: BaseClientServicesPluginChains<INPUT, OUTPUT>[]) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    const allSerial = [this, ..._all];
    for (let i = 0; i < allSerial.length - 1; i++) {
      const next = allSerial[i + 1];
      if (next)
      allSerial[i].addNext(next);
    }
  }

  /** default: true */
  public canGoNext(config: INPUT): boolean {
    return this.next != undefined;
  }
  /** default: true */
  public canProcess(config: INPUT): boolean {
    return true;
  }
  /** default: false */
  public canProcessError(error: AxiosError): boolean {
    return false;
  }
  init(client: IRemoteClientService<any, any, any>) {
    this.client = client;
  }
}
