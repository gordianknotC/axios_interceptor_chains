import {
  AuthRequestHeaderUpdater,
  ExtraRequestHeaderUpdater,
} from "~/presets/request_header_updater";
import { AuthResponseGuard } from "~/presets/auth_response_guard";
import { NetworkErrorResponseGuard } from "~/presets/network_error_response_guard";
import axios, { Axios, AxiosResponse, AxiosStatic, HttpStatusCode } from "axios";
import { ClientOption } from "~/base/itf/client_itf";
import { RequestReplacer } from "~/presets/request_replacer";
import { ACAuthResponseGuard, ACFetchedMarker, ACIdleMarker, ACTokenUpdater } from "~/presets/auth_client_guards";
import { AxiosTestHelper } from "../helpers/axo.test.helper";
import { authToken, _EErrorCode } from "../__mocks__/axios";

export const EErrorCode = _EErrorCode;
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

export const formatHeader = { value: { format: "mock" } };
const authUrl = "path/to/auth_url";

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
    new AuthRequestHeaderUpdater(function () {
      return authToken.value;
    }),
    new ExtraRequestHeaderUpdater(function () {
      return formatHeader.value;
    }),
    new RequestReplacer(
      // replacementIdentifier = BaseRequestReplacer...
    ),
  ],
  responseChain: [
    new AuthResponseGuard(
    ),
    new NetworkErrorResponseGuard(
      function networkError(error){
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
      new ACFetchedMarker(),
      new ACTokenUpdater(),
      new ACAuthResponseGuard(),
      new ACIdleMarker(),
    ],
    payloadGetter: function () {
      return null;
    },
    tokenGetter: function () {
      console.log("tokenGetter:", authToken.value);
      return authToken.value;
    },
    tokenUpdater: function (response: AxiosResponse<any, any>): void {
      try{
        console.log("tokenUpdater", (response.data as any).data.token)
        authToken.value = (response.data as any).data.token;
      }catch(e){
        console.error("tokenUpdater error, response:", response, "\nerror:", e);
        throw e;
      }
    },
    redirect: function (response: AxiosResponse<any, any>) {
      console.log("redirect home");
      return null;
    },
  },
};
