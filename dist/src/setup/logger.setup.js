"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModules = exports.logger = exports.EModules = void 0;
const tslib_1 = require("tslib");
const frontend_common_1 = require("@gdknot/frontend_common");
const frontend_common_2 = require("@gdknot/frontend_common");
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
var EModules;
(function (EModules) {
    EModules["Client"] = "Client";
    EModules["AuthGuard"] = "AuthGuard";
    EModules["AuthClient"] = "AuthClient";
    EModules["RequestReplacer"] = "RequestReplacer";
    EModules["HeaderUpdater"] = "HeaderUpdater";
    EModules["Plugin"] = "Plugin";
    EModules["Test"] = "Test";
})(EModules = exports.EModules || (exports.EModules = {}));
function logger(module) {
    return (0, frontend_common_1.LazyHolder)(() => new frontend_common_1.Logger(module));
}
exports.logger = logger;
const ClientModule = {
    moduleName: EModules.Client,
    disallowedHandler: (level) => false,
};
const modules = [
    ClientModule,
    { ...ClientModule, moduleName: EModules.Test },
    { ...ClientModule, moduleName: EModules.AuthGuard },
    { ...ClientModule, moduleName: EModules.AuthClient },
    { ...ClientModule, moduleName: EModules.Plugin },
    { ...ClientModule, moduleName: EModules.RequestReplacer },
    { ...ClientModule, moduleName: EModules.HeaderUpdater }
];
frontend_common_1.Logger.setLevelColors({
    [frontend_common_2.ELevel.trace]: safe_1.default.grey,
    [frontend_common_2.ELevel.debug]: function (msg) {
        return safe_1.default.white(msg);
    },
    [frontend_common_2.ELevel.info]: function (msg) {
        return safe_1.default.blue(msg);
    },
    [frontend_common_2.ELevel.warn]: function (msg) {
        return safe_1.default.yellow(msg);
    },
    [frontend_common_2.ELevel.current]: function (msg) {
        return safe_1.default.bgCyan(msg);
    },
    [frontend_common_2.ELevel.error]: function (msg) {
        return safe_1.default.red(msg);
    },
    [frontend_common_2.ELevel.fatal]: function (msg) {
        return safe_1.default.bgRed(msg);
    },
});
exports.LogModules = frontend_common_1.Logger.setLoggerAllowanceByEnv({
    test: modules,
    develop: modules
});
frontend_common_1.Logger.setCurrentEnv(() => {
    return "production";
});
//# sourceMappingURL=logger.setup.js.map