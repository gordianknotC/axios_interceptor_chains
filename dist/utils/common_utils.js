"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCanReject = exports.ensureCanProcessFulFill = exports.ensureNoRaise = exports.wait = void 0;
function wait(span) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, span);
    });
}
exports.wait = wait;
function ensureNoRaise(action, defaults) {
    try {
        return action();
    }
    catch (e) {
        // console.warn(`catch error on`, e);
        return defaults(e);
    }
}
exports.ensureNoRaise = ensureNoRaise;
function ensureCanProcessFulFill(action) {
    return ensureNoRaise(action, () => false);
}
exports.ensureCanProcessFulFill = ensureCanProcessFulFill;
function ensureCanReject(action) {
    return ensureNoRaise(action, () => false);
}
exports.ensureCanReject = ensureCanReject;
//# sourceMappingURL=common_utils.js.map