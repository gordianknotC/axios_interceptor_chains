import type { AxiosError, AxiosResponse } from "axios";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";

export
abstract class BaseClientServiceResponsePlugin 
  extends BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  > 
{
  canGoNext(config: AxiosResponse): boolean {
    return super.canGoNext(config);
  }

  canProcess(config: AxiosResponse): boolean {
    return super.canProcess(config);;
  }

  canProcessError(error: AxiosError<unknown, any>): boolean {
    return super.canProcessError(error);
  }

  /** user override this should call super
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   */
  process(response: AxiosResponse): Promise<AxiosResponse> {
    if (this.next && this.canGoNext(response)) {
      if (this.next.canProcess(response))
        return this.next.process(response).catch((e)=>{
          console.error(`catch on process:`, e);
          return Promise.reject(e);
        });
    }
    return Promise.resolve(response);
  }

  /** user override this should call super
   * 覆寫請記得 call super，不然 responsibility chain 不會繼續
   */
  processError(error: any): Promise<any> {
    if (this.next && this.canGoNext(error.response)) {
      if (this.next.canProcessError(error.response))
        return this.next.processError(error).catch((e)=>{
          console.error('catch on processError', e);
          return Promise.reject(e);
        });
    }
    return Promise.reject(error);
  }
}
