import { BaseClient } from "@/base/impl/base_client_impl";
import { BaseAuthResponseGuard } from "@/base/impl/base_auth_response_guard";
import { AuthResponseGuard } from "@/presets/auth_response_guard";
import {
  ClientRequestAuthHeaderUpdater,
  ClientRequestExtraHeaderUpdater,
} from "@/presets/request_header_updater";
import { formatHeader } from "../setup/client.test.setup";
import { authToken, EServerResponse, mockAdapter, mockServer } from "../__mocks__/axios";
import type { AxiosError, AxiosResponse } from "axios";
import {
  Arr,
  Completer,
  LazyHolder,
  Logger,
  Obj,
  uuidV4,
} from "@gdknot/frontend_common";
import { NetworkErrorResponseGuard } from "@/presets/network_error_response_guard";
import {
  ACAuthResponseGuard,
  ACFetchedMarker,
  ACIdleMarker,
  ACTokenUpdater,
} from "@/presets/auth_client_guards";
import { EClientStage, RequestReplacer } from "@/index";
import { AnyMxRecord } from "dns";
import { LogModules } from "@/setup/logger.setup";
import axios from "axios";
import { expectedChainFlow } from "./chain.test.helper";

const D = new Logger(LogModules.Test);

type ClientRequestChain =
  | ClientRequestExtraHeaderUpdater<any, any, any>
  | ClientRequestAuthHeaderUpdater<any, any, any>
  | RequestReplacer<any, any, any>;
type ClientResponseChain = AuthResponseGuard | NetworkErrorResponseGuard;
type ACRequestChain = undefined;
type ACResponseChain =
  | ACFetchedMarker
  | ACTokenUpdater
  | ACAuthResponseGuard
  | ACIdleMarker;
type Chains =
  | ClientRequestChain
  | ClientResponseChain
  | ACRequestChain
  | ACResponseChain;

enum ChainKind {
  ClientRequestChain = "ClientRequestChain",
  ClientResponseChain = "ClientResponseChain",
  ACRequestChain = "ACRequestChain",
  ACResponseChain = "ACResponseChain",
  ACFetchedMarker = "ACFetchedMarker",
  ACTokenUpdater = "ACTokenUpdater",
  ACAuthResponseGuard = "ACAuthResponseGuard",
  ACIdleMarker = "ACIdleMarker",
  AuthResponseGuard = "AuthResponseGuard",
  NetworkErrorResponseGuard = "NetworkErrorResponseGuard",
  ClientRequestExtraHeaderUpdater = "ClientRequestExtraHeaderUpdater",
  ClientRequestAuthHeaderUpdater = "ClientRequestAuthHeaderUpdater",
  RequestReplacer = "RequestReplacer",
}

export enum ChainCondition {
  untouchedAll,
  processUntouched,
  rejectUntouched,
  processOnly,
  bypassProcess,
  rejectOnly,
  bypassReject,
  processAndReject,
  bypassProcessAndReject,
}

export enum RequestScenario {
  unauthorizeRequest,
  unauthorizeRequestTurningIntoAuthorizedByChain,
  pendingIntoQueue,
  pendingByDebounce,
}

export enum RequestAuthRejectStage {
  sendingOrigRequest = "sendingOrigRequest",
  origRequestBeingRejected = "origRequestBeingRejected",
  rejectedRequestPendingInQueue = "rejectedRequestPendingInQueue",
  sendingReAuthRequestOnAuthGuard = "sendingReAuthRequestOnAuthGuard",
  reAuthRequestFetched = "reAuthRequestFetched",
  newAuthTokenBeingUpdated = "newAuthTokenBeingUpdated",
  newAuthSuccessfullyFetchedMarkIdle = "newAuthMarkIdle",
  origPendingRequestBeingResponse = "origPendingRequestBeingResponse",
}

export enum ResponseScenario {
  unauthorizedResponse,
  unauthorizedResponseTurningIntoAuthorizedByChain,
}

type TestRecord = {
  name: string;
  input?: string;
  output?: string;
  stage: EClientStage;
};

export function wait(span: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, span);
  });
}

type MayBe = {
  headers?: any;
  data?: any;
  method?: string;
  url?: string;
  errorMessage?: string;
};

function getMaybes(_input: any): MayBe | boolean {
  if (typeof _input == "boolean") {
    return _input;
  }
  const mayBeConfig = _input.config ?? _input.response?.config;
  const mayBeHeaders =
    _input.headers ?? _input.config?.headers ?? mayBeConfig?.headers;
  const mayBeData =
    _input.response?.data?.data ??
    _input.data?.data ??
    _input.response?.data ??
    _input.data;
  const errorMessage = _input.message;

  return Obj({
    headers: mayBeHeaders ,
    method: mayBeConfig?.method,
    url: mayBeConfig?.url,
    data: mayBeData  ,
    errorMessage: errorMessage,
  }).omitBy((key, val) => val == undefined);
}

const S = (s:any)=>JSON.stringify(s);

export function wrapImplementation<T extends {}, Key extends keyof T>(
  helper: AxiosTestHelper,
  inst: T,
  propName: Key,
  newImpl: (origImplResult: any, ...args: any[]) => any,
  stage: EClientStage
) {
  const origImplementation = (inst[propName] as Function).bind(inst);
  inst[propName] = (() => {}) as any;
  jest.spyOn(inst, propName as any).mockImplementation((...args) => {
    try {
      const output = origImplementation(...args);
      const stage = helper.client.stage;
      helper.chainTestStacks.push({
        name: `${inst.constructor.name}.${propName.toString()}`,
        input: S(getMaybes(args[0])),
        output: S(getMaybes(output)),
        stage,
      });
      return newImpl(output, ...args);
    } catch (e) {
      console.warn(
        "Exception on wrapImplementation, propName",
        propName,
        "inst.name:",
        inst.constructor.name,
        e
      );
      throw e;
    }
  });
}

function wrapGuardImpl(helper: AxiosTestHelper, plugin: any) {
  if (plugin) {
    const stage = helper.client.stage;
    wrapImplementation(
      helper,
      plugin,
      "processFulFill",
      (origImplResult, config) => {
        // console.log(plugin.constructor.name,   "process:", origImplResult);
        return origImplResult;
      },
      stage
    );
    wrapImplementation(
      helper,
      plugin,
      "canProcessFulFill",
      (origImplResult, config) => {
        // console.log(plugin.constructor.name, " canProcess:", origImplResult);
        return origImplResult;
      },
      stage
    );
    wrapImplementation(
      helper,
      plugin,
      "processReject",
      (origImplResult, error) => {
        // console.log(plugin.constructor.name, " processError:", origImplResult);
        return origImplResult;
      },
      stage
    );
    wrapImplementation(
      helper,
      plugin,
      "canProcessReject",
      (origImplResult, error) => {
        // console.log(plugin.constructor.name, " canProcessError:", origImplResult);
        return origImplResult;
      },
      stage
    );
  }
}

export class AxiosTestHelper {
  chainTestStacks: TestRecord[] = [];
  constructor(
    public client: BaseClient<any, any, any>,
    public authToken: string
  ) {
    jest.spyOn(client, "get");
    jest.spyOn(client, "put");
    jest.spyOn(client, "post");

    client.requestChain.forEach((guard) => {
      wrapGuardImpl(this, guard);
    });

    client.responseChain.forEach((guard) => {
      wrapGuardImpl(this, guard);
    });

    client.authClient!.requestChain.forEach((guard) => {
      wrapGuardImpl(this, guard);
    });

    client.authClient!.responseChain.forEach((guard) => {
      wrapGuardImpl(this, guard);
    });
  }
  get authGuard(): jest.Mocked<AuthResponseGuard> {
    return Arr(this.client.responseChain).firstWhere(
      (_) => _.constructor.name == AuthResponseGuard.name
    ) as any;
  }
  get networkErrorGuard(): jest.Mocked<NetworkErrorResponseGuard> {
    return Arr(this.client.responseChain).firstWhere(
      (_) => _.constructor.name == NetworkErrorResponseGuard.name
    ) as any;
  }
  get authHeaderUpdater(): jest.Mocked<
    ClientRequestAuthHeaderUpdater<any, any, any>
  > {
    return Arr(this.client.requestChain).firstWhere(
      (_) => _.constructor.name == ClientRequestAuthHeaderUpdater.name
    ) as any;
  }
  get extraHeaderUpdater(): jest.Mocked<
    ClientRequestExtraHeaderUpdater<any, any, any>
  > {
    return Arr(this.client.requestChain).firstWhere(
      (_) => _.constructor.name == ClientRequestExtraHeaderUpdater.name
    ) as any;
  }
  get requestReplacer(): jest.Mocked<RequestReplacer<any, any, any>> {
    return Arr(this.client.requestChain).firstWhere(
      (_) => _.constructor.name == RequestReplacer.name
    ) as any;
  }
  //
  get acAuthGuard(): jest.Mocked<ACAuthResponseGuard> {
    return Arr(this.client.authClient!.responseChain).firstWhere(
      (_) => _.constructor.name == ACAuthResponseGuard.name
    ) as any;
  }
  get acFetchedMarker(): jest.Mocked<ACFetchedMarker> {
    return Arr(this.client.authClient!.responseChain).firstWhere(
      (_) => _.constructor.name == ACFetchedMarker.name
    ) as any;
  }
  get acTokenUpdater(): jest.Mocked<ACTokenUpdater> {
    return Arr(this.client.authClient!.responseChain).firstWhere(
      (_) => _.constructor.name == ACTokenUpdater.name
    ) as any;
  }
  get acIdleMarker(): jest.Mocked<ACIdleMarker> {
    return Arr(this.client.authClient!.responseChain).firstWhere(
      (_) => _.constructor.name == ACIdleMarker.name
    ) as any;
  }

  get(url: string, payload: any, result: () => Promise<any>) {
    const _url = new URL(url, "http://localhost");
    _url.search = new URLSearchParams(payload).toString();
    mockServer.registerResponse(url, result);
    expect(mockServer.registry[url]).not.toBeUndefined();
    return this.client.get(url, payload);
  }
  auth(result: () => Promise<any>, useValidator: boolean = false) {
    const url = this.client.option.authOption.axiosConfig.url!;
    const _rawUrl = new URL(url, "http://localhost");
    _rawUrl.search = new URLSearchParams(
      this.client.option.authOption!.payloadGetter()
    ).toString();
    mockServer.registerResponse(url, result, useValidator);
    expect(mockServer.registry[url]).not.toBeUndefined();
    return this.client.auth();
  }
  put(url: string, data: any, result: () => Promise<any>) {
    const _url = new URL(url, "http://localhost");
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result);
    expect(mockServer.registry[url]).not.toBeUndefined();
    return this.client.put(url, data);
  }
  post(url: string, data: any, result: () => Promise<any>) {
    const _url = new URL(url, "http://localhost");
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result);
    expect(mockServer.registry[url]).not.toBeUndefined();
    return this.client.post(url, data);
  }
  del(url: string, data: any, result: () => Promise<any>) {
    const _url = new URL(url, "http://localhost");
    _url.search = new URLSearchParams(data).toString();
    mockServer.registerResponse(url, result);
    expect(mockServer.registry[url]).not.toBeUndefined();
    return this.client.del(url, data);
  }

  async expectUnauthorized(
    url: string,
    payload: any,
    mockReturns: any,
    expectedFetched: any
  ) {
    authToken.value = "hot!!";
    mockServer.registerResponse(
      this.client.option.authOption.axiosConfig.url!,
      () =>
        Promise.resolve({
          data: {
            token: this.authToken,
          },
        }),
      false
    );
    expect(mockServer.registry[url]).not.toBeUndefined();
    const fetched = await this.get(url, payload, () => {
      return mockReturns;
    });
    expect(mockAdapter, "Adapter should be called").toBeCalled();
    const authHeader = {
      Authorization: authToken.value,
    };
    const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last
      .value;
    const headerInConfig = lastVal.config.headers as any;
    const tokenInHeader = (lastVal.config.headers as any).Authorization;
    expect(
      tokenInHeader == authToken.value,
      `tokenInHeader:${tokenInHeader} != ${authToken.value}`
    ).toBeTruthy();
    // expect(this.client.isErrorResponse(fetched)).toBeTruthy();
    // expect((fetched as ErrorResponse).message).toBe("Unauthorized");
    // expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
    expect(
      headerInConfig.Authorization,
      "header in config not updated properly"
    ).toEqual(authHeader.Authorization);
    expect(
      this.authGuard!.canProcessReject,
      "expect canProcessReject called"
    ).toBeCalled();
    expect(
      this.authGuard!.canProcessFulFill,
      "expect canProcessFulFill called"
    ).toBeCalled();
    return Promise.resolve({});
  }

  async expectGetPassed(
    url: string,
    payload: any,
    mockReturns: () => Promise<any>,
    expectedFetched: any
  ) {
    const fetched = await this.get(url, payload, mockReturns);
    expect(mockAdapter).toBeCalled();
    const authHeader = {
      Authorization: authToken.value,
    };
    const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last
      .value;
    const headerInConfig = lastVal.config.headers as any;
    const tokenInHeader = (lastVal.config.headers as any).Authorization;
    expect(
      tokenInHeader == authToken.value,
      `tokenInHeader:${tokenInHeader} != ${authToken.value}`
    ).toBeTruthy();
    expect(fetched).toEqual(expectedFetched);
    expect(headerInConfig.format).toEqual(formatHeader.value.format);
    expect(headerInConfig.Authorization).toEqual(authHeader.Authorization);
    return fetched;
  }
  protected get unAuthorizedResponse() {
    return {
      message: "Unauthorized",
      error_name: "Unauthorized",
      error_code: 401,
      error_key: "Unauthorized",
    };
  }
  spyOnAllGuards() {
    jest.spyOn(this.authGuard as any, "onRestoreRequest");
    jest.spyOn(this.authGuard as any, "onRequestNewAuth");
    jest.spyOn(this.acAuthGuard as any, "onAuthSuccess");
    jest.spyOn(this.acAuthGuard as any, "onAuthError");
  }

  expectRequestReject_OnServerPerspective() {
    mockServer.onResponse((stage, data) => {
      expect(stage).toBe(EServerResponse.reject);
      expect((data as AxiosError).message).toBe(
        this.unAuthorizedResponse.message
      );
      expect(this.extraHeaderUpdater.canProcessFulFill).toBeCalled();
      expect(this.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
      expect(this.authHeaderUpdater.canProcessFulFill).toBeCalled();
      expect(this.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
      expect(this.requestReplacer.canProcessFulFill).toBeCalled();
      expect(this.requestReplacer.canProcessFulFill).toReturnWith(false);
      console.log("end of first time reject from server");
      return true;
    });
  }
  expectACAuthChainNotStartedYet() {
    expect(this.acAuthGuard.canProcessFulFill).not.toBeCalled();
    expect(this.acFetchedMarker.canProcessFulFill).not.toBeCalled();
    expect(this.acIdleMarker.canProcessFulFill).not.toBeCalled();
    expect(this.acTokenUpdater.canProcessFulFill).not.toBeCalled();
  }

  expectRequestRestored_andAuthRequestBeingSend_onAuthGuard() {
    this.expectRequestReject_OnChainPerspectiveByCondition({
      chain: this.authGuard,
      condition: ChainCondition.processUntouched,
    });
    // original request being rejected hence calling client.auth()
    this.expectRequestReject_OnChainPerspectiveByCondition({
      chain: this.authGuard,
      condition: ChainCondition.rejectOnly,
    });
    expect((this.authGuard as any).onRestoreRequest).toBeCalled();
    expect((this.authGuard as any).onRequestNewAuth).toBeCalled();
  }

  expectReAuthSuccess_OnACAuthGuard() {
    this.expectRequestReject_OnChainPerspectiveByCondition({
      chain: this.acAuthGuard,
      condition: ChainCondition.processOnly,
    });
    expect((this.acAuthGuard as any).onAuthSuccess).toBeCalled();
    expect((this.acAuthGuard as any).onAuthError).not.toBeCalled();
    this.expectRequestReject_OnChainPerspectiveByCondition({
      chain: this.acIdleMarker,
      condition: ChainCondition.bypassProcess,
    });
  }

  expectAuthRequestNotYetCall() {
    expect(this.acTokenUpdater.canProcessFulFill).not.toBeCalled();
    expect(this.acAuthGuard.canProcessFulFill).not.toBeCalled();
    expect(this.acFetchedMarker.canProcessFulFill).not.toBeCalled();
    expect(this.acIdleMarker.canProcessFulFill).not.toBeCalled();
  }

  expectRequestReject_OnChainPerspectiveByCondition(
    option: { chain: Chains; condition: ChainCondition },
    internalCall: boolean = false
  ) {
    const { condition, chain } = option;
    const selfCall =
      this.expectRequestReject_OnChainPerspectiveByCondition.bind(this);

    switch (condition) {
      case ChainCondition.processUntouched:
        expect(chain!.processFulFill).not.toBeCalled();
        expect(chain!.canProcessFulFill).not.toBeCalled();
        break;
      case ChainCondition.rejectUntouched:
        expect(chain!.processReject).not.toBeCalled();
        expect(chain!.canProcessReject).not.toBeCalled();
        break;
      case ChainCondition.untouchedAll:
        selfCall({ ...option, condition: ChainCondition.rejectUntouched });
        selfCall({ ...option, condition: ChainCondition.processUntouched });
        break;
      case ChainCondition.bypassProcessAndReject:
        selfCall({ ...option, condition: ChainCondition.bypassProcess });
        selfCall({ ...option, condition: ChainCondition.bypassReject });
        break;
      case ChainCondition.processOnly:
        expect(chain!.canProcessFulFill).toBeCalled();
        expect(chain!.processFulFill).toBeCalled();
        break;
      case ChainCondition.bypassProcess:
        expect(chain!.canProcessFulFill).toBeCalled();
        expect(chain!.processFulFill).not.toBeCalled();
        break;
      case ChainCondition.rejectOnly:
        expect(chain!.canProcessReject).toBeCalled();
        expect(chain!.processReject).toBeCalled();
        break;
      case ChainCondition.bypassReject:
        expect(chain!.canProcessReject).toBeCalled();
        expect(chain!.processReject).not.toBeCalled();
        break;
      case ChainCondition.processAndReject:
        selfCall({ ...option, condition: ChainCondition.processOnly });
        selfCall({ ...option, condition: ChainCondition.rejectOnly });
        break;
      default:
        break;
    }
  }

  private acCalls = {
    acFetcher: false,
    acToken: false,
    acAuth: false,
    acIdle: false,
  };
  expectAcResponseCalled(option: {
    acFetcher: boolean;
    acToken: boolean;
    acAuth: boolean;
    acIdle: boolean;
  }) {
    const acCalls = { ...this.acCalls };
    this.acFetchedMarker.onCanProcess(() => {
      acCalls.acFetcher = true;
    });
    this.acTokenUpdater.onCanProcess(() => {
      acCalls.acToken = true;
    });
    this.acAuthGuard.onCanProcess(() => {
      acCalls.acAuth = true;
    });
    this.acIdleMarker.onCanProcess(() => {
      acCalls.acIdle = true;
    });
    expect(acCalls.acFetcher).toBe(option.acFetcher);
    expect(acCalls.acToken).toBe(option.acToken);
    expect(acCalls.acAuth).toBe(option.acAuth);
    expect(acCalls.acIdle).toBe(option.acIdle);
  }

  expectRequestReject_OnAdapterPerspective() {
    expect(mockAdapter).toBeCalled();
    Arr(mockAdapter.mock.results)
      .last.value.then((_: AxiosResponse) => {
        D.info(["\n\nmockAdapter resolve:", _]);
      })
      .catch((e: any) => {
        D.info(["\n\nmockAdapter reject:", e]);
        expect(e.response.data, "expect throw Unauthorized error").toEqual(
          this.unAuthorizedResponse
        );
      });
  }

  onExpectServer(stage: EServerResponse) {
    const self = this;
    switch (stage) {
      case EServerResponse.resolved:
        mockServer.onResponse((stage, data) => {
          expect(stage).toBe(EServerResponse.resolved);
          expect(self.extraHeaderUpdater.canProcessFulFill).toBeCalled();
          expect(self.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
          expect(self.authHeaderUpdater.canProcessFulFill).toBeCalled();
          expect(self.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
          expect(self.requestReplacer.canProcessFulFill).toBeCalled();
          expect(self.requestReplacer.canProcessFulFill).toReturnWith(false);
          console.log("end of first time reject from server");
          return true;
        });
        break;
      case EServerResponse.reject:
        mockServer.onResponse((stage, data) => {
          expect(stage).toBe(EServerResponse.reject);
          expect((data as AxiosError).message).toBe(
            this.unAuthorizedResponse.message
          );
          expect(self.extraHeaderUpdater.canProcessFulFill).toBeCalled();
          expect(self.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
          expect(self.authHeaderUpdater.canProcessFulFill).toBeCalled();
          expect(self.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
          expect(self.requestReplacer.canProcessFulFill).toBeCalled();
          expect(self.requestReplacer.canProcessFulFill).toReturnWith(false);
          console.log("end of first time reject from server");
          return true;
        });
        break;
      default:
        break;
    }
  }

  async expectStage_OnChainPerspective(stage: RequestAuthRejectStage) {
    const helper = this;
    const terminate = true;

    D.current([stage]);
    switch (stage) {
      case RequestAuthRejectStage.sendingOrigRequest:
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.authHeaderUpdater,
          condition: ChainCondition.processOnly,
        });
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.extraHeaderUpdater,
          condition: ChainCondition.processOnly,
        });
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.requestReplacer,
          condition: ChainCondition.bypassProcess,
        });
        break;
      case RequestAuthRejectStage.origRequestBeingRejected:
        this.onExpectServer(EServerResponse.reject);
        break;
      case RequestAuthRejectStage.rejectedRequestPendingInQueue:
        try {
          helper.expectRequestReject_OnChainPerspectiveByCondition({
            chain: helper.authHeaderUpdater,
            condition: ChainCondition.processOnly,
          });
          helper.expectRequestReject_OnChainPerspectiveByCondition({
            chain: helper.extraHeaderUpdater,
            condition: ChainCondition.processOnly,
          });
          helper.expectRequestReject_OnChainPerspectiveByCondition({
            chain: helper.requestReplacer,
            condition: ChainCondition.bypassProcess,
          });

          helper.expectRequestReject_OnAdapterPerspective();
          helper.expectRequestRestored_andAuthRequestBeingSend_onAuthGuard();
          helper.expectAuthRequestNotYetCall();
        } catch (e) {
          console.error(e);
        }
        break;
      case RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard:
        try {
          expect((helper.authGuard as any).onRequestNewAuth).toBeCalled();
        } catch (e) {
          console.error(e);
        }
        break;
      case RequestAuthRejectStage.reAuthRequestFetched:
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acFetchedMarker,
          condition: ChainCondition.bypassProcess,
        });
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acTokenUpdater,
          condition: ChainCondition.processUntouched,
        });
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acIdleMarker,
          condition: ChainCondition.processUntouched,
        });
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acAuthGuard,
          condition: ChainCondition.processUntouched,
        });
        break;
      case RequestAuthRejectStage.newAuthTokenBeingUpdated:
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acTokenUpdater,
          condition: ChainCondition.processOnly,
        });
        expect(authToken.value).toBe(this.authToken);
        break;
      case RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle:
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acAuthGuard,
          condition: ChainCondition.processOnly,
        });
        expect((helper.acAuthGuard as any).onAuthSuccess).toBeCalled();
        expect((helper.acAuthGuard as any).onAuthError).not.toBeCalled();
        helper.expectRequestReject_OnChainPerspectiveByCondition({
          chain: helper.acIdleMarker,
          condition: ChainCondition.bypassProcess,
        });
        break;
      case RequestAuthRejectStage.origPendingRequestBeingResponse:
        expect(helper.authGuard.canProcessFulFill).toReturnWith(false);
        expect(helper.authGuard.processFulFill).not.toBeCalled();
        expect(helper.authGuard.canProcessReject).toReturnWith(true);
        expect(helper.authGuard.processReject).toBeCalled();
        break;
      default:
        break;
    }
  }

  async expectUnAuthRequestTurningIntoAuth(option: {
    url: string;
    expected: string;
  }) {
    jest.clearAllMocks();
    this.spyOnAllGuards();
    const url = "/path/to/get/url2";
    const expected = { data: { username: "expect2" } };
    const payload = {};
    const terminate = true;
    const errorResponse = {
      message: "Unauthorized",
      error_name: "Unauthorized",
      error_code: 401,
      error_key: "Unauthorized",
    };
    authToken.value = "helloworld";
    mockServer.registerResponse(
      this.client.authClient?.option.axiosConfig.url!,
      async () => ({
        data: {
          token: this.authToken,
        },
      }),
      false
    );

    const future = this.get(url, payload, async () => {
      await wait(200);
      return expected;
    });

    this.expectRequestReject_OnServerPerspective();
  }
  clearTestRecords() {
    this.chainTestStacks.length = 0;
  }

  expectMatchSimpleAuthClientChain(
    preRenderedAuthToken: string,
    authUrl: string
  ) {
    console.log(JSON.stringify(this.chainTestStacks));
    expect(this.chainTestStacks).toEqual(expectedChainFlow.simpleAuth(authUrl, preRenderedAuthToken));
    expect(this.client.option.authOption.tokenGetter()).toEqual(
      preRenderedAuthToken
    );
  }

  
}
 