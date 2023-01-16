import { LogModules } from "@/setup/logger.setup";
import { wait } from "@/utils/common_utils";
import { AsyncQueue, Completer, Logger, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import axios, { AxiosResponse, AxiosError } from "axios";
import { IBaseClient, EClientStage, QueueRequest, IBaseAuthClient } from "../itf/client_itf";
import { BaseClientServicesPluginChains } from "../itf/plugin_chains_itf";
import { BaseClientServiceResponsePlugin } from "./response_plugins_impl";

const D = new Logger(LogModules.AuthGuard);


/**{@inheritdoc BaseClientServiceResponsePlugin} 
 * 用來處理當 request 發出後出現 401/Unauthorized error，處理流程為
 * - {@link canProcessReject} > {@link processReject}
 *    - {@link onRestoreRequest}
 *    - {@link onRequestNewAuth}
 *        - {@link onAuthError}
 *        - {@link onAuthSuccess}
 *        - {@link onAuthUncaughtError}
*/
export class BaseAuthResponseGuard 
  extends BaseClientServiceResponsePlugin<
    IBaseClient<any, any, any>
  > 
{
  client?: IBaseClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>>;

  constructor() {
    super();
  }

  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return false;
  }
  
  //
  //
  //    R E J E C T
  //
  //

  /** 
   * @extendSummary - 
   * 當 error.response?.status == axios.HttpStatusCode.Unauthorized 
   * 時可進行至 processReject 處理 
   */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return error.response?.status == axios.HttpStatusCode.Unauthorized;
  }

  /**
  * @extendSummary - 用來處理 unauthorized error 下，保流原請求後，進行 token 換發，流程為：
  * - {@link onRestoreRequest}
  * - {@link onRequestNewAuth}
  *     - {@link onAuthError}
  *     - {@link onAuthSuccess}
  *     - {@link onAuthUncaughtError}
  */
  async processReject(error: AxiosError): Promise<AxiosResponse | AxiosError> {
    const pending = this.onRestoreRequest(error);
    const authResponse = this.onRequestNewAuth(error, pending);
    return super.processFulFill(await pending.future);
  }
 
  /** ### 用來生成代替 unauthorized error 的空請求
   * 當 unauthorized error 後，auth token 換發前，會生成一個空的 Promise 請求，
   * 以代替原請求因 unauthorized error 所產生的錯誤，{@link BaseAuthResponseGuard} 會先
   * 返回這個空的 Promise 好讓原 axios 的請求持續等待。
   * @param error - {@link AxiosError}
   * @returns - {@link Completer<any, QueueItem>}
   */
  protected onRestoreRequest(error: AxiosError): Completer<any, QueueItem>{
    const requestConfig = error.config!;
    D.info(["enqueue request:", requestConfig]);
    const timeout = this.client!.axios.defaults.timeout ?? 10 * 1000;
    const item = this.client?.queue.enqueueWithoutId(() => {
      return wait(timeout);
    })!;
    (item!._meta!.meta as QueueRequest) = { requestConfig };
    return item;
  }

  /** ### 用來定義當 unauthorized error 後，auth token 換發時的主要邏輯, 預設為 this.client.auth()
   * @param error - {@link AxiosError}
   * @param pendingRequest - 由{@link onRestoreRequest} 所生成的 pendingRequest，
   * 其內容為一個永不 resolve 的 Promise 物件，直到 auth token 重新換發後再次重新送出原請求，才
   * 會更新 pendingRequest 的內容，在這之前 pendingRequest 的 Promise 物件會一直保持 pending，
   * 除非 timeout
   */
  protected onRequestNewAuth(error: AxiosError,  pendingRequest: Completer<any, QueueItem>): Promise<AxiosResponse>{
    return this.client!.auth();
  }
}




export class BaseAuthResponseGuardForAuthClient 
  extends BaseClientServiceResponsePlugin<IBaseAuthClient<any, any, any>> 
{
  client?: IBaseAuthClient<any, any, any>;
  prev?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;
  next?: BaseClientServicesPluginChains<AxiosResponse, Promise<AxiosResponse>, IBaseAuthClient<any, any, any>>;

  get isAuthorizing(): boolean{
    return this.client!.hostClient!.stage == EClientStage.authorizing;
  }
  get hasQueue(): boolean{
    return !this.client!.hostClient!.queue.isEmpty;
  }
  get host(): IBaseClient<any, any, any>{
    return this.client!.hostClient!;
  }
  get queue(): AsyncQueue<QueueRequest>{
    return this.client!.hostClient!.queue;
  }
  constructor() {
    super();
  }

  /** ### 用來處理當 unauthorized error 後 auth token 換發成功
   * @param errorResponseBeforeReAuth - auth token 換發「前」失敗的 response 
   * @param queueItem - 於 {@link onBeforeRequestNewAuth} 所生成的新 Promise 請求，用來代替 ReAuth 前的失敗請求
   */
  protected onAuthSuccess(
    response: AxiosResponse<any, any>
  ): AxiosResponse{
    D.info(["onAuthSuccess"]);
    for (let index = 0; index < this.queue.queue.length; index++) {
      const completer = this.queue.queue[index];
      const id = completer._meta!.id;
      this.host.requestByConfig(
        (completer._meta!.meta as QueueRequest).requestConfig
      ).then((_) => {
        this.queue.dequeueByResult({ id, result: _ });
      });
    }
    return response;
  }

  /** ### 用來處理當 unauthorized error 後 auth token 可預期下的換發失敗
   * @param authFailedResponse - auth token 換發前失敗的 response 
   * @returns - {@link AxiosResponse}
   */
  protected onAuthError(authFailedResponse: AxiosResponse)  {
    D.info(["onAuthError"]);
    if (this.host!.option.authOption){
      const action = this.host!.option!.authOption!.redirect?.(authFailedResponse) ?? {
        clearQueue: true,
      };
      if (action.clearQueue) 
        this.client?.queue.clearQueue();
    }
  }
  
  protected onAuthUncaughtError(error: AxiosError<unknown, any>): void {
  }

  /** 
   * 1) 當 authorizing 發出時，2) request queue 有東西
  */
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    return this.isAuthorizing && this.hasQueue;
  }
  processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>> {
    return super.processFulFill(this.onAuthSuccess(response));
  }
  /** 當 authorizing 發出, 且被 reject */
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return this.isAuthorizing && error.response?.status == axios.HttpStatusCode.Unauthorized;
  }
  processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
    if (this.host.isErrorResponse(error.response)){
      this.onAuthError(error.response!);
    }else{
      this.onAuthUncaughtError(error);
    }
    return super.processReject(error);
  }
}