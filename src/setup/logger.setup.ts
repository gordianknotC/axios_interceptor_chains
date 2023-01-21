import { LazyHolder, Logger } from "@gdknot/frontend_common";
import { _currentEnv } from "@gdknot/frontend_common/dist/extension/extension_setup";
import { AllowedModule, ELevel,  } from "@gdknot/frontend_common/dist/utils/logger.types"

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
  disallowedHandler: (level)=> false,
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
  [ELevel.trace]: (msg) => msg.grey,
  [ELevel.debug]: function (msg: string): string {
    return msg.white;
  },
  [ELevel.info]: function (msg: string): string {
    return msg.blue;
  },
  [ELevel.warn]: function (msg: string): string {
    return msg.yellow;
  },
  [ELevel.current]: function (msg: string): string {
    return msg.cyanBG;
  },
  [ELevel.error]: function (msg: string): string {
    return msg.red;
  },
  [ELevel.fatal]: function (msg: string): string {
    return msg.bgBrightRed;
  },
 })

export const LogModules = Logger.setLoggerAllowanceByEnv({
  test: modules,
  develop: modules
})
