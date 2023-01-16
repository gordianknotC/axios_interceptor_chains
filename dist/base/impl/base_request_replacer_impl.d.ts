import { AxiosError, AxiosRequestConfig } from "axios";
import { BaseRequestGuard } from "./base_request_guard_impl";
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
export declare class BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> extends BaseRequestGuard<RESPONSE, ERROR, SUCCESS> {
    /** 當request 進行取代持會 raise 這個 exception */
    static errorMessageForReplacement: string;
    /**
     * 當 {@link canProcessFulFill} 為 true 則可以進行 {@link processFulFill}，這裡
     * {@link canProcessFulFill} 只處理當 client 狀態為 {@link EClientStage.authorizing} 時，
     * 代表client正處於換發 authorization token， 這時應處理所有進來的 request, 替代成 pending
     * */
    canProcessFulFill(config: AxiosRequestConfig<any>): boolean;
    /**
     * @extendSummary -
     * 當{@link canProcessFulFill}成立，強制將 request raise exception, 好進行至
     * reject進行攔截
     * */
    processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any>;
    /**
     *
     * @extendSummary -
     * 當 {@link canProcessReject} 為 true 則可以進行 {@link processReject}，這裡
     * {@link canProcessReject} 只處理當 error.message 為 {@link processFulFill}
     * 階段為取代 request 所 raise 的 exception {@link BaseRequestReplacer.errorMessageForReplacement}
    */
    canProcessReject(error: AxiosError<unknown, any>): boolean;
    /**
     * @extendSummary -
     * 以 newRequest 取代 processFulFill 所 raise 的 exception, 並返回給 axios */
    processReject(error: AxiosError<unknown, any>): Promise<any>;
    /** newRequest 由使用者實作, 迴回新的 Promise 請求，用來替代舊的請求
     * @param config - 原來的 axios request config */
    protected newRequest(config: AxiosRequestConfig): Promise<any>;
}
