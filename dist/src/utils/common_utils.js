export function wait(span) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, span);
    });
}
export function ensureNoRaise(action, defaults) {
    try {
        return action();
    }
    catch (e) {
        // console.warn(`catch error on`, e);
        return defaults(e);
    }
}
export function ensureCanProcessFulFill(action) {
    return ensureNoRaise(action, () => false);
}
export function ensureCanReject(action) {
    return ensureNoRaise(action, () => false);
}
//# sourceMappingURL=common_utils.js.map