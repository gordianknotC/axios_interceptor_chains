import { AuthResponseGuard } from "../../presets/auth_response_guard";
import { ClientRequestAuthHeaderUpdater, ClientRequestExtraHeaderUpdater, } from "../../presets/request_header_updater";
import { formatHeader } from "../setup/client.test.setup";
import { authToken, EServerResponse, mockAdapter, mockServer, UnauthorizedResponseError } from "../__mocks__/axios";
import { Arr, Logger, Obj, } from "@gdknot/frontend_common";
import { NetworkErrorResponseGuard } from "../../presets/network_error_response_guard";
import { ACAuthResponseGuard, ACFetchedMarker, ACIdleMarker, ACTokenUpdater, } from "../../presets/auth_client_guards";
import { RequestReplacer } from "../../index";
import { LogModules } from "../../setup/logger.setup";
import { expectedChainFlow } from "./chain.test.helper";
const D = new Logger(LogModules.Test);
var ChainKind;
(function (ChainKind) {
    ChainKind["ClientRequestChain"] = "ClientRequestChain";
    ChainKind["ClientResponseChain"] = "ClientResponseChain";
    ChainKind["ACRequestChain"] = "ACRequestChain";
    ChainKind["ACResponseChain"] = "ACResponseChain";
    ChainKind["ACFetchedMarker"] = "ACFetchedMarker";
    ChainKind["ACTokenUpdater"] = "ACTokenUpdater";
    ChainKind["ACAuthResponseGuard"] = "ACAuthResponseGuard";
    ChainKind["ACIdleMarker"] = "ACIdleMarker";
    ChainKind["AuthResponseGuard"] = "AuthResponseGuard";
    ChainKind["NetworkErrorResponseGuard"] = "NetworkErrorResponseGuard";
    ChainKind["ClientRequestExtraHeaderUpdater"] = "ClientRequestExtraHeaderUpdater";
    ChainKind["ClientRequestAuthHeaderUpdater"] = "ClientRequestAuthHeaderUpdater";
    ChainKind["RequestReplacer"] = "RequestReplacer";
})(ChainKind || (ChainKind = {}));
export var ChainCondition;
(function (ChainCondition) {
    ChainCondition[ChainCondition["untouchedAll"] = 0] = "untouchedAll";
    ChainCondition[ChainCondition["processUntouched"] = 1] = "processUntouched";
    ChainCondition[ChainCondition["rejectUntouched"] = 2] = "rejectUntouched";
    ChainCondition[ChainCondition["processOnly"] = 3] = "processOnly";
    ChainCondition[ChainCondition["bypassProcess"] = 4] = "bypassProcess";
    ChainCondition[ChainCondition["rejectOnly"] = 5] = "rejectOnly";
    ChainCondition[ChainCondition["bypassReject"] = 6] = "bypassReject";
    ChainCondition[ChainCondition["processAndReject"] = 7] = "processAndReject";
    ChainCondition[ChainCondition["bypassProcessAndReject"] = 8] = "bypassProcessAndReject";
})(ChainCondition || (ChainCondition = {}));
export var RequestScenario;
(function (RequestScenario) {
    RequestScenario[RequestScenario["unauthorizeRequest"] = 0] = "unauthorizeRequest";
    RequestScenario[RequestScenario["unauthorizeRequestTurningIntoAuthorizedByChain"] = 1] = "unauthorizeRequestTurningIntoAuthorizedByChain";
    RequestScenario[RequestScenario["pendingIntoQueue"] = 2] = "pendingIntoQueue";
    RequestScenario[RequestScenario["pendingByDebounce"] = 3] = "pendingByDebounce";
})(RequestScenario || (RequestScenario = {}));
export var RequestAuthRejectStage;
(function (RequestAuthRejectStage) {
    RequestAuthRejectStage["sendingOrigRequest"] = "sendingOrigRequest";
    RequestAuthRejectStage["origRequestBeingRejected"] = "origRequestBeingRejected";
    RequestAuthRejectStage["rejectedRequestPendingInQueue"] = "rejectedRequestPendingInQueue";
    RequestAuthRejectStage["sendingReAuthRequestOnAuthGuard"] = "sendingReAuthRequestOnAuthGuard";
    RequestAuthRejectStage["reAuthRequestFetched"] = "reAuthRequestFetched";
    RequestAuthRejectStage["newAuthTokenBeingUpdated"] = "newAuthTokenBeingUpdated";
    RequestAuthRejectStage["newAuthSuccessfullyFetchedMarkIdle"] = "newAuthMarkIdle";
    RequestAuthRejectStage["origPendingRequestBeingResponse"] = "origPendingRequestBeingResponse";
})(RequestAuthRejectStage || (RequestAuthRejectStage = {}));
export var ResponseScenario;
(function (ResponseScenario) {
    ResponseScenario[ResponseScenario["unauthorizedResponse"] = 0] = "unauthorizedResponse";
    ResponseScenario[ResponseScenario["unauthorizedResponseTurningIntoAuthorizedByChain"] = 1] = "unauthorizedResponseTurningIntoAuthorizedByChain";
})(ResponseScenario || (ResponseScenario = {}));
export const env = "production";
export function wait(span) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, span);
    });
}
function getMaybes(_input) {
    if (typeof _input == "boolean") {
        return _input;
    }
    const mayBeConfig = _input.config ?? _input.response?.config;
    const mayBeHeaders = _input.headers ?? _input.config?.headers ?? mayBeConfig?.headers;
    const mayBeData = _input.response?.data?.data ??
        _input.data?.data ??
        _input.response?.data ??
        _input.data;
    const errorMessage = _input.message;
    return Obj({
        headers: mayBeHeaders,
        method: mayBeConfig?.method,
        url: mayBeConfig?.url,
        data: mayBeData,
        errorMessage: errorMessage,
    }).omitBy((key, val) => val == undefined);
}
const S = (s) => JSON.stringify(s);
export function wrapImplementation(helper, inst, propName, newImpl, stage) {
    const origImplementation = inst[propName].bind(inst);
    inst[propName] = (() => { });
    jest.spyOn(inst, propName).mockImplementation((...args) => {
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
        }
        catch (e) {
            console.warn("Exception on wrapImplementation, propName", propName, "inst.name:", inst.constructor.name, e);
            throw e;
        }
    });
}
function wrapGuardImpl(helper, plugin) {
    if (plugin) {
        const stage = helper.client.stage;
        wrapImplementation(helper, plugin, "processFulFill", (origImplResult, config) => {
            // console.log(plugin.constructor.name,   "process:", origImplResult);
            return origImplResult;
        }, stage);
        wrapImplementation(helper, plugin, "canProcessFulFill", (origImplResult, config) => {
            // console.log(plugin.constructor.name, " canProcess:", origImplResult);
            return origImplResult;
        }, stage);
        wrapImplementation(helper, plugin, "processReject", (origImplResult, error) => {
            // console.log(plugin.constructor.name, " processError:", origImplResult);
            return origImplResult;
        }, stage);
        wrapImplementation(helper, plugin, "canProcessReject", (origImplResult, error) => {
            // console.log(plugin.constructor.name, " canProcessError:", origImplResult);
            return origImplResult;
        }, stage);
    }
}
export class AxiosTestHelper {
    constructor(client, authToken) {
        this.client = client;
        this.authToken = authToken;
        this.chainTestStacks = [];
        this.acCalls = {
            acFetcher: false,
            acToken: false,
            acAuth: false,
            acIdle: false,
        };
        jest.spyOn(client, "get");
        jest.spyOn(client, "put");
        jest.spyOn(client, "post");
        client.requestChain.forEach((guard) => {
            wrapGuardImpl(this, guard);
        });
        client.responseChain.forEach((guard) => {
            wrapGuardImpl(this, guard);
        });
        client.authClient.requestChain.forEach((guard) => {
            wrapGuardImpl(this, guard);
        });
        client.authClient.responseChain.forEach((guard) => {
            wrapGuardImpl(this, guard);
        });
    }
    get authGuard() {
        return Arr(this.client.responseChain).firstWhere((_) => _.constructor.name == AuthResponseGuard.name);
    }
    get networkErrorGuard() {
        return Arr(this.client.responseChain).firstWhere((_) => _.constructor.name == NetworkErrorResponseGuard.name);
    }
    get authHeaderUpdater() {
        return Arr(this.client.requestChain).firstWhere((_) => _.constructor.name == ClientRequestAuthHeaderUpdater.name);
    }
    get extraHeaderUpdater() {
        return Arr(this.client.requestChain).firstWhere((_) => _.constructor.name == ClientRequestExtraHeaderUpdater.name);
    }
    get requestReplacer() {
        return Arr(this.client.requestChain).firstWhere((_) => _.constructor.name == RequestReplacer.name);
    }
    //
    get acAuthGuard() {
        return Arr(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == ACAuthResponseGuard.name);
    }
    get acFetchedMarker() {
        return Arr(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == ACFetchedMarker.name);
    }
    get acTokenUpdater() {
        return Arr(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == ACTokenUpdater.name);
    }
    get acIdleMarker() {
        return Arr(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == ACIdleMarker.name);
    }
    get(url, payload, result) {
        const _url = new URL(url, "http://localhost");
        _url.search = new URLSearchParams(payload).toString();
        mockServer.registerResponse(url, result);
        expect(mockServer.registry[url]).not.toBeUndefined();
        return this.client.get(url, payload);
    }
    auth(result, useValidator = false) {
        const url = this.client.option.authOption.axiosConfig.url;
        const _rawUrl = new URL(url, "http://localhost");
        _rawUrl.search = new URLSearchParams(this.client.option.authOption.payloadGetter()).toString();
        mockServer.registerResponse(url, result, useValidator);
        expect(mockServer.registry[url]).not.toBeUndefined();
        return this.client.auth();
    }
    put(url, data, result) {
        const _url = new URL(url, "http://localhost");
        _url.search = new URLSearchParams(data).toString();
        mockServer.registerResponse(url, result);
        expect(mockServer.registry[url]).not.toBeUndefined();
        return this.client.put(url, data);
    }
    post(url, data, result) {
        const _url = new URL(url, "http://localhost");
        _url.search = new URLSearchParams(data).toString();
        mockServer.registerResponse(url, result);
        expect(mockServer.registry[url]).not.toBeUndefined();
        return this.client.post(url, data);
    }
    del(url, data, result) {
        const _url = new URL(url, "http://localhost");
        _url.search = new URLSearchParams(data).toString();
        mockServer.registerResponse(url, result);
        expect(mockServer.registry[url]).not.toBeUndefined();
        return this.client.del(url, data);
    }
    async expectUnauthorized(url, payload, mockReturns, expectedFetched) {
        authToken.value = "hot!!";
        mockServer.registerResponse(this.client.option.authOption.axiosConfig.url, () => Promise.resolve({
            data: {
                token: this.authToken,
            },
        }), false);
        expect(mockServer.registry[url]).not.toBeUndefined();
        const fetched = await this.get(url, payload, () => {
            return mockReturns;
        });
        expect(mockAdapter, "Adapter should be called").toBeCalled();
        const authHeader = {
            Authorization: authToken.value,
        };
        const lastVal = await Arr(mockAdapter.mock.results).last
            .value;
        const headerInConfig = lastVal.config.headers;
        const tokenInHeader = lastVal.config.headers.Authorization;
        expect(tokenInHeader == authToken.value, `tokenInHeader:${tokenInHeader} != ${authToken.value}`).toBeTruthy();
        // expect(this.client.isErrorResponse(fetched)).toBeTruthy();
        // expect((fetched as ErrorResponse).message).toBe("Unauthorized");
        // expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
        expect(headerInConfig.Authorization, "header in config not updated properly").toEqual(authHeader.Authorization);
        expect(this.authGuard.canProcessReject, "expect canProcessReject called").toBeCalled();
        expect(this.authGuard.canProcessFulFill, "expect canProcessFulFill called").toBeCalled();
        return Promise.resolve({});
    }
    async expectGetPassed(url, payload, mockReturns, expectedFetched) {
        const fetched = await this.get(url, payload, mockReturns);
        expect(mockAdapter).toBeCalled();
        const authHeader = {
            Authorization: authToken.value,
        };
        const lastVal = await Arr(mockAdapter.mock.results).last
            .value;
        const headerInConfig = lastVal.config.headers;
        const tokenInHeader = lastVal.config.headers.Authorization;
        expect(tokenInHeader == authToken.value, `tokenInHeader:${tokenInHeader} != ${authToken.value}`).toBeTruthy();
        expect(fetched).toEqual(expectedFetched);
        expect(headerInConfig.format).toEqual(formatHeader.value.format);
        expect(headerInConfig.Authorization).toEqual(authHeader.Authorization);
        return fetched;
    }
    get unAuthorizedResponse() {
        return UnauthorizedResponseError;
    }
    spyOnAllGuards() {
        jest.spyOn(this.authGuard, "onRestoreRequest");
        jest.spyOn(this.authGuard, "onRequestNewAuth");
        jest.spyOn(this.acAuthGuard, "onAuthSuccess");
        jest.spyOn(this.acAuthGuard, "onAuthError");
    }
    expectRequestReject_OnServerPerspective() {
        mockServer.onResponse((stage, data) => {
            expect(stage).toBe(EServerResponse.reject);
            expect(data.message).toBe(this.unAuthorizedResponse.message);
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
        expect(this.authGuard.onRestoreRequest).toBeCalled();
        expect(this.authGuard.onRequestNewAuth).toBeCalled();
    }
    expectReAuthSuccess_OnACAuthGuard() {
        this.expectRequestReject_OnChainPerspectiveByCondition({
            chain: this.acAuthGuard,
            condition: ChainCondition.processOnly,
        });
        expect(this.acAuthGuard.onAuthSuccess).toBeCalled();
        expect(this.acAuthGuard.onAuthError).not.toBeCalled();
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
    expectRequestReject_OnChainPerspectiveByCondition(option, internalCall = false) {
        const { condition, chain } = option;
        const selfCall = this.expectRequestReject_OnChainPerspectiveByCondition.bind(this);
        switch (condition) {
            case ChainCondition.processUntouched:
                expect(chain.processFulFill).not.toBeCalled();
                expect(chain.canProcessFulFill).not.toBeCalled();
                break;
            case ChainCondition.rejectUntouched:
                expect(chain.processReject).not.toBeCalled();
                expect(chain.canProcessReject).not.toBeCalled();
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
                expect(chain.canProcessFulFill).toBeCalled();
                expect(chain.processFulFill).toBeCalled();
                break;
            case ChainCondition.bypassProcess:
                expect(chain.canProcessFulFill).toBeCalled();
                expect(chain.processFulFill).not.toBeCalled();
                break;
            case ChainCondition.rejectOnly:
                expect(chain.canProcessReject).toBeCalled();
                expect(chain.processReject).toBeCalled();
                break;
            case ChainCondition.bypassReject:
                expect(chain.canProcessReject).toBeCalled();
                expect(chain.processReject).not.toBeCalled();
                break;
            case ChainCondition.processAndReject:
                selfCall({ ...option, condition: ChainCondition.processOnly });
                selfCall({ ...option, condition: ChainCondition.rejectOnly });
                break;
            default:
                break;
        }
    }
    expectAcResponseCalled(option) {
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
            .last.value.then((_) => {
            D.info(["\n\nmockAdapter resolve:", _]);
        })
            .catch((e) => {
            D.info(["\n\nmockAdapter reject:", e]);
            expect(e.response.data, "expect throw Unauthorized error").toEqual(this.unAuthorizedResponse);
        });
    }
    onExpectServer(stage) {
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
                    expect(data.message).toBe(this.unAuthorizedResponse.message);
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
    async expectStage_OnChainPerspective(stage) {
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
                }
                catch (e) {
                    console.error(e);
                }
                break;
            case RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard:
                try {
                    expect(helper.authGuard.onRequestNewAuth).toBeCalled();
                }
                catch (e) {
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
                expect(helper.acAuthGuard.onAuthSuccess).toBeCalled();
                expect(helper.acAuthGuard.onAuthError).not.toBeCalled();
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
    async expectUnAuthRequestTurningIntoAuth(option) {
        jest.clearAllMocks();
        this.spyOnAllGuards();
        const url = "/path/to/get/url2";
        const expected = { data: { username: "expect2" } };
        const payload = {};
        const terminate = true;
        authToken.value = "helloworld";
        mockServer.registerResponse(this.client.authClient?.option.axiosConfig.url, async () => ({
            data: {
                token: this.authToken,
            },
        }), false);
        const future = this.get(url, payload, async () => {
            await wait(200);
            return expected;
        });
        this.expectRequestReject_OnServerPerspective();
    }
    clearTestRecords() {
        this.chainTestStacks.length = 0;
    }
    expectMatchSimpleAuthClientChain(preRenderedAuthToken, authUrl) {
        console.log(JSON.stringify(this.chainTestStacks));
        expect(this.chainTestStacks).toEqual(expectedChainFlow.simpleAuth(authUrl, preRenderedAuthToken));
        expect(this.client.option.authOption.tokenGetter()).toEqual(preRenderedAuthToken);
    }
}
//# sourceMappingURL=axo.test.helper.js.map