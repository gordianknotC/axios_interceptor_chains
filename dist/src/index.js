//
//
//  INTERFACES
//
export { EClientStage } from "./base/itf/client_itf";
//
//
//  BASE IMPLEMENTATION
//
//
export { BaseClientServicesPluginChains, ChainActionStage, } from "./base/itf/plugin_chains_itf";
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
export { ClientRequestAuthHeaderUpdater as UpdateAuthHeaderPlugin, ClientRequestExtraHeaderUpdater as UpdateExtraHeaderPlugin, } from "./presets/request_header_updater";
export { NetworkErrorResponseGuard } from "./presets/network_error_response_guard";
export { AuthResponseGuard } from "./presets/auth_response_guard";
export { RequestReplacer } from "./presets/request_replacer";
export { ACAuthResponseGuard, ACFetchedMarker, ACTokenUpdater, ACIdleMarker, } from "./presets/auth_client_guards";
//# sourceMappingURL=index.js.map