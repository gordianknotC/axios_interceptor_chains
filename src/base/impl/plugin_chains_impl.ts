import { ensureCanProcessFulFill, ensureCanReject } from "@/utils/common_utils";
import { assert, AssertMsg } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from "axios";
import type { IRemoteClientService,  } from "../itf/remote_client_service_itf";

export interface ResponseInterceptorUse<V> {
    onFulfilled?: ((value: V) => V | Promise<V>) | null, 
    onRejected?: ((error: any) => any) | null, 
}

const byPassAll = false;


export function processResponseFulFill(
  response: AxiosResponse,
  chain?: BaseClientServicesPluginChains<any>
): Promise<AxiosResponse> {
  if (!chain) return Promise.resolve(response);
  if (ensureCanProcessFulFill(() => chain.canProcessFulFill(response))) {
    return chain.processFulFill(response);
  } else {
    if (chain.next && chain.canGoNext(response.config!)) {
      return processResponseFulFill(response, chain.next);
    }
    return processResponseFulFill(response, undefined);
  }
}

export function processResponseReject(
  error: AxiosError,
  chain?: BaseClientServicesPluginChains<any>
): Promise<AxiosError | AxiosResponse> {
  if (!chain) return Promise.reject(error!);
  if (ensureCanReject(() => chain.canProcessReject(error))) {
    return chain.processReject(error);
  } else {
    if (chain.next && chain.canGoNext(error.config!)) {
      return processResponseReject(error, chain.next);
    }
    return processResponseReject(error, undefined);
  }
}




export function processRequestFulFill(
  config: AxiosRequestConfig,
  chain?: BaseClientServicesPluginChains<any>
): AxiosRequestConfig {
  if (!chain) return config;
  if (ensureCanProcessFulFill(() => chain.canProcessFulFill(config))) {
    return chain.processFulFill(config);
  } else {
    if (chain.next && chain.canGoNext(config))
      return processRequestFulFill(config, chain.next);
    return processRequestFulFill(config, undefined);
  }
}

export function processRequestReject(
  error: AxiosError,
  chain?: BaseClientServicesPluginChains<any>
): Promise<AxiosError | AxiosResponse> {
  if (!chain) return Promise.reject(error!);
  if (ensureCanReject(() => chain.canProcessReject(error))) {
    return chain.processReject(error).catch((e) => {
      console.error("catch on processError", e);
      return Promise.reject(e);
    });
  } else {
    if (chain.next && chain.canGoNext(error.config))
      return processRequestReject(error, chain.next);
    return processRequestReject(error, undefined);
  }
}

function onRequestFulFilled(chain: BaseClientServicesPluginChains<any>){
  return (config: AxiosRequestConfig): AxiosRequestConfig=>{
    if (byPassAll) return config;
    return processRequestFulFill(config, chain);
  }
}
function onRequestError(chain: BaseClientServicesPluginChains<any>){
  return (error: AxiosError): Promise<AxiosResponse|AxiosError>=>{
    if (byPassAll) return Promise.reject(error.response);
    return processRequestReject(error, chain);
  }
}
function onResponseFulFilled(chain: BaseClientServicesPluginChains<any>){
  return (response: AxiosResponse): Promise<AxiosResponse> => {
    if (byPassAll) return Promise.resolve(response);
    return processResponseFulFill(response, chain);
  }
}
function onResponseError(chain: BaseClientServicesPluginChains<any>){
  return (error: AxiosError)=>{
    if (byPassAll) return Promise.reject(error.response);
    return processResponseReject(error, chain);
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
    assert(()=>chain.length >= 1);
    const masterChain = chain[0];
    const tail = chain.slice(1);
    masterChain.init(client);
    if (tail.length >= 1){
      masterChain.addAll(tail)
    }
    if (interceptors == "response"){
      client.client.interceptors.response.use(
        onResponseFulFilled(masterChain as any),
        onResponseError(masterChain)
      )
    }else{
      client.client.interceptors.request.use(
        onRequestFulFilled(masterChain),
        onRequestError(masterChain)
      )
    }
  }
  constructor(){}
  abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract client?: IRemoteClientService<any, any, any>;
  abstract processFulFill(config: INPUT): OUTPUT;
  abstract processReject(error: AxiosError): Promise<AxiosError|AxiosResponse>;
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
  public canProcessFulFill(config: INPUT): boolean {
    return true;
  }
  /** default: false */
  public canProcessReject(error: AxiosError): boolean {
    return false;
  }
  init(client: IRemoteClientService<any, any, any>) {
    this.client = client;
  }
}
