import { BaseRequestReplacer } from "../base/impl/base_request_replacer_impl";
import { wait } from "../utils/common_utils";
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
    newRequest(config) {
        const timeout = this.client.axios.defaults.timeout ?? 10 * 1000;
        const completer = this.client?.queue.enqueueWithoutId(() => {
            // 等待其他 plugin 清除
            return wait(timeout);
        });
        const queueItem = completer._meta;
        queueItem.meta = { requestConfig: config };
        return completer.future;
    }
}
//# sourceMappingURL=request_replacer.js.map