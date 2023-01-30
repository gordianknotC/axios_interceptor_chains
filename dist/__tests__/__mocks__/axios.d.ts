/// <reference types="jest" />
import { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance, AxiosStatic, HttpStatusCode } from "axios";
import { ErrorResponse } from "../setup/client.test.setup";
export declare const authToken: {
    value: string;
};
export declare enum _EErrorCode {
    ACCESS_TOKEN_MISSING = 3101,
    ACCESS_TOKEN_EXPIRED = 3102,
    PAYLOAD_MISSING_KEY = 2102,
    INVALID_PERMISSION = 3002,
    USER_IS_BLOCK = 205,
    USER_NOT_VERIFY = 206
}
export declare enum EServerResponse {
    resolved = 0,
    reject = 1
}
export declare const AuthTokenExpiredError: ErrorResponse;
export declare const AuthTokenMissingError: ErrorResponse;
export declare const UnauthorizedResponseError: ErrorResponse;
type RegisteredResponse = Omit<AxiosResponse, "config"> & {
    useValidator: boolean;
};
declare class MockedServer {
    validToken: string;
    registry: Record<string, RegisteredResponse>;
    defaultResponse: Omit<AxiosResponse, "config"> & {
        useValidator: boolean;
    };
    constructor(validToken: string);
    private headerValidator?;
    setHeaderValidator(validator: (config: AxiosRequestConfig) => AxiosResponse | AxiosError | undefined | null): void;
    registerResponse(url: string, responseCB: () => Promise<any>, useValidator?: boolean, status?: HttpStatusCode): void;
    getResponse(config: AxiosRequestConfig): Promise<AxiosResponse | AxiosError>;
    private _onStage?;
    onResponse(cb: (stage: EServerResponse, data: any) => boolean): void;
    clear(): void;
}
declare const mockAxios: jest.Mocked<AxiosStatic>;
export declare const mockServer: MockedServer;
export declare const mockAdapter: jest.Mock<any, any>;
export declare const getMockAxiosInstances: () => jest.Mocked<AxiosInstance>[], clearMockAxios: () => void, mostRecentAxiosInstanceSatisfying: (fn: (a: AxiosInstance) => boolean) => jest.Mocked<AxiosInstance> | undefined;
export default mockAxios;
