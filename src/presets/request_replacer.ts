import {  BaseRequestReplacer } from "~/base/impl/base_request_replacer";
import { QueueRequest } from "~/base/itf/client_itf";
import { wait } from "~/utils/common_utils";
import { Completer, QueueItem } from "@gdknot/frontend_common";
import { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

/** 
 * {@inheritdoc BaseRequestReplacer} 
 * 用來取代當前的 request, @see {@link BaseRequestReplacer} 
 * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
 * {@link canProcessFulFill} / {@link newRequest} 
 * */
export class RequestReplacer<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> {

  // processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
  //   return this.switchIntoRejectResponse(config, RequestReplacer.name);
  // }
}
