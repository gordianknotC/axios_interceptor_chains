<!--#-->
前端 http request client，考慮自動處理授權換發，以責任鍊實作 axios interceptors ，並提供常用責任鍊處理 request/response
。
## 安裝
```bash
yarn add @gdknot/request_client
```

## documentation
```bash
yarn serve:doc
```
## Feature
- 責任鍊模組化串連以對 axios interceptors進行管理，共分為二㮔 Chain
  - request chain 請求鍊，對應 axios.interceptors.request, 包括
    - 基本 request chain
    - 常用 request chain 如:
      - header updater - 用來更新請求 header
      - request replacer － 用來替換已經送出的請求
  - response chain 回覆鍊，對應 axios.interceptors.response
    - 基本 response chain
    - 常用 response chain 如:
      - authGuard 欄截未正確授權的請求
- BaseRequestClient 一個常用的HttpClient － 應考處到自動處理授權換發
- axios mocking util, for easy mocking following things
  - mocking axios internal adapter hence we can test axios interceptors without breaking the internal part
  - a simple util for mocking server response
  
```ts
import {
  UpdateAuthHeaderPlugin,
  UpdateExtraHeaderPlugin,
} from "~/presets/request_header_updater";
import { AuthResponseGuard } from "~/presets/auth_response_guard";
import { NetworkErrorResponseGuard } from "~/presets/network_error_response_guard";
import { AxiosResponse } from "axios";
import { ClientOption } from "~/base/impl/client_impl";
import { RequestReplacer } from "~/presets/request_replacer";


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
    new ClientRequestAuthHeaderUpdater(function authTokenGetter() {
      return authToken.value;
    }),
    new ClientRequestExtraHeaderUpdater(function extraHeaderGetter() {
      return formatHeader.value;
    }),
    new RequestReplacer(
      // replacementIdentifier = BaseRequestReplacer...
    ),
  ],
  responseChain: [
    new AuthResponseGuard(),
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
const client = new RequestClient(requestClientOption)
```

# Table of Content
<!-- START doctoc -->
<!-- END doctoc -->


[s-baseAuthGard]: ../src/base/impl/base_auth_response_guard_impl.ts
[s-baseClientServiceResponsePlugin]: ../src/base/impl/response_plugins_impl.ts
[s-baseClientServiceRequestPlugin]: ../src/base/impl/request_plugins_impl.ts
[s-baseRequestReplacer]: ../src/base/impl/base_request_replacer_impl.ts
[s-baseRequestGuard]: ../src/base/impl/base_request_guard_impl.ts
[s-requestClient]: ../src/base/impl/client_impl.ts
[s-requestClient.types]: ../src/base/itf/client_itf.ts
[s-eClientStage]: ../src/presets/auth_client_guards.ts

[s-acAuthResponseGuard]: ../src/presets/auth_client_guards.ts
[s-acFetchedMarker]: ../src/presets/auth_client_guards.ts
[s-acIdleMarker]: ../src/presets/auth_client_guards.ts
[s-acTokenUpdater]: ../src/presets/auth_client_guards.ts

[s-authResponseGuard]: ../src/presets/auth_response_guard.ts
[s-networkErrorGuard]: ../src/presets/network_error_response_guard.ts
[s-headerUpdater]: ../src/presets/request_header_updater.ts
[s-requestReplacer]: ../src/presets/request_replacer.ts

[s-test-mocking]: ../__tests__/__mocks__/axios.ts
[s-test-helper]: ../__tests__/helpers/axo.test.helper.ts
[s-test-setup]: ../__tests__/setup/client.test.setup.ts
