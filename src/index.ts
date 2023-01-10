//
//  INTERFACES
//
export type { IApiClientMethods } from "./base/itf/remote_client_service_itf";
export type { AxiosConfigHeader } from "./base/impl/request_plugins_impl";
export {
  EClientStage,
  IRemoteClientService,
} from "./base/itf/remote_client_service_itf";

export type { RemoteClientOption } from "./base/impl/remote_client_impl";
//
//  BASE IMPLEMENTATION
//
export { BaseClientServicesPluginChains } from "./base/impl/plugin_chains_impl";
export { BaseClientServiceRequestPlugin } from "./base/impl/request_plugins_impl";
export { BaseRemoteClient } from "./base/impl/remote_client_impl";
export { BaseClientServiceResponsePlugin } from "./base/impl/response_plugins_impl";

//
//  PRESETS
//
export {
  BaseRequestHeaderGuard,
  UpdateAuthHeaderPlugin,
  UpdateExtraHeaderPlugin,
} from "./presets/header_updater";

export { AuthResponseGuard } from "./presets/auth_response_guard";
