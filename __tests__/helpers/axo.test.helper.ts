import { BaseRemoteClient } from "@/base/impl/remote_client_impl";
import { AuthResponseGuard } from "@/presets/auth_response_guard";
import { UpdateAuthHeaderPlugin, UpdateExtraHeaderPlugin } from "@/presets/request_header_updater";
import { authToken, authUrl, ErrorResponse, formatHeader } from "../setup/client.test.setup";
import { mockAdapter, mockServer } from "../__mocks__/axios";
import type {AxiosResponse} from "axios";
import { Arr } from '@gdknot/frontend_common';
import { NetworkErrorResponseGuard } from "@/presets/network_error_response_guard";
 

export function wrapImplementation<T extends {}, Key extends keyof T>(
  inst: T, 
  propName: Key, 
  newImpl: (origImplResult: any, ...args: any[])=>any
){
  const origImplementation = (inst[propName] as Function).bind(inst);
  inst[propName] = (()=>{}) as any;
  jest.spyOn(inst, propName as any)
    .mockImplementation((...args)=>{
      try{
        return newImpl(origImplementation(...args), ...args);
      }catch(e){
        console.warn("Exception on wrapImplementation, propName", propName, "inst.name:", inst.constructor.name)
        throw e;
      }
    })
}

function wrapGuardImpl(plugin: any){
  if (plugin){
    wrapImplementation(plugin, "processFulFill", ((origImplResult, config)=>{
      // console.log(plugin.constructor.name,   "process:", origImplResult);
      return origImplResult;
    }));
    wrapImplementation(plugin, "canProcessFulFill", ((origImplResult, config)=>{
      // console.log(plugin.constructor.name, " canProcess:", origImplResult);
      return origImplResult;
    }));
    wrapImplementation(plugin, "processReject", ((origImplResult, error)=>{
      // console.log(plugin.constructor.name, " processError:", origImplResult);
      return origImplResult;
    }));
    wrapImplementation(plugin, "canProcessReject", ((origImplResult, error)=>{
      // console.log(plugin.constructor.name, " canProcessError:", origImplResult);
      return origImplResult;
    }));
  }
}

export
class AxiosTestHelper {
  constructor(
    public client: BaseRemoteClient<any, any, any>,
    public authToken: string
  ){
    jest.spyOn(client, "get");
    jest.spyOn(client, "put");
    jest.spyOn(client, "post");

    client.requestChain.forEach((guard)=>{
      wrapGuardImpl(guard);
    });

    client.responseChain.forEach((guard)=>{
      wrapGuardImpl(guard);
    });
  }
  get authGuard(){
    return Arr(this.client.responseChain).firstWhere((_)=>_.constructor.name == AuthResponseGuard.name);
  }
  get networkErrorGuard(){
    return Arr(this.client.responseChain).firstWhere((_)=>_.constructor.name == NetworkErrorResponseGuard.name);
  }
  get authHeaderUpdater(){
    return Arr(this.client.requestChain).firstWhere((_)=>_.constructor.name == UpdateAuthHeaderPlugin.name);
  }
  get extraHeaderUpdater(){
    return Arr(this.client.requestChain).firstWhere((_)=>_.constructor.name == UpdateExtraHeaderPlugin.name);
  }


  get(url: string, payload: any, result: ()=>any){
    const _url = (new URL(url, 'http://localhost'))
    _url.search = new URLSearchParams(payload).toString();
    mockServer.registerResponse(url, result());
    return this.client.get(url, payload);
  }
  auth(result: ()=>any, useValidator: boolean = false){
    const url = this.client.authOption.url;
    const _rawUrl = (new URL(url, 'http://localhost'))
    _rawUrl.search = new URLSearchParams(this.client.authOption.payloadGetter()).toString();
    mockServer.registerResponse(url, result(), useValidator);
    return this.client.auth();
  }
  put(url: string, data: any, result: ()=>any){
    const _url = (new URL(url, 'http://localhost'))
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result());
    return this.client.put(url, data);
  }
  post(url: string, data: any, result: ()=>any){
    const _url = (new URL(url, 'http://localhost'))
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result());
    return this.client.post(url, data);
  }
  del(url: string, data: any, result: ()=>any){
    const _url = (new URL(url, 'http://localhost'))
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result());
    return this.client.del(url, data);
  }

  async expectUnauthorized(url: string, payload: any, mockReturns: any, expectedFetched: any){
    authToken.value = "hot!!";
    mockServer.registerResponse(authUrl, {data: {
      token: this.authToken
    }}, false);
    const fetched = await this.get(url, payload, ()=>{
      return mockReturns;
    });
    expect(mockAdapter, "Adapter should be called").toBeCalled();
    const authHeader = {
        Authorization: authToken.value
    }
    const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last.value;
    const headerInConfig = (lastVal.config.headers as any);
    const tokenInHeader = (lastVal.config.headers as any).Authorization;
    expect(tokenInHeader == authToken.value, `tokenInHeader:${tokenInHeader} != ${authToken.value}`).toBeTruthy();
    // expect(this.client.isErrorResponse(fetched)).toBeTruthy();
    // expect((fetched as ErrorResponse).message).toBe("Unauthorized");
    // expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
    expect(headerInConfig.Authorization, "header in config not updated properly").toEqual(authHeader.Authorization);
    expect(this.authGuard!.canProcessReject, "expect canProcessReject called").toBeCalled();
    expect(this.authGuard!.canProcessFulFill, "expect canProcessFulFill called").toBeCalled();
    return Promise.resolve({});
  }

  async expectGetPassed(url: string, payload: any, mockReturns: any, expectedFetched: any){
    const fetched = await this.get(url, payload, ()=>{
      return mockReturns;
    });
    expect(mockAdapter).toBeCalled();
    const authHeader = {
        Authorization: authToken.value
    }
    const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last.value;
    const headerInConfig = (lastVal.config.headers as any);
    const tokenInHeader = (lastVal.config.headers as any).Authorization;
    expect(tokenInHeader == authToken.value, `tokenInHeader:${tokenInHeader} != ${authToken.value}`).toBeTruthy();
    expect(fetched).toEqual(expectedFetched);
    expect(headerInConfig.format).toEqual(formatHeader.value.format);
    expect(headerInConfig.Authorization).toEqual(authHeader.Authorization);
  }
}
