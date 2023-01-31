import { Logger } from "@gdknot/frontend_common";
import { AllowedModule } from "@gdknot/frontend_common";
export declare enum EModules {
    Client = "Client",
    AuthGuard = "AuthGuard",
    AuthClient = "AuthClient",
    RequestReplacer = "RequestReplacer",
    HeaderUpdater = "HeaderUpdater",
    Plugin = "Plugin",
    Test = "Test"
}
export declare function logger(module: AllowedModule<EModules>): Logger<EModules>;
export declare const LogModules: Partial<import("@gdknot/frontend_common").RawAllowedLogger<EModules>>;
