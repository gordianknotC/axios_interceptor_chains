import type { AxiosError, AxiosResponse } from "axios";
import {
  BaseClientServicesPluginChains,
  processResponseFulFill,
  processResponseReject,
} from "./plugin_chains_impl";


export abstract class BaseClientServiceResponsePlugin extends BaseClientServicesPluginChains<
  AxiosResponse,
  Promise<AxiosResponse>
> {
  canGoNext(config: AxiosResponse): boolean {
    return super.canGoNext(config);
  }

  canProcessFulFill(response: AxiosResponse): boolean {
    return super.canProcessFulFill(response);
  }

  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return super.canProcessReject(error);
  }
  /** user override this should call super
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   */
  processFulFill(response: AxiosResponse): Promise<AxiosResponse> {
    return processResponseFulFill(response, this.next);
  }

  /** user override this should call super
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   */
  processReject(error: AxiosError): Promise<AxiosError | AxiosResponse> {
    return processResponseReject(error, this.next);
  }
}
