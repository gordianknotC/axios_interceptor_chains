/// <reference types="jest" />
import { AxiosInstance, AxiosStatic } from "axios";
import { MockedServer } from "./mocked_server";
export declare function getMockedAxios(validToken: string): {
    axios: jest.Mocked<AxiosStatic>;
    mockAxios: jest.Mocked<AxiosStatic>;
    mockAdapter: any;
    mockServer: MockedServer;
    clearMockAxios: () => void;
    mostRecentAxiosInstanceSatisfying: (fn: (a: AxiosInstance) => boolean) => jest.Mocked<AxiosInstance> | undefined;
    getMockAxiosInstances: () => jest.Mocked<AxiosInstance>[];
};
