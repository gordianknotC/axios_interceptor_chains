import { assert } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { IBaseClient, IBaseClientProperties, IBaseClientResponsibilityChain } from "../itf/client_itf";
import {
  BaseClientServicesPluginChains,
  processResponseFulFill,
  processResponseReject,
} from "../itf/plugin_chains_itf";


/** 所有 response chain 均繼承 {@link BaseClientServiceResponsePlugin} */
export abstract class BaseClientServiceResponsePlugin<
  CLIENT extends IBaseClientResponsibilityChain & IBaseClientProperties<any>=IBaseClient<any, any, any>
>
  extends BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>,
    CLIENT
  >    
{

  constructor(){
    super();
    assert(()=>this.assertCanAssemble() == undefined, ``);
  }
  prev?: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, CLIENT> | undefined;
  next?: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, CLIENT> | undefined;
  client?: CLIENT | undefined;


  /** resolve response 並且繼續下一個 response fulfill chain */
  protected resolve<T = AxiosResponse<any, any> | AxiosRequestConfig<any>>(configOrResponse: T): Promise<T> {
    return processResponseFulFill(configOrResponse as AxiosResponse, this.next) as any;
  }
  /** resolve response 不執行於此後的 chain */
  protected resolveAndIgnoreAll<T = AxiosResponse<any, any> | AxiosRequestConfig<any>>(configOrResponse: T): Promise<T> {
    return Promise.resolve(configOrResponse);
  }
  /** reject response 並且繼續下一個 response reject chain */
  protected reject<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T> {
    return processResponseReject(input as any, this.next) as any;
  }
  /** reject response 不執行於此後的 chain */
  protected rejectAndIgnoreAll<T = AxiosResponse<any, any> | AxiosError<unknown, any> | AxiosRequestConfig<any>>(input: T): Promise<T> {
    return Promise.reject(input);
  }
  

  // todo: -------- 
  assertCanAssemble(): string | undefined {
    return undefined;
  }
  /** 
   * 決定是否能夠進行 next chain
   * @returns - default: true */
  canGoNext(config: AxiosResponse): boolean {
    return super.canGoNext(config);
  }
  /** 
   * 決定是否能夠進行至 {@link processFulFill} 
   * @returns - default: true */
  canProcessFulFill(response: AxiosResponse): boolean {
    return super.canProcessFulFill(response);
  }
  /** 
   * 決定是否能夠進行至 {@link processReject} 
   * @returns - default: true */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return super.canProcessReject(error);
  }
  /** 
   * axios response interceptor onFulFill 時執行, 
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   * - call super: 繼續 responsibility chain
   * - 不 call super: 中斷 responsibility chain
   * - 若 Promise.reject, axios返回錯
   * - 若 Promise.resolve, axios不返回錯
   */
  processFulFill(response: AxiosResponse): Promise<AxiosResponse> {
    return processResponseFulFill(response, this.next);
  }
  /** 
   * axios response interceptor onReject 時執行, 
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   * - call super: 繼續 responsibility chain
   * - 不 call super: 中斷 responsibility chain
   * - 若 Promise.reject, axios返回錯
   * - 若 Promise.resolve, axios不返回錯
   */
  processReject(error: AxiosError): Promise<AxiosError | AxiosResponse> {
    return  processResponseReject(error, this.next);
  }

  
}
