import { RemoteClientOption, AuthResponseGuard, BaseRemoteClient, UpdateAuthHeaderPlugin, UpdateExtraHeaderPlugin } from "@/index";

export type DataResponse = {data: any[], pager: any};
export type ErrorResponse = {error_key: string, error_code: string, error_msg: string, message: string};
export type SuccessResponse = {succeed: boolean};

const timeout = 10 * 1000;
const baseURL = "";
export const authToken =  "I'M Auth Token";
export const formatHeader = {format: "mock"};
export const remoteClientOption: RemoteClientOption = {
  config: {
    baseURL,
    timeout
  },
  requestChain: [
    new UpdateAuthHeaderPlugin(function(){
      return "I'M Auth Token";
    }), 
    new UpdateExtraHeaderPlugin(()=>formatHeader)
  ],
  responseChain: [
    new AuthResponseGuard(),
  ]
};

