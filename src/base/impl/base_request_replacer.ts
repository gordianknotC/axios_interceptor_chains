import {
  EClientStage,
} from "~/base/itf/client_itf";
import { assert, Logger, NotImplementedError } from "@gdknot/frontend_common";
import axios, { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import { LogModules } from "~/setup/logger.setup";
import { BaseRequestGuard } from "~/base/impl/base_request_guard";

const D = new Logger(LogModules.RequestReplacer);

/** 
 * {@inheritdoc BaseRequestGuard}
 * 
 * 使用情境如，當第一個 request 出現 Unauthorized 錯誤時，
 * 後續所有的 request 在第一個 request 重新換發 token 並返回正確的 request 前, 都
 * 需要等待，這時就需要直接取代 request, 讓它保持 pending 待第一個 request 換發成功
 * 後再行處理，流程為
 * - request
 *    {@link canProcessFulFill} > {@link processFulFill}
 * - response
 *    {@link canProcessReject} > {@link processReject}
 * 
 * @typeParam RESPONSE - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
 */
export class BaseRequestReplacer<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestGuard<
  RESPONSE,
  ERROR,
  SUCCESS
> {
  /** 
   * 當 {@link canProcessFulFill} 為 true 則可以進行 {@link processFulFill}，這裡 
   * {@link canProcessFulFill} 只處理當 client 狀態為 {@link EClientStage.authorizing} 時，
   * 代表client正處於換發 authorization token， 這時應處理所有進來的 request, 替代成 pending 
   * @returns - 
   * ```ts
   * this.client!.stage == EClientStage.authorizing
   * ```
   * */
  canProcessFulFill(config: AxiosRequestConfig<any>): boolean {
    return this.client!.stage == EClientStage.authorizing;
  }
  /** 
   * @extendSummary - 
   * 當{@link canProcessFulFill}成立，強制將 request raise exception, 好進行至 
   * reject進行攔截  
   * */
  processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    return this.switchIntoRejectResponse(config);
  }

  /** false */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return false;
  }
}