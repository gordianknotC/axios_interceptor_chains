import { authToken } from "../setup/client.test.setup";

import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosAdapter,
  AxiosInstance,
  AxiosStatic,
  CreateAxiosDefaults,
  AxiosHeaders,
} from "axios";
import { merge } from "merge-anything";
import { assert } from "@gdknot/frontend_common";

abstract class IMockedServer {
  abstract setHeaderValidator(
    validator: (
      config: AxiosRequestConfig
    ) => AxiosResponse | AxiosError | undefined | null
  ): void;
  abstract registerResponse(
    url: string,
    response: any,
    useValidator: boolean
  ): void;
  abstract getResponse(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse | AxiosError>;
}

class MockedServer {
  registry: Record<
    string,
    Omit<AxiosResponse, "config"> & { useValidator: boolean }
  > = {};
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
        const authorized = token == authToken.value;
        // 無錯誤
        if (authorized) return null;

        const name = "Unauthorized";
        const message = name;
        const statusText = name;
        const response: AxiosResponse = {
          data: {
            message,
            error_name: name,
            error_code: axios.HttpStatusCode.Unauthorized,
            error_key: name,
          },
          status: axios.HttpStatusCode.Unauthorized,
          statusText,
          headers: {},
          config,
        };
        return response;
      } catch (e) {
        console.error("setAuthHeaderGuard failed, config:", config);
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
  registerResponse(url: string, response: any, useValidator: boolean = true) {
    this.registry[url] = merge(this.defaultResponse, {
      data: response,
      useValidator,
    });
    console.log("register response:", url, this.registry[url]);
  }
  getResponse(config: AxiosRequestConfig): Promise<AxiosResponse | AxiosError> {
    const url = config.url!;
    const header = config!.headers;
    const response: AxiosResponse = {
      ...(this.registry[url] ?? this.defaultResponse),
      config,
    };
    const useValidator = this.registry[url]?.useValidator ?? true;
    console.log("mockServer getResponse", url);
    if (this.registry[url]) {
      console.log("found registered result on url", url, this.registry[url]);
    }
    if (useValidator) {
      if (!this.headerValidator) {
        console.log("no header validator - resolve response:");
        return Promise.resolve(response);
      } else {
        const errorResponse = this.headerValidator(config);
        const isHeaderValid = errorResponse == undefined;
        if (isHeaderValid) {
          console.log("valid header - resolve response:");
          return Promise.resolve(response);
        } else {
          console.log("invalid header - reject response:", config.headers);
          return Promise.reject(errorResponse);
        }
      }
    } else {
      return Promise.resolve(response);
    }
  }
  clear() {
    this.registry = {};
  }
}

function getMockedAdapter(mockServer: MockedServer): jest.Mock<any> {
  const mockAdapter = jest.fn((config) => {
    config.headers.set("User-Agent", "axios/" + "1.2.1", false);
    console.log("before mockServer.getResponse, headers:", config.headers);
    const response = mockServer.getResponse(config);
    config.data = response;
    console.log("mockAdapter return response");
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
