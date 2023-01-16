import { LazyHolder, Logger } from "@gdknot/frontend_common";
export var EModules;
(function (EModules) {
    EModules["Client"] = "Client";
    EModules["AuthGuard"] = "AuthGuard";
    EModules["RequestRep"] = "RequestReplacer";
    EModules["HeaderUpdater"] = "HeaderUpdater";
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
    { ...ClientModule, moduleName: EModules.AuthGuard },
    { ...ClientModule, moduleName: EModules.RequestRep },
    { ...ClientModule, moduleName: EModules.HeaderUpdater }
];
export const LogModules = Logger.setLoggerAllowanceByEnv({
    test: modules,
    develop: []
});
//# sourceMappingURL=logger.setup.js.map