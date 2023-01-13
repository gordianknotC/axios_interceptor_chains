import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  BaseClientServicesPluginChains,
  processRequestFulFill,
  processRequestReject,
} from "./plugin_chains_impl";

export type AxiosConfigHeader = {
  common: {
    Authorization: string;
  };
};


export abstract class BaseClientServiceRequestPlugin extends BaseClientServicesPluginChains<AxiosRequestConfig> {
  constructor() {
    super();
  }
  canGoNext(config: AxiosRequestConfig): boolean {
    return super.canGoNext(config);
  }
  canProcessFulFill(config: AxiosRequestConfig): boolean {
    return super.canProcessFulFill(config);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return super.canProcessReject(error);
  }

  processFulFill(config: AxiosRequestConfig): AxiosRequestConfig {
    return processRequestFulFill(config, this.next);
  }

  processReject(error: AxiosError): Promise<any> {
    return processRequestReject(error, this.next);
  }
}
