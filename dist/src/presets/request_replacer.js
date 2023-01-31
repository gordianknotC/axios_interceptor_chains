"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestReplacer = void 0;
const base_request_replacer_1 = require("../base/impl/base_request_replacer");
/**
 * {@inheritdoc BaseRequestReplacer}
 * 用來取代當前的 request, @see {@link BaseRequestReplacer}
 * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
 * {@link canProcessFulFill} / {@link newRequest}
 * */
class RequestReplacer extends base_request_replacer_1.BaseRequestReplacer {
}
exports.RequestReplacer = RequestReplacer;
//# sourceMappingURL=request_replacer.js.map