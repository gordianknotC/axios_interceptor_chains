import {
  UpdateAuthHeaderPlugin,
  UpdateExtraHeaderPlugin,
} from "@/presets/request_header_updater";
import { AuthResponseGuard, AuthResponseGuardForAuthClient } from "@/presets/auth_response_guard";
import { NetworkErrorResponseGuard } from "@/presets/network_error_response_guard";
import { AxiosResponse } from "axios";
import { ClientOption } from "@/base/itf/client_itf";
import { RequestReplacer } from "@/presets/request_replacer";


export type DataResponse<T> = { 
  data: T; pager: any
 };
export type ErrorResponse = {
  error_key: string;
  error_code: string;
  error_msg: string;
  message: string;
};
export type SuccessResponse = { succeed: boolean };
export type AuthResponse = DataResponse<{
  token: string
}>

const timeout = 10 * 1000;
const baseURL = "http://localhost";

export const authToken = { value: "I'M Auth Token" };
export const formatHeader = { value: { format: "mock" } };
export const authUrl = "path/to/auth_url";

export const requestClientOption: ClientOption<
  DataResponse<any>,
  ErrorResponse,
  SuccessResponse
> = {
  isSuccessResponse: (s: any) => (s as SuccessResponse).succeed != undefined,
  isDataResponse: (d: any) => (d as DataResponse<any>).data != undefined,
  isErrorResponse: (e: any) => (e as ErrorResponse).error_code != undefined,
  axiosConfig: {
    baseURL,
    timeout,
  },
  requestChain: [
    new UpdateAuthHeaderPlugin(function () {
      return authToken.value;
    }),
    new UpdateExtraHeaderPlugin(function () {
      return formatHeader.value;
    }),
    new RequestReplacer(),
    
  ],
  responseChain: [
    new AuthResponseGuard(),
    new NetworkErrorResponseGuard(function networkError(error){
      console.log("detect network error:", error);
    }),
  ],
  authOption: {
    axiosConfig: {
      url: authUrl,
      baseURL,
      timeout: 12000,
    },
    interval: 600,
    requestChain: [],
    responseChain: [
      new AuthResponseGuardForAuthClient()
    ],
    payloadGetter: function () {
      return null;
    },
    tokenGetter: function () {
      return authToken.value;
    },
    tokenUpdater: function (response: AxiosResponse<any, any>): void {
      authToken.value = (response.data as any).data.token;
      console.log("tokenUpdater:", authToken.value);
    },
    redirect: function (response: AxiosResponse<any, any>) {
      console.log("redirect home");
      return null;
    },
  },
};
