import { LazyHolder, Logger } from "@gdknot/frontend_common";
import { _currentEnv } from "@gdknot/frontend_common/dist/extension/extension_setup";
import { AllowedModule,  } from "@gdknot/frontend_common/dist/utils/logger.types"

export enum EModules {
  Client="Client",
  AuthGuard="AuthGuard",
  RequestRep="RequestReplacer",
  HeaderUpdater="HeaderUpdater",
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
  {...ClientModule, moduleName: EModules.AuthGuard},
  {...ClientModule, moduleName: EModules.RequestRep},
  {...ClientModule, moduleName: EModules.HeaderUpdater}
];

export const LogModules = Logger.setLoggerAllowanceByEnv({
  test: modules,
  develop: []
})
