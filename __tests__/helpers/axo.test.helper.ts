import { BaseRemoteClient } from "@/base/impl/remote_client_impl";
import { AuthResponseGuard } from "@/presets/auth_response_guard";
import { UpdateAuthHeaderPlugin, UpdateExtraHeaderPlugin } from "@/presets/header_updater";
import { authToken, ErrorResponse, formatHeader } from "../setup/client.test.setup";
import { mockAdapter, mockServer } from "../__mocks__/axios";
import type {AxiosResponse} from "axios";
import { Arr } from '@gdknot/frontend_common';
 

export function wrapImplementation<T extends {}, Key extends keyof T>(
  inst: T, 
  propName: Key, 
  callback: (origImplResult: any, ...args: any[])=>any
){
  const origImplementation = (inst[propName] as Function).bind(inst);
  inst[propName] = (()=>{}) as any;
  jest.spyOn(inst, propName as any)
    .mockImplementation((...args)=>{
      // console.log("call wrapImplementation:", propName, ...args);
      try{
        return callback(origImplementation(...args), ...args);
      }catch(e){
        throw e;
      }
    })
}

export
class AxiosTestHelper {
  constructor(
    public client: BaseRemoteClient<any, any, any>,
    public authHeaderUpdater?: UpdateAuthHeaderPlugin<any, any, any>,
    public extraHeaderUpdater?: UpdateExtraHeaderPlugin<any, any, any>,
    public authGuard?: AuthResponseGuard
  ){
    jest.spyOn(client, "get");
    jest.spyOn(client, "put");
    jest.spyOn(client, "post");

    if (authHeaderUpdater){
      wrapImplementation(authHeaderUpdater, "process", ((origImplResult, config)=>{
        // console.log("authHeaderUpdater process:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(authHeaderUpdater, "canProcess", ((origImplResult, config)=>{
        // console.log("authHeaderUpdater canProcess:", origImplResult);
        return origImplResult;
      }));
    }
    
    if (authHeaderUpdater){
      wrapImplementation(authHeaderUpdater, "processError", ((origImplResult, error)=>{
        // console.log("authHeaderUpdater processError:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(authHeaderUpdater, "canProcessError", ((origImplResult, error)=>{
        // console.log("authHeaderUpdater canProcessError:", origImplResult);
        return origImplResult;
      }));
    }
    
    if (extraHeaderUpdater){
      wrapImplementation(extraHeaderUpdater, "process", ((origImplResult, config)=>{
        // console.log("extraHeaderUpdater process:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(extraHeaderUpdater, "canProcess", ((origImplResult, config)=>{
        // console.log("extraHeaderUpdater canProcess:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(extraHeaderUpdater, "processError", ((origImplResult, error)=>{
        // console.log("extraHeaderUpdater processError:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(extraHeaderUpdater, "canProcessError", ((origImplResult, error)=>{
        // console.log("extraHeaderUpdater canProcessError:", origImplResult);
        return origImplResult;
      }));
    }
    
    if (authGuard){
      wrapImplementation(authGuard, "process", ((origImplResult, response)=>{
        // console.log("authGuard process:", origImplResult);
        return origImplResult;
      }));  
      wrapImplementation(authGuard, "canProcess", ((origImplResult, response)=>{
        // console.log("authGuard canProcess:", origImplResult);
        return origImplResult;
      }));
      wrapImplementation(authGuard, "processError", ((origImplResult, error)=>{
        // console.log("authGuard processError:", origImplResult);
        return origImplResult;
      }));  
      wrapImplementation(authGuard, "canProcessError", ((origImplResult, error)=>{
        // console.log("authGuard canProcessError:", origImplResult);
        return origImplResult;
      }));
    }
  }

  get(url: string, payload: any, result: ()=>any){
    try{
      const _url = (new URL(url, 'http://localhost'))
      _url.search = new URLSearchParams(payload).toString();
      mockServer.registerResponse(url, result());
      return this.client.get(url, payload);
    }catch(e){
      console.error(e);
      throw e;
    }
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

  async expectGetPassed(url: string, payload: any, mockReturns: any, expectedFetched: any){
    const fetched = await this.get(url, payload, ()=>{
      return mockReturns;
    });

    expect(mockAdapter).toBeCalled();
    const authHeader = {
        Authorization: authToken.value
    }
    const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last.value;
    const tokenInHeader = (lastVal.headers as any).Authorization;
    
    console.log("authToken:", authToken.value, "tokenInHeader:", tokenInHeader, "mockAdapter.mock.results:", mockAdapter.mock.results.length, mockAdapter.mock)

    if (tokenInHeader == authToken.value){
      expect(fetched).toEqual(expectedFetched);
      expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
      expect((lastVal.headers as any).Authorization).toEqual(authHeader.Authorization);
    }else{
      expect(this.client.isErrorResponse(fetched)).toBeTruthy();
      expect((fetched as ErrorResponse).message).toBe("Unauthorized");
      //expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
      expect((lastVal.headers as any).Authorization).not.toEqual(authHeader.Authorization);
    }
  }
}
