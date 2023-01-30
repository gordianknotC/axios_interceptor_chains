import { BaseRequestReplacer } from "../../base/impl/base_request_replacer";
/**
 * {@inheritdoc BaseRequestReplacer}
 * 用來取代當前的 request, @see {@link BaseRequestReplacer}
 * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
 * {@link canProcessFulFill} / {@link newRequest}
 * */
export class RequestReplacer extends BaseRequestReplacer {
}
//# sourceMappingURL=request_replacer.js.map