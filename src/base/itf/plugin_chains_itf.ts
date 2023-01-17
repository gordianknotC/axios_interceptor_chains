import { LogModules } from "@/setup/logger.setup";
import { ensureCanProcessFulFill, ensureCanReject } from "@/utils/common_utils";
import { assert, AssertMsg, Logger } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from "axios";
import { AnyMxRecord } from "dns";
import type { ClientAuthOption, ClientOption, IBaseAuthClient, IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain,  } from "./client_itf"

const D = new Logger(LogModules.Plugin);

export interface ResponseInterceptorUse<V> {
  onFulfilled?: ((value: V) => V | Promise<V>) | null, 
  onRejected?: ((error: any) => any) | null, 
}

const byPassAll = false;

//
//    R E S P O N S E 
//
//
export function processResponseFulFill(
  response: AxiosResponse,
  chain?: BaseClientServicesPluginChains<any, any, any>
): Promise<AxiosResponse> {
  if (!chain) return Promise.resolve(response);
  if (ensureCanProcessFulFill(() => {
    D.info([chain.constructor.name, "Response.canProcessFulFill", chain.canProcessFulFill(response)])
    return chain.canProcessFulFill(response);
  })) {
    D.info([chain.constructor.name, "Response.processFulFill"])
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
  chain?: BaseClientServicesPluginChains<any, any, any>
): Promise<AxiosError | AxiosResponse> {
  if (!chain) return Promise.reject(error!);
  if (ensureCanReject(() => {
    D.info([chain.constructor.name, "Response.canProcessReject", chain.canProcessReject(error)])
    return chain.canProcessReject(error);
  })) {
    D.info([chain.constructor.name, "Response.processReject"])
    return chain.processReject(error);
  } else {
    if (chain.next && chain.canGoNext(error.config!)) {
      return processResponseReject(error, chain.next);
    }
    return processResponseReject(error, undefined);
  }
}

function onResponseFulFilled(chain: BaseClientServicesPluginChains<any, any, any>){
  return (response: AxiosResponse): Promise<AxiosResponse> => {
    if (byPassAll) return Promise.resolve(response);
    return processResponseFulFill(response, chain);
  }
}
function onResponseError(chain: BaseClientServicesPluginChains<any, any, any>){
  return (error: AxiosError)=>{
    if (byPassAll) return Promise.reject(error.response);
    return processResponseReject(error, chain);
  }
}

//
//
//       R E Q U E S T
//
//
//
export function processRequestFulFill(
  config: AxiosRequestConfig,
  chain?: BaseClientServicesPluginChains<any, any, any>
): AxiosRequestConfig {
  if (!chain) return config;
  if (ensureCanProcessFulFill(() => {
    D.info([chain.constructor.name, "Request.canProcessFulFill", chain.canProcessFulFill(config)])
    return chain.canProcessFulFill(config);
  })) {
    D.info([chain.constructor.name, "Request.processFulFill"])
    return chain.processFulFill(config);
  } else {
    if (chain.next && chain.canGoNext(config))
      return processRequestFulFill(config, chain.next);
    return processRequestFulFill(config, undefined);
  }
}

export function processRequestReject(
  error: AxiosError,
  chain?: BaseClientServicesPluginChains<any, any, any>
): Promise<AxiosError | AxiosResponse> {
  if (!chain) return Promise.reject(error!);
  if (ensureCanReject(() => {
    D.info([chain.constructor.name, "Request.canProcessReject", chain.canProcessReject(error)])
    return chain.canProcessReject(error);
  })) {
    D.info([chain.constructor.name, "Request.processReject"])
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

function onRequestFulFilled(chain: BaseClientServicesPluginChains<any, any, any>){
  return (config: AxiosRequestConfig): AxiosRequestConfig=>{
    if (byPassAll) return config;
    return processRequestFulFill(config, chain);
  }
}
function onRequestError(chain: BaseClientServicesPluginChains<any, any, any>){
  return (error: AxiosError): Promise<AxiosResponse|AxiosError>=>{
    if (byPassAll) return Promise.reject(error.response);
    return processRequestReject(error, chain);
  }
}


/**
 * {@inheritdoc BaseClientServicesPluginChains}
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 * @typeParam CLIENT - client 型別
 */
export abstract class BaseClientServicesPluginChains<
  INPUT, 
  OUTPUT = INPUT, 
  CLIENT extends (IBaseClientResponsibilityChain & IBaseClientProperties<any>)
    =IBaseClient<any, any, any>
> {
  /** instal request/response responsibility chain
   * @see {@link BaseClient}
   * @example - 於 BaseClient 內部
   * ```ts 
     if (is.not.empty(requestChain)){
        BaseClientServicesPluginChains.install(requestChain, this, "request");
     }
     if (is.not.empty(responseChain)){
        BaseClientServicesPluginChains.install(responseChain, this, "response");
     }
   * ```
   */
  static install<CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any>>(
    chain: BaseClientServicesPluginChains<any, any, any>[], 
    client: CLIENT,
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
      client.axios.interceptors.response.use(
        onResponseFulFilled(masterChain as any),
        onResponseError(masterChain)
      )
    }else{
      client.axios.interceptors.request.use(
        onRequestFulFilled(masterChain),
        onRequestError(masterChain)
      )
    }
  }
  constructor(){}
  /** 上一個 chain */
  abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>;
  /** 下一個 chain */
  abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>;
  /** ClientService */
  abstract client?: CLIENT;
  abstract processFulFill(config: INPUT): OUTPUT;
  abstract processReject(error: AxiosError): Promise<AxiosError|AxiosResponse>;
  /** 增加下一個 chain */
  protected addNext(next: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.next = next;
    next.prev = this;
    next.init(this.client!);
  }
  /** 增加上一個 chain */
  protected addPrev(prev: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.prev = prev;
    prev.next = this;
    prev.init(this.client!);
  }
  
  addAll(_all: BaseClientServicesPluginChains<INPUT, OUTPUT, CLIENT>[]) {
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
  /** default: true */
  public canProcessReject(error: AxiosError): boolean {
    return true;
  }
  init(client: CLIENT) {
    this.client = client;
  }
}
