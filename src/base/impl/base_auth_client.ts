import { EClientStage, IBaseClient as IBaseClient, ClientAuthOption, ClientOption, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { is, Obj, Queue, assert, AsyncQueue, Logger, Completer } from "@gdknot/frontend_common";
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
  requester?: (() => Promise<DATA | ERROR | SUCCESS>) | undefined;
  authCompleter?: Completer<any>;

  /** numbers of all authorization calls */
  private _totalAuthCounter: number = 0;
  /** numbers of all authorization calls in last second*/
  private authCounter: number = 0;
  private authCounterTimeout?: NodeJS.Timeout;
  private authCompleterTimeout?: NodeJS.Timeout;
  private _lastT: number = (new Date()).getTime();
  get callInterval(): number{
    return (new Date()).getTime() - this._lastT;
  }
  get canAuth(): boolean{
    return this.authCompleter == undefined
      && (
        this.hostClient.stage == EClientStage.idle
        || this.hostClient.stage == EClientStage.fetching
      );
  }

  constructor(
    public option: ClientAuthOption, 
    public hostClient: IBaseClient<DATA , ERROR, SUCCESS, QUEUE>,
    public markAuthorizing: ()=>void,
    public markIdle: ()=>void,
    public markFetched: ()=>void,
    public markUpdated: ()=>void,
  ){
    D.info(["AuthClient init"])
    const {requestChain, responseChain, axiosConfig: config, interval} = option;
    const authDebounceImmediate = true;
    this.requestChain = requestChain;
    this.responseChain = responseChain;
    this.queue = new AsyncQueue();
    this.axios = axios.create(config);
    this.requester = async ()=>{
      try{
        this.authCounter ++;
        if (!this.canAuth){
          D.info(["auth already called, wait for response, completer:", this.hostClient.stage, this.authCompleter])
          return this.authCompleter!.future;
        }
        
        this.authCompleter = new Completer();
        markAuthorizing()
        const _inst = this.axios!;
        const {axiosConfig, payloadGetter, tokenGetter, tokenUpdater} = option!;
        const {url} = axiosConfig;
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
        D.current(["auth response!"]);
        this.authCompleter.complete(response.data);
        const completer = this.authCompleter;
        this.resetCompleter(interval ?? 600);
        return completer.future;
      } catch(err){
        console.error("Exception on auth request:", err);
        this.authCompleter = undefined;
        markIdle();
        return Promise.reject(err)
      }
    };

    if (is.not.empty(requestChain)){
      BaseClientServicesPluginChains.install(requestChain, this, "request");
    }
    if (is.not.empty(responseChain)){
      BaseClientServicesPluginChains.install(responseChain, this, "response");
    }

    setInterval(()=>{
      this.resetAuthCounter();
    }, 1000)
  }

  protected resetCompleter(interval: number){
    this._lastT = (new Date()).getTime();
    clearTimeout(this.authCompleterTimeout);
    this.authCompleterTimeout = setTimeout(()=>{
      this.authCompleter = undefined
    }, interval);
  }

  protected resetAuthCounter(idleTime: number = 2000){
    this._totalAuthCounter += this.authCounter;
    this.authCounter = 0;
  }
}