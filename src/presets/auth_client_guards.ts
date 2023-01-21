import {
  EClientStage,
  IBaseClient,
  QueueRequest,
} from "@/base/itf/client_itf";
import { Completer, Logger, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { AuthClientResponseGuard, AuthClientStageMarker } from "@/base/impl/base_auth_client_response_guard";
import { LogModules } from "@/setup/logger.setup";
import { assert } from "console";

const D = new Logger(LogModules.AuthClient);

export class ACAuthResponseGuard extends AuthClientResponseGuard {
  /** 當request 進行取代持會 raise 這個 exception */
  static configActionName: string = "ACAuthResponseGuard.bypassAuthGuard";

  /** ### 用來處理當 unauthorized error 後 auth token 換發成功
   * @param errorResponseBeforeReAuth - auth token 換發「前」失敗的 response 
   * @param queueItem - 於 {@link onBeforeRequestNewAuth} 所生成的新 Promise 請求，用來代替 ReAuth 前的失敗請求
   */
  protected onAuthSuccess(
    response: AxiosResponse<any, any>
  ): AxiosResponse{
    D.info(["onAuthSuccess, pending queues:", this.queue.queue.length]);
    for (let index = 0; index < this.queue.queue.length; index++) {
      const completer = this.queue.queue[index];
      const id = completer._meta!.id;
      const config = (completer._meta!.meta as QueueRequest).requestConfig;
      (config as any).headers["__chain_action__"] = ACAuthResponseGuard.configActionName;
      // const config = this.markDirty((completer._meta!.meta as QueueRequest).requestConfig);
      this.host.requestByConfig(config).then((_) => {
        this.queue.dequeueByResult({ id, result: _ });
        D.info(["dequeueByResult, id:", id, "result:", _]);
      }).catch(async (e)=>{
        if (completer.isRejected){ 
          this.queue.dequeueByResult({id: completer._meta!.id!, result: {}});
          return completer.future;
        }
        completer.reject(e);
        this.queue.dequeueByResult({id: completer._meta!.id!, result: {}});
        return e;
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
  canProcessFulFill(response: AxiosResponse<any, any>): boolean {
    return (this.isUpdated) && this.hasQueue;
  }
  processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>> {
    return super.processFulFill(this.onAuthSuccess(response));
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
      return true;
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


/** markIdle */
export class ACTokenUpdater extends AuthClientResponseGuard {
  canProcessFulFill(response: AxiosResponse<any, any>): boolean {
    D.info(["ACTokenUpdater.canProcessFulFill, response:", response]);
    return this.host.isDataResponse(response)
      && (response.status == axios.HttpStatusCode.Ok);
  }
  processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>> {
    this.client?.option.tokenUpdater(response)
    D.current(["ACTokenUpdater:", response.data, this.client?.option.tokenGetter()])
    if (this.client?.option.tokenGetter() == undefined){
      throw new Error("Unexpected tokenGetter/tokenUpdater");
    }
    this.client?.markUpdated();
    return super.processFulFill(response);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return false;
  }
}

/** markIdle */
export class ACFetchedMarker extends AuthClientStageMarker {
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    this.client!.markFetched();
    return super.canProcessFulFill(config);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    this.client!.markFetched();
    return super.canProcessReject(error);
  }
}

/** markIdle */
export class ACIdleMarker extends AuthClientStageMarker {
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    this.client!.markIdle();
    return super.canProcessFulFill(config);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    this.client!.markIdle();
    return super.canProcessReject(error);
  }
}