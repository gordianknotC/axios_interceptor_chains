import { AsyncQueue } from "@gdknot/frontend_common";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export enum EClientStage {
    idle = "idle",
    fetching = "fetching",
    authorizing = "authorizing",
    // success,
    // error
}


export type RedirectAction = {
    clearQueue?: boolean
}
export type RemoteClientAuthOption = {
    url: string,
    baseURL: string,
    timeout?: number,
    payloadGetter: ()=>any,
    tokenGetter: ()=>any,
    tokenUpdater: (response: AxiosResponse)=>void,
    redirect?: (response: AxiosResponse)=>RedirectAction|undefined|null,
    interval?: number,
}
  

export abstract class IApiClientMethods<DATA , ERROR, SUCCESS> {
    abstract get(
        url: string,
        payload: Record<string, any>
    ): Promise<DATA | ERROR>;
    abstract post(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | DATA  | ERROR>;
    abstract put(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | DATA | ERROR>;
    abstract del(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | ERROR>;
}

/**  api client service */
export abstract class IRemoteClientService<DATA , ERROR, SUCCESS>
    implements IApiClientMethods<DATA, ERROR, SUCCESS>
{   
    abstract queue: AsyncQueue;
    abstract client: AxiosInstance;
    abstract stage: EClientStage;
    abstract authOption: Required<RemoteClientAuthOption>;
    abstract isDataResponse: (response: DATA | ERROR | SUCCESS)=> boolean;
    abstract isErrorResponse: (response: DATA | ERROR | SUCCESS)=> boolean;
    abstract isSuccessResponse: (response: DATA | ERROR | SUCCESS)=> boolean;
    abstract get(
        url: string,
        payload: Record<string, any>
    ): Promise<DATA | ERROR>;
    abstract requestByConfig(option: AxiosRequestConfig): Promise<AxiosResponse>;
    abstract auth(): Promise<DATA | ERROR | SUCCESS>;
    abstract post(
        url: string,
        payload: Record<string, any>
    ): Promise<DATA | ERROR | SUCCESS>;
    abstract put(
        url: string,
        payload: Record<string, any>
    ): Promise<DATA | ERROR | SUCCESS>;
    abstract del(
        url: string,
        payload: Record<string, any>
    ): Promise<ERROR | SUCCESS>;
}