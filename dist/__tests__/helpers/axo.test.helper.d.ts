/// <reference types="jest" />
import { BaseClient } from "../../base/impl/base_client_impl";
import { AuthResponseGuard } from "../../presets/auth_response_guard";
import { ClientRequestAuthHeaderUpdater, ClientRequestExtraHeaderUpdater } from "../../presets/request_header_updater";
import { EServerResponse } from "../__mocks__/axios";
import { NetworkErrorResponseGuard } from "../../presets/network_error_response_guard";
import { ACAuthResponseGuard, ACFetchedMarker, ACIdleMarker, ACTokenUpdater } from "../../presets/auth_client_guards";
import { EClientStage, RequestReplacer } from "../../index";
type ClientRequestChain = ClientRequestExtraHeaderUpdater<any, any, any> | ClientRequestAuthHeaderUpdater<any, any, any> | RequestReplacer<any, any, any>;
type ClientResponseChain = AuthResponseGuard | NetworkErrorResponseGuard;
type ACRequestChain = undefined;
type ACResponseChain = ACFetchedMarker | ACTokenUpdater | ACAuthResponseGuard | ACIdleMarker;
type Chains = ClientRequestChain | ClientResponseChain | ACRequestChain | ACResponseChain;
export declare enum ChainCondition {
    untouchedAll = 0,
    processUntouched = 1,
    rejectUntouched = 2,
    processOnly = 3,
    bypassProcess = 4,
    rejectOnly = 5,
    bypassReject = 6,
    processAndReject = 7,
    bypassProcessAndReject = 8
}
export declare enum RequestScenario {
    unauthorizeRequest = 0,
    unauthorizeRequestTurningIntoAuthorizedByChain = 1,
    pendingIntoQueue = 2,
    pendingByDebounce = 3
}
export declare enum RequestAuthRejectStage {
    sendingOrigRequest = "sendingOrigRequest",
    origRequestBeingRejected = "origRequestBeingRejected",
    rejectedRequestPendingInQueue = "rejectedRequestPendingInQueue",
    sendingReAuthRequestOnAuthGuard = "sendingReAuthRequestOnAuthGuard",
    reAuthRequestFetched = "reAuthRequestFetched",
    newAuthTokenBeingUpdated = "newAuthTokenBeingUpdated",
    newAuthSuccessfullyFetchedMarkIdle = "newAuthMarkIdle",
    origPendingRequestBeingResponse = "origPendingRequestBeingResponse"
}
export declare enum ResponseScenario {
    unauthorizedResponse = 0,
    unauthorizedResponseTurningIntoAuthorizedByChain = 1
}
export declare const env = "production";
type TestRecord = {
    name: string;
    input?: string;
    output?: string;
    stage: EClientStage;
};
export declare function wait(span: number): Promise<boolean>;
export declare function wrapImplementation<T extends {}, Key extends keyof T>(helper: AxiosTestHelper, inst: T, propName: Key, newImpl: (origImplResult: any, ...args: any[]) => any, stage: EClientStage): void;
export declare class AxiosTestHelper {
    client: BaseClient<any, any, any>;
    authToken: string;
    chainTestStacks: TestRecord[];
    constructor(client: BaseClient<any, any, any>, authToken: string);
    get authGuard(): jest.Mocked<AuthResponseGuard>;
    get networkErrorGuard(): jest.Mocked<NetworkErrorResponseGuard>;
    get authHeaderUpdater(): jest.Mocked<ClientRequestAuthHeaderUpdater<any, any, any>>;
    get extraHeaderUpdater(): jest.Mocked<ClientRequestExtraHeaderUpdater<any, any, any>>;
    get requestReplacer(): jest.Mocked<RequestReplacer<any, any, any>>;
    get acAuthGuard(): jest.Mocked<ACAuthResponseGuard>;
    get acFetchedMarker(): jest.Mocked<ACFetchedMarker>;
    get acTokenUpdater(): jest.Mocked<ACTokenUpdater>;
    get acIdleMarker(): jest.Mocked<ACIdleMarker>;
    get(url: string, payload: any, result: () => Promise<any>): Promise<any>;
    auth(result: () => Promise<any>, useValidator?: boolean): Promise<any>;
    put(url: string, data: any, result: () => Promise<any>): Promise<any>;
    post(url: string, data: any, result: () => Promise<any>): Promise<any>;
    del(url: string, data: any, result: () => Promise<any>): Promise<any>;
    expectUnauthorized(url: string, payload: any, mockReturns: any, expectedFetched: any): Promise<{}>;
    expectGetPassed(url: string, payload: any, mockReturns: () => Promise<any>, expectedFetched: any): Promise<any>;
    protected get unAuthorizedResponse(): import("../setup/client.test.setup").ErrorResponse;
    spyOnAllGuards(): void;
    expectRequestReject_OnServerPerspective(): void;
    expectACAuthChainNotStartedYet(): void;
    expectRequestRestored_andAuthRequestBeingSend_onAuthGuard(): void;
    expectReAuthSuccess_OnACAuthGuard(): void;
    expectAuthRequestNotYetCall(): void;
    expectRequestReject_OnChainPerspectiveByCondition(option: {
        chain: Chains;
        condition: ChainCondition;
    }, internalCall?: boolean): void;
    private acCalls;
    expectAcResponseCalled(option: {
        acFetcher: boolean;
        acToken: boolean;
        acAuth: boolean;
        acIdle: boolean;
    }): void;
    expectRequestReject_OnAdapterPerspective(): void;
    onExpectServer(stage: EServerResponse): void;
    expectStage_OnChainPerspective(stage: RequestAuthRejectStage): Promise<void>;
    expectUnAuthRequestTurningIntoAuth(option: {
        url: string;
        expected: string;
    }): Promise<void>;
    clearTestRecords(): void;
    expectMatchSimpleAuthClientChain(preRenderedAuthToken: string, authUrl: string): void;
}
export {};
