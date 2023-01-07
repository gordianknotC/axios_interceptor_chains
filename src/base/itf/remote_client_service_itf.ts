import type { AxiosInstance } from "axios";

export enum EClientStage {
    idle,
    fetching,
    authorizing,
    // success,
    // error
}

export type DataResponse<T, P=any> = {
    data: T;
    pager?: P;
  };

export abstract class IApiClientMethods<T extends DataResponse<any>, ERROR, SUCCESS> {
    abstract get(
        url: string,
        payload: Record<string, any>
    ): Promise<T | ERROR>;
    abstract post(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | T  | ERROR>;
    abstract put(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | T | ERROR>;
    abstract del(
        url: string,
        payload: Record<string, any>
    ): Promise<SUCCESS | ERROR>;
}

/**  api client service */
export abstract class IRemoteClientService<T extends DataResponse<any>, ERROR, SUCCESS>
    implements IApiClientMethods<T, ERROR, SUCCESS>
{
    abstract client: AxiosInstance;
    abstract stage: EClientStage;
    abstract isDataResponse(response: T | ERROR | SUCCESS): boolean;
    abstract isErrorResponse(response: T | ERROR | SUCCESS): boolean;
    abstract isSuccessResponse(response: T | ERROR | SUCCESS): boolean;
    abstract get(
        url: string,
        payload: Record<string, any>
    ): Promise<T | ERROR>;
    abstract post(
        url: string,
        payload: Record<string, any>
    ): Promise<T | ERROR | SUCCESS>;
    abstract put(
        url: string,
        payload: Record<string, any>
    ): Promise<T | ERROR | SUCCESS>;
    abstract del(
        url: string,
        payload: Record<string, any>
    ): Promise<ERROR | SUCCESS>;
}