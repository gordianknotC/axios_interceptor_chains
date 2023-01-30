"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModules = exports.logger = exports.EModules = void 0;
const frontend_common_1 = require("@gdknot/frontend_common");
const logger_types_1 = require("@gdknot/frontend_common/dist/utils/logger.types");
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
    [logger_types_1.ELevel.trace]: (msg) => msg.grey,
    [logger_types_1.ELevel.debug]: function (msg) {
        return msg.white;
    },
    [logger_types_1.ELevel.info]: function (msg) {
        return msg.blue;
    },
    [logger_types_1.ELevel.warn]: function (msg) {
        return msg.yellow;
    },
    [logger_types_1.ELevel.current]: function (msg) {
        return msg.cyanBG;
    },
    [logger_types_1.ELevel.error]: function (msg) {
        return msg.red;
    },
    [logger_types_1.ELevel.fatal]: function (msg) {
        return msg.bgBrightRed;
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