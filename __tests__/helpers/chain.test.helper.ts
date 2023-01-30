import { ChainActionStage } from "~/base/itf/plugin_chains_itf";
import { ErrorResponse } from "../setup/client.test.setup";

const S = (s: any)=>JSON.stringify(s);

function lStrip(data: {name:string}[], matcher: (input: {name:string}, index: number)=>boolean, index: number=0){
  let lbound = 0;
  for (let idx = 0; idx < data.length; idx++) {
    const record = data[idx];
    if (matcher(record, idx)){
      lbound = idx;
      return data.slice(lbound, data.length -1);
    }    
  }
  return [];
}

function rStrip(data: {name:string}[], matcher: (input: {name:string}, index: number)=>boolean, index: number=0){
  let rbound = data.length -1;
  for (let idx = data.length-1; idx <=0; idx--) {
    const record = data[idx];
    if (matcher(record, index)){
      rbound = idx;
      return data.slice(0, rbound);
    }
  }
  return [];
}

export const expectedChainFlow = {
  partial_acRedirectUnAuth(authUrl: string, initialAuthToken: string,  errorData: ErrorResponse){
    initialAuthToken = initialAuthToken 
      ? `,"Authorization":"${initialAuthToken}"` 
      : "";
    return [
      {
        name: `ACFetchedMarker.canProcessReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
        output: `false`,
        stage: `authFetched`
      },
      {
        name: `ACTokenUpdater.canProcessReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
        output: `false`,
        stage: `authFetched`
      },
      {
        name: `ACAuthResponseGuard.canProcessReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
        output: `true`,
        stage: `authFetched`
      },
      {
        name: `ACIdleMarker.canProcessReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
        output: `false`,
        stage: `idle`
      },
      {
        name: `ACAuthResponseGuard.processReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
        output: `{}`,
        stage: `idle`
      }
    ];
  },
  partial_acUnauthorized(authUrl: string, initialAuthToken: string,  authFailedErr: ErrorResponse){
    return [
      {
        name: `ACFetchedMarker.canProcessReject`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
        output: `false`,
        stage: `authFetched`
      },
      {
        name: `ACTokenUpdater.canProcessReject`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
        output: `false`,
        stage: `authFetched`
      },
      {
        name: `ACAuthResponseGuard.canProcessReject`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
        output: `true`,
        stage: `authFetched`
      }
    ];
  },
  partial_acAuth(authUrl: string, authToken: string, hasQueuedItem: boolean = false){
    const processFulFillOfAcResponseGuardOrNot = hasQueuedItem
      ? [{
        name: `ACAuthResponseGuard.processFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `{}`,
        stage: `idle`
      }]
      : [];
    return [
      {
        name: `ACFetchedMarker.canProcessFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `false`,
        stage: `authFetched`
      },
      {
        name: `ACTokenUpdater.canProcessFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `true`,
        stage: `authFetched`
      },
      {
        name: `ACAuthResponseGuard.canProcessFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `${hasQueuedItem}`,
        stage: `authUpdated`
      },
      {
        name: `ACIdleMarker.canProcessFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `false`,
        stage: `idle`
      },
      ...processFulFillOfAcResponseGuardOrNot,
      {
        name: `ACTokenUpdater.processFulFill`,
        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
        output: `{}`,
        stage: `idle`
      }
    ];
  },

  partial_redirectedAuthorizedGet(data: object, authToken: string, initialToken: string, getUrl: string){
    return [
      {
        name: `AuthRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${initialToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        output: `true`,
        stage: `idle`
      },
      {
        name: `ExtraRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        output: `true`,
        stage: `idle`
      },
      {
        name: `RequestReplacer.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        output: `false`,
        stage: `idle`
      },
      {
        name: `ExtraRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        stage: `idle`
      },
      {
        name: `AuthRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${ChainActionStage.processResponse}"}}`,
        stage: `idle`
      },
      {
        name: `AuthResponseGuard.canProcessFulFill`,
        input: `{"headers":{},"method":"get","url":"${getUrl}","data":${S(data)}}`,
        output: `false`,
        stage: `idle`
      },
      {
        name: `NetworkErrorResponseGuard.canProcessFulFill`,
        input: `{"headers":{},"method":"get","url":"${getUrl}","data":${S(data)}}`,
        output: `false`,
        stage: `idle`
      }
    ];
  },
  partial_authorizedGet(data: object, authToken: string, getUrl: string){
    return [
      {
        name: `AuthRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*"}}`,
        output: `true`,
        stage: `fetching`
      },
      {
        name: `ExtraRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}"}}`,
        output: `true`,
        stage: `fetching`
      },
      {
        name: `RequestReplacer.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
        output: `false`,
        stage: `fetching`
      },
      {
        name: `ExtraRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
        stage: `fetching`
      },
      {
        name: `AuthRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
        stage: `fetching`
      },
      {
        name: `AuthResponseGuard.canProcessFulFill`,
        input: `{"headers":{},"method":"get","url":"${getUrl}","data":${data}}`,
        output: `false`,
        stage: `fetching`
      },
      {
        name: `NetworkErrorResponseGuard.canProcessFulFill`,
        input: `{"headers":{},"method":"get","url":"${getUrl}","data":${data}}`,
        output: `false`,
        stage: `fetching`
      }
    ];
  },
  partial_UnAuthorizedGet (unauthorizedErr: ErrorResponse, getUrl: string, initialAuthToken?: string){
    initialAuthToken = initialAuthToken ? `"Authorization":"${initialAuthToken}"` : ""
    return [
      {
        name: `AuthRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*"}}`,
        output: `true`,
        stage: `fetching`
      },
      {
        name: `ExtraRequestHeaderUpdater.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken}}}`,
        output: `true`,
        stage: `fetching`
      },
      {
        name: `RequestReplacer.canProcessFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
        output: `false`,
        stage: `fetching`
      },
      {
        name: `ExtraRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
        stage: `fetching`
      },
      {
        name: `AuthRequestHeaderUpdater.processFulFill`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
        output: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
        stage: `fetching`
      },
      {
        name: `AuthResponseGuard.canProcessReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock","User-Agent":"axios/1.2.1"},"method":"get","url":"${getUrl}","data":${S(unauthorizedErr)},"errorMessage":"${unauthorizedErr.message}"}`,
        output: `true`,
        stage: `fetching`
      },
      {
        name: `AuthResponseGuard.processReject`,
        input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock","User-Agent":"axios/1.2.1"},"method":"get","url":"${getUrl}","data":${S(unauthorizedErr)},"errorMessage":"${unauthorizedErr.message}"}`,
        output: `{}`,
        stage: `authorizing`
      },
    ]
  }, 
  
  simpleAuth(authUrl:string, authToken: string){ 
    return this.partial_acAuth(authUrl, authToken);
  },
  simpleAuthorizedGet (authToken: string, data: any, getUrl: string){
    return this.partial_authorizedGet(data, authToken, getUrl);
  },
  simpleUnAuthorizedGet (unauthorizedErr: ErrorResponse, authErr: ErrorResponse, getUrl: string, authUrl: string, initialAuthToken: string){
    return [
      ...this.partial_UnAuthorizedGet(unauthorizedErr, getUrl, initialAuthToken),
      ...this.partial_acUnauthorized(authUrl, initialAuthToken, authErr),
    ];
  },
  simpleUnauthorizedGetTurningIntoAuthorized(
    authToken: string, initialAuthToken: string, authUrl: string, data: any, errorData: any, getUrl: string
  ){
    const hasQueuedRequest = true;
    return [
      ...this.partial_UnAuthorizedGet(errorData, getUrl, initialAuthToken),
      ...this.partial_acAuth(authUrl, authToken, hasQueuedRequest),
      ...this.partial_redirectedAuthorizedGet(data, authToken, initialAuthToken, getUrl)
    ]
  },

  partial_unAuthorizedGet: ()=>[] as any
};
