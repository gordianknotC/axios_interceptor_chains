"use strict";
//
//
//  INTERFACES
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACIdleMarker = exports.ACTokenUpdater = exports.ACFetchedMarker = exports.ACAuthResponseGuard = exports.RequestReplacer = exports.AuthResponseGuard = exports.NetworkErrorResponseGuard = exports.ExtraRequestHeaderUpdater = exports.AuthRequestHeaderUpdater = exports.BaseRequestHeaderGuard = exports.BaseRequestReplacer = exports.BaseAuthResponseGuard = exports.BaseClientServiceResponsePlugin = exports.BaseClient = exports.BaseClientServiceRequestPlugin = exports.ChainActionStage = exports.BaseClientServicesPluginChains = exports.EClientStage = void 0;
var client_itf_1 = require("./base/itf/client_itf");
Object.defineProperty(exports, "EClientStage", { enumerable: true, get: function () { return client_itf_1.EClientStage; } });
//
//
//  BASE IMPLEMENTATION
//
//
var plugin_chains_itf_1 = require("./base/itf/plugin_chains_itf");
Object.defineProperty(exports, "BaseClientServicesPluginChains", { enumerable: true, get: function () { return plugin_chains_itf_1.BaseClientServicesPluginChains; } });
Object.defineProperty(exports, "ChainActionStage", { enumerable: true, get: function () { return plugin_chains_itf_1.ChainActionStage; } });
var request_plugins_impl_1 = require("./base/impl/request_plugins_impl");
Object.defineProperty(exports, "BaseClientServiceRequestPlugin", { enumerable: true, get: function () { return request_plugins_impl_1.BaseClientServiceRequestPlugin; } });
var base_client_impl_1 = require("./base/impl/base_client_impl");
Object.defineProperty(exports, "BaseClient", { enumerable: true, get: function () { return base_client_impl_1.BaseClient; } });
var response_plugins_impl_1 = require("./base/impl/response_plugins_impl");
Object.defineProperty(exports, "BaseClientServiceResponsePlugin", { enumerable: true, get: function () { return response_plugins_impl_1.BaseClientServiceResponsePlugin; } });
var base_auth_response_guard_1 = require("./base/impl/base_auth_response_guard");
Object.defineProperty(exports, "BaseAuthResponseGuard", { enumerable: true, get: function () { return base_auth_response_guard_1.BaseAuthResponseGuard; } });
var base_request_replacer_1 = require("./base/impl/base_request_replacer");
Object.defineProperty(exports, "BaseRequestReplacer", { enumerable: true, get: function () { return base_request_replacer_1.BaseRequestReplacer; } });
var base_request_guard_1 = require("./base/impl/base_request_guard");
Object.defineProperty(exports, "BaseRequestHeaderGuard", { enumerable: true, get: function () { return base_request_guard_1.BaseRequestHeaderGuard; } });
//
//
//  PRESETS
//
//
var request_header_updater_1 = require("./presets/request_header_updater");
Object.defineProperty(exports, "AuthRequestHeaderUpdater", { enumerable: true, get: function () { return request_header_updater_1.AuthRequestHeaderUpdater; } });
Object.defineProperty(exports, "ExtraRequestHeaderUpdater", { enumerable: true, get: function () { return request_header_updater_1.ExtraRequestHeaderUpdater; } });
var network_error_response_guard_1 = require("./presets/network_error_response_guard");
Object.defineProperty(exports, "NetworkErrorResponseGuard", { enumerable: true, get: function () { return network_error_response_guard_1.NetworkErrorResponseGuard; } });
var auth_response_guard_1 = require("./presets/auth_response_guard");
Object.defineProperty(exports, "AuthResponseGuard", { enumerable: true, get: function () { return auth_response_guard_1.AuthResponseGuard; } });
var request_replacer_1 = require("./presets/request_replacer");
Object.defineProperty(exports, "RequestReplacer", { enumerable: true, get: function () { return request_replacer_1.RequestReplacer; } });
var auth_client_guards_1 = require("./presets/auth_client_guards");
Object.defineProperty(exports, "ACAuthResponseGuard", { enumerable: true, get: function () { return auth_client_guards_1.ACAuthResponseGuard; } });
Object.defineProperty(exports, "ACFetchedMarker", { enumerable: true, get: function () { return auth_client_guards_1.ACFetchedMarker; } });
Object.defineProperty(exports, "ACTokenUpdater", { enumerable: true, get: function () { return auth_client_guards_1.ACTokenUpdater; } });
Object.defineProperty(exports, "ACIdleMarker", { enumerable: true, get: function () { return auth_client_guards_1.ACIdleMarker; } });
//# sourceMappingURL=index.js.map