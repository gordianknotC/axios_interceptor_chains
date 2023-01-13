import {  BaseRequestReplacer } from "@/base/impl/base_request_replacer_impl";
import { wait } from "@/utils/common_utils";
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";
import { QueueRequest } from "./auth_response_guard";

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

export class RequestReplacer<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> {

  protected newRequest(config: AxiosRequestConfig<any>): Promise<any> {
    const timeout = this.client!.client.defaults.timeout ?? 10 * 1000;
    const completer = this.client?.queue.enqueueWithoutId(()=>{
      // 等待其他 plugin 清除
      return wait(timeout);
    })!;
    const queueItem = completer!._meta!;
    queueItem.meta = <QueueRequest>{requestConfig: config};
    return completer!.future;
  }
 
}
