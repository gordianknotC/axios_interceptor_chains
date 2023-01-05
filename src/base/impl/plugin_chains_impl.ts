import { assert, AssertMsg } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from "axios";
import type { IRemoteClientService,  } from "../itf/remote_client_service_itf";



/**
 * @typeParam INPUT -  process function 的輸入型別
 * @typeParam OUTPUT - process function 的輸出型別
 */
export abstract class BaseClientServicesPluginChains<INPUT, OUTPUT = INPUT> {
  static install(
    chain: BaseClientServicesPluginChains<any>[], 
    client: IRemoteClientService<any, any, any>,
    interceptors: "response" | "request"
  ){
    assert(chain.length >= 1);
    const master = chain[0];
    const tail = chain.slice(1);
    master.init(client);
    if (tail.length >= 1){
      master.addAll(tail)
    }
    if (interceptors == "response"){
      client.client.interceptors.response.use(
        function(response: AxiosResponse){
          if (master.canProcess(response)){
            return master.process(response);
          }
          return response;
        },
        function(error: AxiosError){
          if (master.canProcessError(error)){
            return master.processError(error);
          }
          return Promise.reject(error);
        }
      )
    }else{
      client.client.interceptors.request.use(
        function(config: AxiosRequestConfig){
          if (master.canProcess(config)){
            return master.process(config);
          }
          return config;
        },
        function(error: AxiosError){
          if (master.canProcessError(error)){
            return master.processError(error);
          }
          return Promise.reject(error);
        }
      )
    }
  }

  abstract prev?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract next?: BaseClientServicesPluginChains<INPUT, OUTPUT>;
  abstract client?: IRemoteClientService<any, any, any>;
  abstract process(config: INPUT): OUTPUT;
  abstract processError(error: any): Promise<any>;
  addNext(next: BaseClientServicesPluginChains<INPUT, OUTPUT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.next = next;
    next.prev = this;
  }
  addPrev(prev: BaseClientServicesPluginChains<INPUT, OUTPUT>) {
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    this.prev = prev;
    prev.next = this;
  }
  addAll(all: BaseClientServicesPluginChains<INPUT, OUTPUT>[]) {
    if (all.length == 1) return;
    assert(
      () => this.client != undefined,
      "undefined client"
    );
    const allSerial = [this, ...all];
    for (let i = 0; i < allSerial.length - 1; i++) {
      all[i].init(this.client!);
      all[i].addNext(all[i + 1]);
    }
  }

  protected canGoNext(config: INPUT): boolean {
    return this.next != undefined;
  }
  protected canProcess(config: INPUT): boolean {
    return true;
  }
  protected canProcessError(error: AxiosError): boolean {
    return true;
  }
  init(client: IRemoteClientService<any, any, any>) {
    this.client = client;
  }
}
