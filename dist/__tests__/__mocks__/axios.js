import axios from "axios";
import { merge } from "merge-anything";
import { assert } from "@gdknot/frontend_common";
export const authToken = { value: "I'M Auth Token" };
export var _EErrorCode;
(function (_EErrorCode) {
    _EErrorCode[_EErrorCode["ACCESS_TOKEN_MISSING"] = 3101] = "ACCESS_TOKEN_MISSING";
    _EErrorCode[_EErrorCode["ACCESS_TOKEN_EXPIRED"] = 3102] = "ACCESS_TOKEN_EXPIRED";
    // followings are not for guarantee
    _EErrorCode[_EErrorCode["PAYLOAD_MISSING_KEY"] = 2102] = "PAYLOAD_MISSING_KEY";
    _EErrorCode[_EErrorCode["INVALID_PERMISSION"] = 3002] = "INVALID_PERMISSION";
    _EErrorCode[_EErrorCode["USER_IS_BLOCK"] = 205] = "USER_IS_BLOCK";
    _EErrorCode[_EErrorCode["USER_NOT_VERIFY"] = 206] = "USER_NOT_VERIFY";
})(_EErrorCode || (_EErrorCode = {}));
export var EServerResponse;
(function (EServerResponse) {
    EServerResponse[EServerResponse["resolved"] = 0] = "resolved";
    EServerResponse[EServerResponse["reject"] = 1] = "reject";
})(EServerResponse || (EServerResponse = {}));
export const AuthTokenExpiredError = {
    error_key: "ACCESS_TOKEN_EXPIRED",
    error_code: _EErrorCode.ACCESS_TOKEN_EXPIRED.toString(),
    error_msg: "ACCESS_TOKEN_EXPIRED",
    message: "ACCESS_TOKEN_EXPIRED"
};
export const AuthTokenMissingError = {
    message: "ACCESS_TOKEN_MISSING",
    error_msg: "ACCESS_TOKEN_MISSING",
    error_code: _EErrorCode.ACCESS_TOKEN_MISSING.toString(),
    error_key: "ACCESS_TOKEN_MISSING",
};
export const UnauthorizedResponseError = {
    message: "Unauthorized",
    error_msg: "Unauthorized",
    error_code: axios.HttpStatusCode.Unauthorized.toString(),
    error_key: "Unauthorized",
};
class IMockedServer {
}
class MockedServer {
    constructor(validToken) {
        this.validToken = validToken;
        this.registry = {};
        this.defaultResponse = {
            data: {},
            status: axios.HttpStatusCode.Ok,
            statusText: "",
            headers: {},
            useValidator: true,
        };
        this.setHeaderValidator((config) => {
            try {
                const token = config.headers.get("Authorization");
                const authorized = token == validToken;
                console.log("MockServer - authorized?:", authorized, config.url, token, validToken);
                // 無錯誤
                if (authorized)
                    return null;
                const name = "Unauthorized";
                const message = name;
                const statusText = name;
                const response = {
                    data: UnauthorizedResponseError,
                    status: axios.HttpStatusCode.Unauthorized,
                    statusText,
                    headers: {},
                    config,
                };
                const request = undefined;
                console.log("MockServer - return unauthorized error", config.url);
                return new axios.AxiosError(name, undefined, config, request, response);
            }
            catch (e) {
                console.error("setAuthHeaderGuard failed, config:", config, "error:", e);
                throw e;
            }
        });
    }
    setHeaderValidator(validator) {
        this.headerValidator = validator;
    }
    registerResponse(url, responseCB, useValidator = true, status = axios.HttpStatusCode.Ok) {
        assert(() => typeof responseCB == "function", "invalid type");
        this.registry[url] = merge(this.defaultResponse, {
            data: responseCB,
            useValidator,
            status
        });
        assert(() => typeof this.registry[url].data == "function", "invalid type");
        console.log("MockServer - register response, url:", url, "content:", this.registry[url]);
    }
    async getResponse(config) {
        console.log("MockServer -  getResponse", config.url);
        const url = config.url;
        const header = config.headers;
        const registered = this.registry[url];
        const { status: registeredStatus } = registered;
        const promiseData = (registered?.data ?? (() => { }))();
        const responseWithoutData = {
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
                if (registeredStatus == axios.HttpStatusCode.Ok) {
                    this._onStage?.(EServerResponse.resolved, response);
                    return Promise.resolve(response);
                }
                else {
                    this._onStage?.(EServerResponse.reject, response);
                    return Promise.reject(response);
                }
            }
            else {
                const errorResponse = this.headerValidator(config);
                const isHeaderValid = errorResponse == undefined;
                if (isHeaderValid) {
                    responseWithoutData.data = await promiseData;
                    const response = responseWithoutData;
                    console.log("MockServer - valid header - ", url, "response:", response, "this.registry[url]:", this.registry);
                    this._onStage?.(EServerResponse.resolved, response);
                    return Promise.resolve(response);
                }
                else {
                    console.log("MockServer - invalid header - ", url);
                    this._onStage?.(EServerResponse.reject, errorResponse);
                    return Promise.reject(errorResponse);
                }
            }
        }
        else {
            console.log("MockServer - no validator", url);
            responseWithoutData.data = await promiseData;
            const response = responseWithoutData;
            if (registeredStatus == axios.HttpStatusCode.Ok) {
                this._onStage?.(EServerResponse.resolved, response);
                return Promise.resolve(response);
            }
            else {
                this._onStage?.(EServerResponse.reject, response);
                return Promise.reject(response);
            }
        }
    }
    onResponse(cb) {
        this._onStage = (stage, data) => {
            const remove = cb(stage, data);
            if (remove) {
                this._onStage = undefined;
            }
            return remove;
        };
    }
    clear() {
        this.registry = {};
    }
}
function getMockedAdapter(mockServer) {
    const mockAdapter = jest.fn(async (config) => {
        config.headers.set("User-Agent", "axios/" + "1.2.1", false);
        console.log("Adapter - before mockServer.getResponse, url", config.url);
        const response = await mockServer.getResponse(config);
        config.data = response;
        console.log("Adapter - return response", {
            config: {
                headers: response.config?.headers
            },
            data: response.data,
            headers: response.headers,
        });
        return response;
    });
    mockAdapter.__name__ = "mockAdapter";
    return mockAdapter;
}
function mockAxiosCreate(mockAxios, mockServer, mockAdapter) {
    const origCreate = jest.spyOn(axios, "create");
    let instances = [];
    mockAxios.create = ((config) => {
        config.adapter = mockAdapter;
        const _origInst = origCreate(config);
        const _origRequest = _origInst.request.bind(_origInst);
        assert(() => _origInst != undefined);
        const inst = jest.mocked(_origInst);
        jest.spyOn(inst, "get");
        jest.spyOn(inst, "put");
        jest.spyOn(inst, "delete");
        jest.spyOn(inst, "post");
        jest.spyOn(inst, "request");
        assert(() => inst != undefined);
        assert(() => inst.get.mock != undefined);
        instances.push(inst);
        const origUseRequest = inst.interceptors.request.use.bind(inst.interceptors.request);
        const origUseResponse = inst.interceptors.response.use.bind(inst.interceptors.response);
        inst.interceptors.request.use = jest.fn((fulfilled, rejected, options) => {
            return origUseRequest(fulfilled, rejected, options);
        });
        inst.interceptors.response.use = jest.fn((fulfilled, rejected, options) => {
            return origUseResponse(fulfilled, rejected, options);
        });
        return inst;
    });
    function getMockAxiosInstances() {
        return instances;
    }
    function mostRecentAxiosInstanceSatisfying(fn) {
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
const mockAxios = jest.createMockFromModule("axios");
export const mockServer = new MockedServer(authToken.value);
export const mockAdapter = getMockedAdapter(mockServer);
const util = mockAxiosCreate(mockAxios, mockServer, mockAdapter);
export const { getMockAxiosInstances, clearMockAxios, mostRecentAxiosInstanceSatisfying, } = util;
export default mockAxios;
//# sourceMappingURL=axios.js.map