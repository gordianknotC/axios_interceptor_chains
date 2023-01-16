import { EClientStage, IBaseClient as IBaseClient, ClientAuthOption, ClientOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { is, Obj, Queue, assert, AsyncQueue, Logger } from "@gdknot/frontend_common";
import debounce from "debounce";
import { RawAxiosHeaders } from "@/presets/request_header_updater";
import { timeStamp } from "console";
import { LogModules } from "@/setup/logger.setup";

const D = new Logger(LogModules.Client) 

export class BaseAuthClient<DATA , ERROR, SUCCESS, QUEUE extends QueueRequest=QueueRequest> 
implements IBaseAuthClient<DATA, ERROR, SUCCESS, QUEUE> {
  requestChain: BaseClientServicesPluginChains<AxiosRequestConfig<any>, AxiosRequestConfig<any>, any>[];
  responseChain: BaseClientServicesPluginChains<AxiosResponse<any, any>, Promise<AxiosResponse<any, any>>, any>[];
  queue: Queue<QUEUE>;
  axios: AxiosInstance;
  requester?: ((() => Promise<DATA | ERROR | SUCCESS>) & { clear: () => void; }) | undefined;
  constructor(
    public option: ClientAuthOption, 
    public hostClient: IBaseClient<DATA , ERROR, SUCCESS, QUEUE>,
    private idleSetter: ()=>void,
  ){
    const {requestChain, responseChain, axiosConfig: config} = option;
    const authDebounceImmediate = true;

    this.requestChain = requestChain;
    this.responseChain = responseChain;
    this.queue = new AsyncQueue();
    this.axios = axios.create(config);
    this.requester = debounce(async ()=>{
      try{
        const _inst = this.axios!;
        const {url, payloadGetter, tokenGetter, tokenUpdater} = option!;
        const axiosOption = {
          method: "post",
          url,
          data: payloadGetter(),
          headers: {
            Authorization: tokenGetter()
          }
        };
        if (payloadGetter())
          axiosOption.data = payloadGetter();

        D.current(["auth before fetch!", url]);
        const response = await _inst(axiosOption);
        D.current(["auth response!", response]);
        tokenUpdater(response);
        // 這裡直接存取私有屬性，以繞開 setStage 於 authorizing 下不能轉 idle
        // authorizing 變更為 idle 只能透過 private _stage
        idleSetter();
        return response.data;
      } catch(err){
        console.error("Exception on auth request:", err);
        idleSetter();
        throw err;
      }
    }, option.interval, authDebounceImmediate);

    if (is.not.empty(requestChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (is.not.empty(responseChain)){
      BaseClientServicesPluginChains.install(responseChain, this, "response");
    }
  }
}