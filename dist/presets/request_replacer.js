import { BaseRequestReplacer } from "../base/impl/base_request_replacer";
/**
 * {@inheritdoc BaseRequestReplacer}
 * 用來取代當前的 request, @see {@link BaseRequestReplacer}
 * 使用者可以延申擴展成不同的 RequestReplacer，只要覆寫
 * {@link canProcessFulFill} / {@link newRequest} 就行
 * */
export class RequestReplacer extends BaseRequestReplacer {
    canProcessFulFill(config) {
        return super.canProcessFulFill(config);
    }
}
//# sourceMappingURL=request_replacer.js.map