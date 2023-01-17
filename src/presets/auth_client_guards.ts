import {
  EClientStage,
  IBaseClient,
  QueueRequest,
} from "@/base/itf/client_itf";
import { Completer, Logger, QueueItem, UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { AuthClientResponseGuard } from "@/base/impl/base_auth_client_response_guard";
import { LogModules } from "@/setup/logger.setup";

const D = new Logger(LogModules.AuthClient);


export class ACAuthResponseGuard extends AuthClientResponseGuard {
  /** ### 用來處理當 unauthorized error 後 auth token 換發成功
   * @param errorResponseBeforeReAuth - auth token 換發「前」失敗的 response 
   * @param queueItem - 於 {@link onBeforeRequestNewAuth} 所生成的新 Promise 請求，用來代替 ReAuth 前的失敗請求
   */
  protected onAuthSuccess(
    response: AxiosResponse<any, any>
  ): AxiosResponse{
    D.info(["onAuthSuccess"]);
    this.client?.markIdle()
    for (let index = 0; index < this.queue.queue.length; index++) {
      const completer = this.queue.queue[index];
      const id = completer._meta!.id;
      this.host.requestByConfig(
        (completer._meta!.meta as QueueRequest).requestConfig
      ).then((_) => {
        this.queue.dequeueByResult({ id, result: _ });
        D.info(["dequeueByResult, id:", id, "result:", _]);
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
    return (this.isAuthorizing || this.isFetched) && this.hasQueue;
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
    return this.host.isDataResponse(response);
  }
  processFulFill(response: AxiosResponse<any, any>): Promise<AxiosResponse<any, any>> {
    D.current(["ACTokenUpdater:", response])
    this.client?.option.tokenUpdater(response)
    this.client?.markUpdated();
    return super.processFulFill(response);
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    return false;
  }
}

/** markIdle */
export class ACFetchedMarker extends AuthClientResponseGuard {
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    this.client!.markFetched();
    return false;
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    this.client!.markFetched();
    return false;
  }
}

/** markIdle */
export class ACIdleMarker extends AuthClientResponseGuard {
  canProcessFulFill(config: AxiosResponse<any, any>): boolean {
    this.client!.markIdle();
    return false;
  }
  canProcessReject(error: AxiosError<unknown, any>): boolean {
    this.client!.markIdle();
    return false;
  }
}