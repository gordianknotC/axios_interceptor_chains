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

  protected canProcessError(error: AxiosError<unknown, any>): boolean {
    return super.canProcessError(error);
  }

  process(response: AxiosResponse): Promise<AxiosResponse> {
    if (this.canGoNext(response) && this.next) {
      return this.next.process(response);
    }
    return Promise.resolve(response);
  }

  processError(error: any): Promise<any> {
    if (this.next) {
      return this.next.processError(error);
    }
    return Promise.reject(error);
  }
}
