import { LogModules } from "~/setup/logger.setup";
import { ensureCanProcessFulFill, ensureCanReject } from "~/utils/common_utils";
import { Arr, ArrayDelegate, assert, AssertMsg, Logger } from "@gdknot/frontend_common";
import { Axios, AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from "axios";
import type { ClientAuthOption, ClientOption, IBaseAuthClient, IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain,  } from "./client_itf"

const D = new Logger(LogModules.Plugin);
const byPassAll = false;

export interface ResponseInterceptorUse<V> {
  onFulfilled?: ((value: V) => V | Promise<V>) | null, 
  onRejected?: ((error: any) => any) | null, 
}

export enum ChainActionStage {
  processRequest,
  processResponse,
  rejectRequest,
  rejectResponse,
  canProcessRequest,
  canProcessResponse,
  canRejectRequest,
  canRejectResponse,
}

export type ChainAction = {
  headerKey: string,
  headerVal: string,
  stage: ChainActionStage,
  action: (error: AxiosError)=>Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>,
}

enum EMethod {
  processFulFill = "processFulFill",
  canProcessFulFill = "canProcessFulFill",
  processReject = "processReject",
  canProcessReject = "canProcessReject"
}

type ChainInput = AxiosError | AxiosResponse | AxiosRequestConfig;
function isAxiosError(input: ChainInput):boolean{
  return (input as AxiosError).isAxiosError != undefined;
}
function isAxiosResponse(input: ChainInput):boolean{
  return (input as AxiosResponse).status != undefined;
}
function isAxiosConfig(input: ChainInput):boolean{
  return !isAxiosError(input) && !isAxiosResponse(input);
}

function onStage(chain: BaseClientServicesPluginChains<any, any, any>, input: any, method: EMethod): any{
  (chain as any).setStage(input, method);
  const ret = chain[method](input);
  switch (method) {
    case EMethod.processFulFill: 
      (chain as any)._onProcess?.(input); 
      break;
    case EMethod.canProcessFulFill: 
      (chain as any)._onCanProcess?.(input); 
      break;
    case EMethod.processReject: 
      (chain as any)._onProcessReject?.(input); 
      break;
    case EMethod.canProcessReject: 
      (chain as any)._onCanProcessReject?.(input); 
      break;
    default: 
      break;
  }
  return ret;
}

//
//    R E S P O N S E 
//
//
export function processResponseFulFill(
  response: AxiosResponse,
  chain?: BaseClientServicesPluginChains<any, any, any>
): Promise<AxiosResponse> {
  if (!chain) 
    return Promise.resolve(response); // 結束責任鍊
  if (ensureCanProcessFulFill(() => onStage(chain, response, EMethod.canProcessFulFill))) {
    return onStage(chain, response, EMethod.processFulFill); // chain
  } else {
    if (chain.next && chain.canGoNext(response.config!)) {
      return processResponseFulFill(response, chain.next); // next chain
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
    const canGo = onStage(chain, error, EMethod.canProcessReject);
    D.info([chain.constructor.name, "Response.canProcessReject", error.config?.url, error.config?.headers,, canGo])
    return canGo;
  })) {
    D.info([chain.constructor.name, "Response.processReject", error.config?.url, error.config?.headers,])
    return onStage(chain, error, EMethod.processReject);;
  } else {
    if (chain.next && chain.canGoNext(error.config!)) {
      return processResponseReject(error, chain.next);
    }
    return processResponseReject(error, undefined);
  }
}

function onResponseFulFilled(chain: BaseClientServicesPluginChains<any, any, any>){
  return (response: AxiosResponse): Promise<AxiosResponse> => {
    D.current(["Start FulFull Response Chain",  chain.constructor.name,response.config?.url, "with response:\n", response.data])
    if (byPassAll) return Promise.resolve(response);
    
    return processResponseFulFill(response, chain);
  }
}
function onResponseError(chain: BaseClientServicesPluginChains<any, any, any>){
  return (error: AxiosError)=>{
    D.current(["Start Reject Response Chain", chain.constructor.name, error.config?.url ])
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
    const canGo = onStage(chain, config, EMethod.canProcessFulFill);
    D.info([chain.constructor.name, "Request.canProcessFulFill", config.url, config.headers,canGo])
    return canGo;
  })) {
    D.info([chain.constructor.name, "Request.processFulFill", config.url, config.headers,])
    return onStage(chain, config, EMethod.processFulFill);
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
    const canGo = onStage(chain, error, EMethod.canProcessReject);
    D.info([chain.constructor.name, "Request.canProcessReject",  chain.constructor.name, error.config?.url, error.config?.headers, canGo])
    return canGo;
  })) {
    D.info([chain.constructor.name, "Request.processReject", chain.constructor.name, error.config?.url, error.config?.headers])
    return onStage(chain, error, EMethod.processReject);
  } else {
    if (chain.next && chain.canGoNext(error.config))
      return processRequestReject(error, chain.next);
    return processRequestReject(error, undefined);
  }
}

function onRequestFulFilled(chain: BaseClientServicesPluginChains<any, any, any>){
  return (config: AxiosRequestConfig): AxiosRequestConfig=>{
    D.current(["Start FulFull Request Chain", chain.constructor.name, config?.url ])
    if (byPassAll) return config;
    return processRequestFulFill(config, chain);
  }
}

function onRequestError(chain: BaseClientServicesPluginChains<any, any, any>){
  return (error: AxiosError): Promise<AxiosResponse|AxiosError>=>{
    D.current(["Start Reject Request Chain", chain.constructor.name, error.config?.url, error.config?.headers ])
    if (byPassAll) return Promise.reject(error.response);
    return processRequestReject(error, chain);
  }
}

// export abstract class PluginChainActionRegistry {
//   abstract name: string;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
//   abstract requestAction: (request: AxiosRequestConfig)=> void;
// }

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
  ```ts 
     if (is.not.empty(requestChain)){
        BaseClientServicesPluginChains.install(requestChain, this, "request");
     }
     if (is.not.empty(responseChain)){
        BaseClientServicesPluginChains.install(responseChain, this, "response");
     }
  ```
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
  /** assertion for assembling responsibility chain */
  abstract assertCanAssemble(): string | undefined;
  //
  protected abstract resolve<T=AxiosRequestConfig | AxiosResponse>(configOrResponse: T): Promise<T>|T; 
  protected abstract resolveAndIgnoreAll<T=AxiosRequestConfig | AxiosResponse>(configOrResponse: T): Promise<T>|T; 
  protected abstract reject<T=AxiosRequestConfig | AxiosResponse | AxiosError>(input: T): Promise<T>; 
  protected abstract rejectAndIgnoreAll<T=AxiosRequestConfig | AxiosResponse | AxiosError>(input: T): Promise<T>; 
  //
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
  protected stage?: ChainActionStage;
  protected setStage(input: ChainInput, method: EMethod): void {
    switch (method) {
      case EMethod.processFulFill: 
        this.stage = isAxiosConfig(input)
          ? ChainActionStage.processRequest
          : ChainActionStage.processResponse;
        break;
      case EMethod.canProcessFulFill: 
        this.stage = isAxiosConfig(input)
          ? ChainActionStage.canProcessRequest
          : ChainActionStage.canProcessResponse;
        break;
      case EMethod.processReject: 
        this.stage = isAxiosConfig(input)
          ? ChainActionStage.rejectRequest
          : ChainActionStage.rejectResponse;
        break;
      case EMethod.canProcessReject: 
        this.stage = isAxiosConfig(input)
          ? ChainActionStage.canRejectRequest
          : ChainActionStage.canRejectResponse;
        break;
      default: 
        break;
    }
  }

  /** {@link AxiosResponse}|{@link AxiosError} 轉換為 {@link axiosConfig} */
  protected toAxiosConfig(input: ChainInput): AxiosRequestConfig{
    return isAxiosConfig(input)
      ? input as AxiosRequestConfig
      : isAxiosError(input)
        ? (input as AxiosError).config!
        : isAxiosResponse(input)
          ? (input as AxiosResponse).config
          : (function(){throw new Error()})()
  }
  /** 
   * 以當前的物件名稱及 {@link ChanActionStage} 註記於 {@link AxiosRequestConfig}.header 
   * 中, 用於當 RequestChain / ResponseChain 轉發流程時，得以透過 header 得知該流程由哪裡轉發而來
   * @example 
   * reject 當前 request, 並標記於 header 中, 好讓其他 chain 能夠知道這個 AxiosError
   * 是由哪一個 chain reject 而來
   * ```ts
    // RequestChain
    protected switchIntoRejectResponse(config: AxiosRequestConfig, ident:string){
      this.markDirty(config);
      const stage = this.stage!;
      const axiosError: AxiosError = {
        isAxiosError: false,
        toJSON: function (): object {
          return axiosError;
        },
        name: ident,
        message: ident,
        config
      };
      return Promise.reject(axiosError) as any;
    }
    // ResponseChain
    processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
      if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)){
        console.log("processReject - requests from ACAuthGuard")
        return Promise.reject(error);
      }
      return this.reject(error);
    }
   * 
   * ```
   * mark request header as dirty */
  protected markDirty(input: ChainInput): AxiosRequestConfig{
    const config = this.toAxiosConfig(input);
    const name = this.constructor.name;
    (config.headers! as any)[`__chain_action_${name}__`] = this.stage;
    return config;
  }
  /** read request header to see if it's dirtied or not */
  protected isDirtiedBy(input: ChainInput, identity: string, stage?: ChainActionStage): boolean{
    const config = this.toAxiosConfig(input);
    const result =  stage 
      ? (config.headers! as any)[`__chain_action_${identity}__`] == stage
      : (config.headers! as any)[`__chain_action_${identity}__`] != undefined;
    return result;
  }
  protected _onProcess?: ()=>void;
  public onProcess(cb: ()=>void, terminateAfterCall: boolean = true){
    this._onProcess = ()=>{
      cb();
      if (terminateAfterCall){
        this._onProcess = undefined;
      }
    }
  }
  protected _onProcessReject?: ()=>void;
  public onProcessReject(cb: ()=>void, terminateAfterCall: boolean = true){
    this._onProcessReject = ()=>{
      cb();
      if (terminateAfterCall){
        this._onCanProcess = undefined;
      }
    }
  }
  protected _onCanProcess?: ()=>void;
  public onCanProcess(cb: ()=>void, terminateAfterCall: boolean = true){
    this._onCanProcess = ()=>{
      cb();
      if (terminateAfterCall){
        this._onCanProcess = undefined;
      }
    }
  }
  protected _onCanProcessReject?: ()=>void;
  public onCanProcessReject(cb: ()=>void, terminateAfterCall: boolean = true){
    this._onCanProcessReject = ()=>{
      cb();
      if (terminateAfterCall){
        this._onCanProcessReject = undefined;
      }
    }
  }
  init(client: CLIENT) {
    this.client = client;
  }
}
