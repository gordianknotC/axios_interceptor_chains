import axios, { Axios, AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosStatic, CreateAxiosDefaults, AxiosResponse, AxiosPromise } from 'axios';
import { assert } from '@gdknot/frontend_common';
import { wrapImplementation } from '../helpers/axo.test.helper';
import { merge } from 'merge-anything';

class Server {
  registry: Record<string, Omit<AxiosResponse, "config">> = {};
  defaultResponse: Omit<AxiosResponse, "config"> = {
    data: {},
    status: axios.HttpStatusCode.Ok,
    statusText: "",
    headers: {}
  }
  registerResponse(url: string, response: Partial<AxiosResponse>){
    this.registry[url] = merge(this.defaultResponse, {data: response});
  }
  getResponse(url: string): Omit<AxiosResponse, "config">{
    return this.registry[url] ?? this.defaultResponse;
  }
  clear(){
    this.registry = {};
  }
}
export const mockServer = new Server();

export const mockAdapter = jest.fn((config)=>{
  const response = mockServer.getResponse(config.url!);
  console.log("mockAdapter response from url:", config.url, response);
  return Promise.resolve({
    ...response,
    headers: config.headers,
    config
  } as AxiosResponse);
});

// const origRequest = (Axios.prototype as any).request;
// (Axios.prototype as any)["request"] = function (url: any, config: any){
//   console.log("******* request *******", "defaults:", this.defaults, "url:", url, "config:", config);
//   const request = origRequest.bind(this);
//   return request(url, config);
// };
// jest.spyOn(Axios.prototype, "request");

const mockAxios = jest.createMockFromModule<AxiosStatic>('axios') as jest.Mocked<AxiosStatic>;
const origCreate = jest.spyOn(axios, "create") as any;
let instances: jest.Mocked<AxiosInstance>[] = [];

mockAxios.create = ((config: CreateAxiosDefaults) => {
  const _origInst = origCreate(config);
  const _origRequest = _origInst.request.bind(_origInst);
  assert(_origInst != undefined);

  const inst: jest.Mocked<AxiosInstance> = jest.mocked(_origInst);
  jest.spyOn(inst, "get");
  jest.spyOn(inst, "put");
  jest.spyOn(inst, "delete");
  jest.spyOn(inst, "post");
  jest.spyOn(inst, "request");

  // console.log(" - -  - - send request", inst.request.mock, inst.defaults == undefined);
  // inst.get("abc/efg", {url: "abc/efg"});
  assert(inst != undefined);
  assert(inst.get.mock != undefined);
  
  // const inst = jest.createMockFromModule<AxiosInstance>('axios') as jest.Mocked<AxiosInstance>;
  // inst.defaults = { ...inst.defaults, ...config } as any;
  instances.push(inst);
  
  const origUseRequest = inst.interceptors.request.use.bind(inst.interceptors.request);
  const origUseResponse = inst.interceptors.response.use.bind(inst.interceptors.response);
  inst.interceptors.request.use = jest.fn((fulfilled, rejected, options)=>{
    return origUseRequest(fulfilled, rejected, options);
  }) as any;
  inst.interceptors.response.use = jest.fn((fulfilled, rejected, options)=>{
    return origUseResponse(fulfilled, rejected, options);
  }) as any;

  config.adapter = mockAdapter;
  return inst;
}) as any;

export function getMockAxiosInstances(): jest.Mocked<AxiosInstance>[]  {
  return instances;
}
export function mostRecentAxiosInstanceSatisfying(fn: (a: AxiosInstance) => boolean) {
  return instances.filter(fn).at(-1);
}
export function clearMockAxios() {
  instances = [];
} 
export default mockAxios;