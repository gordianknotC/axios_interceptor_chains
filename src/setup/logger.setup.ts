import { _currentEnv } from "@gdknot/frontend_common/dist/extension/extension_setup";
import { AllowedLogger, AllowedModule, Logger } from "@gdknot/frontend_common/dist/utils/logger"

export enum EModules {
  Client="Client",
  AuthGuard="AuthGuard",
  RequestRep="RequestReplacer",
  HeaderUpdater="HeaderUpdater",
}

const ClientModule: AllowedModule<EModules> = {
  moduleName: EModules.Client,
  disallowedHandler: (level)=> false
}

export
const LogModules: AllowedLogger<EModules> = {
  [EModules.Client]: ClientModule,
  [EModules.AuthGuard]: {...ClientModule, moduleName: EModules.AuthGuard},
  [EModules.RequestRep]: {...ClientModule, moduleName: EModules.RequestRep},
  [EModules.HeaderUpdater]: {...ClientModule, moduleName: EModules.HeaderUpdater},
}
  
Logger.setLoggerAllowanceByEnv({
  test: LogModules,
  develop: LogModules
})