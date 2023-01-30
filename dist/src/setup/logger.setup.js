import { LazyHolder, Logger } from "@gdknot/frontend_common";
import { ELevel, } from "@gdknot/frontend_common/dist/utils/logger.types";
export var EModules;
(function (EModules) {
    EModules["Client"] = "Client";
    EModules["AuthGuard"] = "AuthGuard";
    EModules["AuthClient"] = "AuthClient";
    EModules["RequestReplacer"] = "RequestReplacer";
    EModules["HeaderUpdater"] = "HeaderUpdater";
    EModules["Plugin"] = "Plugin";
    EModules["Test"] = "Test";
})(EModules || (EModules = {}));
export function logger(module) {
    return LazyHolder(() => new Logger(module));
}
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
Logger.setLevelColors({
    [ELevel.trace]: (msg) => msg.grey,
    [ELevel.debug]: function (msg) {
        return msg.white;
    },
    [ELevel.info]: function (msg) {
        return msg.blue;
    },
    [ELevel.warn]: function (msg) {
        return msg.yellow;
    },
    [ELevel.current]: function (msg) {
        return msg.cyanBG;
    },
    [ELevel.error]: function (msg) {
        return msg.red;
    },
    [ELevel.fatal]: function (msg) {
        return msg.bgBrightRed;
    },
});
export const LogModules = Logger.setLoggerAllowanceByEnv({
    test: modules,
    develop: modules
});
Logger.setCurrentEnv(() => {
    return "production";
});
//# sourceMappingURL=logger.setup.js.map