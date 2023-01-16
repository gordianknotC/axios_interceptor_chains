import {  BaseRequestReplacer } from "@/base/impl/base_request_replacer_impl";
import { QueueRequest } from "@/base/itf/client_itf";
import { wait } from "@/utils/common_utils";
import { Completer, QueueItem } from "@gdknot/frontend_common";
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

/** 
 * {@inheritdoc BaseRequestReplacer} 
 * 用來取代當前的 request, @see {@link BaseRequestReplacer} 
 * 使用者可以延申擴展成不同的 RequestReplacer，只要覆寫
 * {@link canProcessFulFill} / {@link newRequest} 就行
 * */
export class RequestReplacer<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> {

  canProcessFulFill(config: AxiosRequestConfig<any>): boolean {
    return super.canProcessFulFill(config);
  }

  protected newRequest(config: AxiosRequestConfig<any>): Promise<any> {
    const timeout = this.client!.axios.defaults.timeout ?? 10 * 1000;
    const completer = this.client?.queue.enqueueWithoutId(()=>{
      // 等待其他 plugin 清除
      return wait(timeout);
    })!;
    const queueItem = completer!._meta!;
    queueItem.meta = {requestConfig: config};
    return completer!.future;
  }
}
