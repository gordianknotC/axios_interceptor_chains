import {
  UpdateAuthHeaderPlugin,
  UpdateExtraHeaderPlugin,
} from "@/presets/request_header_updater";
import { AuthResponseGuard } from "@/presets/auth_response_guard";
import { NetworkErrorResponseGuard } from "@/presets/network_error_response_guard";
import { AxiosHeaders, AxiosResponse } from "axios";
import { RemoteClientOption } from "@/base/impl/remote_client_impl";
import { RedirectAction } from "@/base/itf/remote_client_service_itf";
import { RequestReplacer } from "@/presets/request_replacer";
import { assert } from "@gdknot/frontend_common";


export type DataResponse<T> = { data: T; pager: any };
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

console.log("UpdateAuthHeaderPlugin:", UpdateAuthHeaderPlugin);
export const remoteClientOption: RemoteClientOption<
  DataResponse<any>,
  ErrorResponse,
  SuccessResponse
> = {
  isSuccessResponse: (s) => (s as SuccessResponse).succeed != undefined,
  isDataResponse: (d) => (d as DataResponse<any>).data != undefined,
  isErrorResponse: (e) => (e as ErrorResponse).error_code != undefined,
  config: {
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
    url: authUrl,
    baseURL,
    timeout: 12000,
    interval: 600,
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

assert(()=>remoteClientOption.requestChain.length == 3, "Uncaught error");
assert(()=>remoteClientOption.responseChain.length == 2, "Uncaught error");