import { BaseClientServicesPluginChains } from "~/base/itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "~/base/impl/response_plugins_impl";
import { IBaseClient } from "~/base/itf/client_itf";
import { AxiosError, AxiosResponse } from "axios";


/** 
 * {@inheritdoc BaseClientServiceResponsePlugin} 
 * 用來攔截 Network Error
 * */
export class NetworkErrorResponseGuard
  extends BaseClientServiceResponsePlugin {
  client?: IBaseClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<
    AxiosResponse, Promise<AxiosResponse>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosResponse, Promise<AxiosResponse>
  >;
  constructor(public networkErrorHandler: (error: AxiosError) => void) {
    super();
  }
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return false;
  }
  /**
   * @extendSummary - 
   * 這裡只查找 error.message.toLowerCase() == "network error" 者, 若成立則 {@link processReject}
   */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    try {
      return error.message.toLowerCase() == "network error";
    } catch (e) {
      console.error("Exception on canProcessReject, error:", error);
      return false;
    }
  }

  /**
   * @extendSummary - 
   * 執行 {@link networkErrorHandler} 並繼續 responsibility chain
   */
  processReject(error: AxiosError<unknown, any>): Promise<any> {
    this.networkErrorHandler(error);
    return this.reject(error);
    return super.processReject(error);
  }
}
