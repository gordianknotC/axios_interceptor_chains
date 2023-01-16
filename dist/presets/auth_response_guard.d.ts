import { BaseAuthResponseGuard, BaseAuthResponseGuardForAuthClient } from "../base/impl/base_auth_response_guard_impl";
import { BaseClientServicesPluginChains } from "../base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "../base/impl/response_plugins_impl";
import { IBaseClient } from "../base/itf/client_itf";
import { Completer, QueueItem } from "@gdknot/frontend_common";
import type { AxiosError, AxiosResponse } from "axios";
export declare class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
    client?: IBaseClient<any, any, any>;
    prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
export declare class AuthResponseGuard extends BaseAuthResponseGuard {
    protected onRequestNewAuth(error: AxiosError, pendingRequest: Completer<any, QueueItem>): Promise<AxiosResponse>;
}
export declare class AuthResponseGuardForAuthClient extends BaseAuthResponseGuardForAuthClient {
}
