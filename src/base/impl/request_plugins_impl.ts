import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseClientServicesPluginChains } from "./plugin_chains_impl";

export type AxiosConfigHeader = {
  common: {
    Authorization: string;
  };
};

export abstract class BaseClientServiceRequestPlugin 
  extends BaseClientServicesPluginChains<AxiosRequestConfig> 
{
  constructor(){
    super();
  }
  canGoNext(config: AxiosRequestConfig): boolean {
    return super.canGoNext(config);
  }
  canProcess(config: AxiosRequestConfig): boolean {
    return super.canProcess(config);
  }
  canProcessError(error: AxiosError<unknown, any>): boolean {
      return super.canProcessError(error);
  }

  process(config: AxiosRequestConfig): AxiosRequestConfig {
    if (this.canGoNext(config) && this.next) {
      return this.next.process(config);
    }
    return config;
  }

  processError(error: AxiosError): Promise<AxiosResponse> {
    if (this.next) {
      return this.next.processError(error);
    }
    return Promise.reject(error.response);
  }
}
