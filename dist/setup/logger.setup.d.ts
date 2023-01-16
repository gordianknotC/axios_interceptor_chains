import { Logger } from "@gdknot/frontend_common";
import { AllowedModule } from "@gdknot/frontend_common/dist/utils/logger.types";
export declare enum EModules {
    Client = "Client",
    AuthGuard = "AuthGuard",
    RequestRep = "RequestReplacer",
    HeaderUpdater = "HeaderUpdater"
}
export declare function logger(module: AllowedModule<EModules>): Logger<EModules>;
export declare const LogModules: Partial<import("@gdknot/frontend_common").RawAllowedLogger<EModules>>;
