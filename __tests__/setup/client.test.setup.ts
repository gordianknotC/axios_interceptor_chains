import { UpdateAuthHeaderPlugin, UpdateExtraHeaderPlugin } from "@/presets/header_updater";
import { AuthResponseGuard  } from "@/presets/auth_response_guard";
import { AxiosResponse } from "axios";
import { RemoteClientOption } from "@/base/impl/remote_client_impl";

export type DataResponse = {data: any[], pager: any};
export type ErrorResponse = {error_key: string, error_code: string, error_msg: string, message: string};
export type SuccessResponse = {succeed: boolean};

const timeout = 10 * 1000;
const baseURL = "";

export const authToken = { value: "I'M Auth Token"};
export const formatHeader = {value: {format: "mock"}};

console.log("UpdateAuthHeaderPlugin:", UpdateAuthHeaderPlugin);
export const remoteClientOption: RemoteClientOption<
  DataResponse,
  ErrorResponse,
  SuccessResponse
> = {
  isSuccessResponse: (s)=>(s as SuccessResponse).succeed != undefined,
  isDataResponse: (d)=>(d as DataResponse).data != undefined,
  isErrorResponse: (e)=>(e as ErrorResponse).error_code != undefined,
  config: {
    baseURL,
    timeout
  },
  // requestChain: [],
  // responseChain: [],
  requestChain: [
    new UpdateAuthHeaderPlugin(function(){
      return authToken.value;
    }), 
    new UpdateExtraHeaderPlugin(function(){
      return formatHeader.value;
    })
  ],
  responseChain: [
    new AuthResponseGuard(),
  ],
  authOption: {
    url: "",
    interval: 600,
    payloadGetter: function () {
      throw new Error("Function not implemented.");
    },
    tokenGetter: function () {
      throw new Error("Function not implemented.");
    },
    tokenUpdater: function (response: AxiosResponse<any, any>): void {
      throw new Error("Function not implemented.");
    },
    redirect: function (response: AxiosResponse<any, any>): void {
      console.log('redirect home')
    },
  }
};

