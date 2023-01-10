import { BaseClientServicesPluginChains } from "@/base/impl/plugin_chains_impl";
import { BaseClientServiceResponsePlugin } from "@/base/impl/response_plugins_impl";
import { EClientStage, IRemoteClientService } from "@/base/itf/remote_client_service_itf";
import { UnExpectedError } from "@gdknot/frontend_common";
import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";

export class ForbiddenResponseGuard extends BaseClientServiceResponsePlugin{
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;

  canProcessError(error: AxiosError<unknown, any>): boolean {
    const status = error.response!.status;
    return status == axios.HttpStatusCode.Forbidden;
  }
}


export class AuthResponseGuard 
  extends BaseClientServiceResponsePlugin{
  client?: IRemoteClientService<any, any, any>;
  prev?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;
  next?: BaseClientServicesPluginChains<
    AxiosResponse,
    Promise<AxiosResponse>
  >;

  private _stage: EClientStage;
  get stage(){
    return this._stage;
  };

  constructor(){
    super();
    this._stage = EClientStage.idle;
  }
  protected onAuthError(response: AxiosResponse): AxiosResponse{
    this.client!.authOption.redirect(response);
    this.client?.queue.clearQueue();
    return response;
  }
  protected onAuthSuccess(response: AxiosResponse): AxiosResponse {
    if (this.client!.queue.isEmpty)
      return response;
    for (let index = 0; index < this.client!.queue.queue.length; index++) {
      const queueItem = this.client!.queue.queue[index];
      const id = queueItem.id;
      this.client?.queue.dequeueByResult({
        id, 
        result:()=>{
          return this.client!.client(queueItem.meta.requestConfig);
        }
      });
    }
    return response;
  }
  protected onAuthUnexpectedReturn(response: AxiosResponse): AxiosResponse{
    return response;
  }

  //
  //  process
  //
  canProcess(config: AxiosResponse<any, any>): boolean {
    return true;
  }

  async process(response: AxiosResponse): Promise<AxiosResponse> {
    try{
      const timeout = this.client!.client.defaults.timeout;
      const authorized = await this.client!.auth();
      if (this.client?.isErrorResponse(authorized)){
        return super.process(this.onAuthError(response));
      }else if (this.client?.isDataResponse){
        return super.process(this.onAuthSuccess(response));
      }else{
        console.error(
          new UnExpectedError (`
            authorization request returns an unexpected response: ${JSON.stringify(authorized)}
          `));
        return super.process(this.onAuthUnexpectedReturn(response));
      }
    }catch(e){
      throw e;
    }
    
  }

  //
  //  process error
  //
  canProcessError(error: AxiosError<unknown, any>): boolean {
    const status = error.response!.status;
    return status == axios.HttpStatusCode.Unauthorized;
  }

  processError(error: AxiosError): Promise<AxiosResponse> {
    console.log(error);
    this.onAuthError(error.response!);
    // return Promise.reject(this.onAuthError(error.response!));
    return super.processError(error);
  }
}
