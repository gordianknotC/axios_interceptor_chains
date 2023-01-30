import { BaseAuthResponseGuard } from "@/base/impl/base_auth_response_guard";
import { BaseClientServicesPluginChains } from "@/base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import { IBaseClient } from "@/base/itf/client_itf";
import { Completer, QueueItem } from "@gdknot/frontend_common";
import type { AxiosError, AxiosResponse } from "axios";
export declare class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin {
    client?: IBaseClient<any, any, any>;
    prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
/**{@inheritdoc} BaseAuthResponseGuard */
export declare class AuthResponseGuard extends BaseAuthResponseGuard {
    protected onRequestNewAuth(error: AxiosError): Promise<AxiosResponse>;
    protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>;
    processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>>;
    /**
     * @returns - 用來攔截以下二種情況
     * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
     */
    canProcessReject(error: AxiosError<unknown, any>): boolean;
}
