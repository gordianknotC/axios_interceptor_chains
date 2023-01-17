//
//
//  INTERFACES
//
//
export type { IBaseClientMethods as IApiClientMethods } from "./base/itf/client_itf";
export type { AxiosConfigHeader } from "./base/impl/request_plugins_impl";
export {
  EClientStage,
} from "./base/itf/client_itf";

export type {
  IBaseClient as IClientService,
  ClientOption
} from "./base/itf/client_itf";
//
//
//  BASE IMPLEMENTATION
//
//
export { BaseClientServicesPluginChains } from "./base/itf/plugin_chains_itf";
export { BaseClientServiceRequestPlugin } from "./base/impl/request_plugins_impl";
export { BaseClient as BaseClient } from "./base/impl/base_client_impl";
export { BaseClientServiceResponsePlugin } from "./base/impl/response_plugins_impl";
export { BaseAuthResponseGuard } from "./base/impl/base_auth_response_guard";
export { BaseRequestReplacer } from "./base/impl/base_request_replacer";
export { BaseRequestHeaderGuard } from "./base/impl/base_request_guard";
//
//
//  PRESETS
//
//
export {
  UpdateAuthHeaderPlugin,
  UpdateExtraHeaderPlugin,
} from "./presets/request_header_updater";

export { AuthResponseGuard } from "./presets/auth_response_guard";
export { RequestReplacer } from "./presets/request_replacer";

