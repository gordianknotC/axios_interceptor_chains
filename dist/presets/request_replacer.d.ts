import { BaseRequestReplacer } from "../base/impl/base_request_replacer";
import { AxiosHeaders } from "axios";
export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;
/**
 * {@inheritdoc BaseRequestReplacer}
 * 用來取代當前的 request, @see {@link BaseRequestReplacer}
 * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
 * {@link canProcessFulFill} / {@link newRequest}
 * */
export declare class RequestReplacer<RESPONSE, ERROR, SUCCESS> extends BaseRequestReplacer<RESPONSE, ERROR, SUCCESS> {
}
