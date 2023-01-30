
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosAdapter,
  AxiosInstance,
  AxiosStatic,
  CreateAxiosDefaults,
  AxiosHeaders,
  HttpStatusCode,
  Axios,
} from "axios";
import { merge } from "merge-anything";
import { assert, assertMsg } from "@gdknot/frontend_common";
import { ErrorResponse } from "../setup/client.test.setup";


export const authToken = { value: "I'M Auth Token" };
export enum _EErrorCode {
  ACCESS_TOKEN_MISSING = 3101,
  ACCESS_TOKEN_EXPIRED = 3102,
  // followings are not for guarantee
  PAYLOAD_MISSING_KEY = 2102,
  INVALID_PERMISSION = 3002,
  USER_IS_BLOCK = 205,
  USER_NOT_VERIFY = 206
}

export enum EServerResponse {
  resolved,
  reject
}
export
const AuthTokenExpiredError: ErrorResponse = {
  error_key: "ACCESS_TOKEN_EXPIRED",
  error_code: _EErrorCode.ACCESS_TOKEN_EXPIRED.toString(),
  error_msg: "ACCESS_TOKEN_EXPIRED",
  message: "ACCESS_TOKEN_EXPIRED"
}
export
const AuthTokenMissingError: ErrorResponse = {
  message: "ACCESS_TOKEN_MISSING",
  error_msg: "ACCESS_TOKEN_MISSING",
  error_code: _EErrorCode.ACCESS_TOKEN_MISSING.toString(),
  error_key: "ACCESS_TOKEN_MISSING",

}
export 
const UnauthorizedResponseError: ErrorResponse = {
  message: "Unauthorized",
  error_msg: "Unauthorized",
  error_code: axios.HttpStatusCode.Unauthorized.toString(),
  error_key: "Unauthorized",
}

abstract class IMockedServer {
  abstract setHeaderValidator(
    validator: (
      config: AxiosRequestConfig
    ) => AxiosResponse | AxiosError | undefined | null
  ): void;
  abstract registerResponse(
    url: string,
    response: any,
    useValidator: boolean,
    status: HttpStatusCode
  ): void;
  abstract getResponse(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse | AxiosError>;
}

type RegisteredResponse = Omit<AxiosResponse, "config"> & { useValidator: boolean };

class MockedServer {
  registry: Record<string, RegisteredResponse> = {};
  defaultResponse: Omit<AxiosResponse, "config"> & { useValidator: boolean } = {
    data: {},
    status: axios.HttpStatusCode.Ok,
    statusText: "",
    headers: {},
    useValidator: true,
  };

  constructor(public validToken: string) {
    this.setHeaderValidator((config: AxiosRequestConfig) => {
      try {
        const token = (config.headers as AxiosHeaders).get("Authorization");
        const authorized = token == validToken;
        console.log("MockServer - authorized?:", authorized, config.url, token, validToken);
        // 無錯誤
        if (authorized) 
          return null;

        const name = "Unauthorized";
        const message = name;
        const statusText = name;
        const response: AxiosResponse = {
          data: UnauthorizedResponseError,
          status: axios.HttpStatusCode.Unauthorized,
          statusText,
          headers: {},
          config,
        };
        const request = undefined
        console.log("MockServer - return unauthorized error", config.url);
        return new axios.AxiosError(name, undefined, config, request, response);
      } catch (e) {
        console.error("setAuthHeaderGuard failed, config:", config, "error:", e);
        throw e;
      }
    });
  }

  private headerValidator?: (
    config: AxiosRequestConfig
  ) => AxiosResponse | AxiosError | undefined | null;

  setHeaderValidator(
    validator: (
      config: AxiosRequestConfig
    ) => AxiosResponse | AxiosError | undefined | null
  ) {
    this.headerValidator = validator;
  }

  registerResponse(
    url: string, 
    responseCB: ()=>Promise<any>, 
    useValidator: boolean = true, 
    status: HttpStatusCode = axios.HttpStatusCode.Ok
  ) {
    assert(()=>typeof responseCB == "function", "invalid type");
    this.registry[url] = merge(this.defaultResponse, {
      data: responseCB,
      useValidator,
      status
    });
    assert(()=>typeof this.registry[url].data == "function", "invalid type");
    console.log("MockServer - register response, url:", url, "content:", this.registry[url]);
  }
  
  async getResponse(config: AxiosRequestConfig): Promise<AxiosResponse | AxiosError> {
    console.log("MockServer -  getResponse", config.url!);
    const url = config.url!;
    const header = config!.headers;
    const registered = this.registry[url];
    const {status: registeredStatus} = registered;
    const promiseData = ((registered?.data ?? (()=>{}) )as ()=>Promise<any>)();
    const responseWithoutData: AxiosResponse = {
      ...this.defaultResponse,
      config,
      status: registeredStatus
    };
    const useValidator = this.registry[url]?.useValidator ?? true;
    if (this.registry[url]) {
      console.log("MockServer - found registered result on url", useValidator, url);
    }
    if (useValidator) {
      if (!this.headerValidator) {
        console.log("MockServer - no header validator - resolve response:", url);
        responseWithoutData.data = await promiseData;
        const response = responseWithoutData;
        if (registeredStatus == axios.HttpStatusCode.Ok){
          this._onStage?.(EServerResponse.resolved, response);
          return Promise.resolve(response);
        }else{
          this._onStage?.(EServerResponse.reject, response);
        return Promise.reject(response);
        }
        
      } else {
        const errorResponse = this.headerValidator(config);
        const isHeaderValid = errorResponse == undefined;
        if (isHeaderValid) {
          responseWithoutData.data = await promiseData;
          const response = responseWithoutData;
          console.log("MockServer - valid header - ", url, "response:", response, "this.registry[url]:", this.registry);
          this._onStage?.(EServerResponse.resolved, response);
          return Promise.resolve(response);
        } else {
          console.log("MockServer - invalid header - ", url);
          this._onStage?.(EServerResponse.reject, errorResponse);
          return Promise.reject(errorResponse);
        }
      }
    } else {
      console.log("MockServer - no validator", url);
      responseWithoutData.data = await promiseData;
      const response = responseWithoutData;
      if (registeredStatus == axios.HttpStatusCode.Ok){
        this._onStage?.(EServerResponse.resolved, response);
        return Promise.resolve(response);
      }else{
        this._onStage?.(EServerResponse.reject, response);
      return Promise.reject(response);
      }
    }
  }
  private _onStage?: (stage: EServerResponse, data: any)=>boolean;
  onResponse(cb: (stage: EServerResponse, data: any)=>boolean){
    this._onStage = (stage, data)=>{
      const remove = cb(stage, data);
      if (remove){
        this._onStage = undefined;
      }
      return remove;
    }
  }
  clear() {
    this.registry = {};
  }
}

function getMockedAdapter(mockServer: MockedServer): jest.Mock<any> {
  const mockAdapter = jest.fn(async (config) => {
    config.headers.set(
      "User-Agent", "axios/" + "1.2.1", false
    );
    console.log("Adapter - before mockServer.getResponse, url", config.url);
    const response = await mockServer.getResponse(config);
    config.data = response;
    console.log("Adapter - return response", {
      config: {
        headers: response.config?.headers
      },
      data: (response as AxiosResponse).data,
      headers: (response as AxiosResponse).headers,
    });
    return response;
  });
  (mockAdapter as any).__name__ = "mockAdapter";
  return mockAdapter;
}

function mockAxiosCreate(
  mockAxios: jest.Mocked<AxiosStatic>,
  mockServer: MockedServer,
  mockAdapter: jest.Mocked<any>
) {
  const origCreate = jest.spyOn(axios, "create") as any;
  let instances: jest.Mocked<AxiosInstance>[] = [];

  mockAxios.create = ((config: CreateAxiosDefaults) => {
    config.adapter = mockAdapter as any;
    const _origInst = origCreate(config);
    const _origRequest = _origInst.request.bind(_origInst);
    assert(() => _origInst != undefined);

    const inst: jest.Mocked<AxiosInstance> = jest.mocked(_origInst);
    jest.spyOn(inst, "get");
    jest.spyOn(inst, "put");
    jest.spyOn(inst, "delete");
    jest.spyOn(inst, "post");
    jest.spyOn(inst, "request");

    assert(() => inst != undefined);
    assert(() => inst.get.mock != undefined);

    instances.push(inst);
    const origUseRequest = inst.interceptors.request.use.bind(
      inst.interceptors.request
    );
    const origUseResponse = inst.interceptors.response.use.bind(
      inst.interceptors.response
    );
    inst.interceptors.request.use = jest.fn((fulfilled, rejected, options) => {
      return origUseRequest(fulfilled, rejected, options);
    }) as any;
    inst.interceptors.response.use = jest.fn((fulfilled, rejected, options) => {
      return origUseResponse(fulfilled, rejected, options);
    }) as any;
    return inst;
  }) as any;

  function getMockAxiosInstances(): jest.Mocked<AxiosInstance>[] {
    return instances;
  }
  function mostRecentAxiosInstanceSatisfying(
    fn: (a: AxiosInstance) => boolean
  ) {
    return instances.filter(fn).at(-1);
  }
  function clearMockAxios() {
    instances = [];
  }
  return {
    getMockAxiosInstances,
    mostRecentAxiosInstanceSatisfying,
    clearMockAxios,
  };
}

const mockAxios = jest.createMockFromModule<AxiosStatic>(
  "axios"
) as jest.Mocked<AxiosStatic>;

export const mockServer = new MockedServer(authToken.value);
export const mockAdapter = getMockedAdapter(mockServer);
const util = mockAxiosCreate(mockAxios, mockServer, mockAdapter);

export const {
  getMockAxiosInstances,
  clearMockAxios,
  mostRecentAxiosInstanceSatisfying,
} = util;

export default mockAxios;
