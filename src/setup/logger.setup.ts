import { LazyHolder, Logger } from "@gdknot/frontend_common";
import { _currentEnv } from "@gdknot/frontend_common/dist/src/extension/extension_setup";
import { AllowedModule, ELevel,  } from "@gdknot/frontend_common"
import colors from "colors/safe";

export enum EModules {
  Client="Client",
  AuthGuard="AuthGuard",
  AuthClient="AuthClient",
  RequestReplacer="RequestReplacer",
  HeaderUpdater="HeaderUpdater",
  Plugin="Plugin",
  Test="Test"
}

export function logger(module: AllowedModule<EModules>): Logger<EModules>{
  return LazyHolder(()=>new Logger(module));
}
 
const ClientModule: AllowedModule<EModules> = {
  moduleName: EModules.Client,
  disallowedHandler: (level: ELevel)=> false,
}

const modules = [
  ClientModule,
  {...ClientModule, moduleName: EModules.Test},
  {...ClientModule, moduleName: EModules.AuthGuard},
  {...ClientModule, moduleName: EModules.AuthClient},
  {...ClientModule, moduleName: EModules.Plugin},
  {...ClientModule, moduleName: EModules.RequestReplacer},
  {...ClientModule, moduleName: EModules.HeaderUpdater}
];

Logger.setLevelColors({
  [ELevel.trace]: colors.grey,
  [ELevel.debug]: function (msg: string): string {
    return colors.white(msg);
  },
  [ELevel.info]: function (msg: string): string {
    return colors.blue(msg);
  },
  [ELevel.warn]: function (msg: string): string {
    return colors.yellow(msg);
  },
  [ELevel.current]: function (msg: string): string {
    return colors.bgCyan(msg);
  },
  [ELevel.error]: function (msg: string): string {
    return colors.red(msg);
  },
  [ELevel.fatal]: function (msg: string): string {
    return colors.bgRed(msg);
  },
 });

export const LogModules = Logger.setLoggerAllowanceByEnv({
  test: modules,
  develop: modules
})

Logger.setCurrentEnv(()=>{
  return "production";
});