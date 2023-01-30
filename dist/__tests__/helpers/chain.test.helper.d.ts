import { ErrorResponse } from "../setup/client.test.setup";
export declare const expectedChainFlow: {
    partial_acRedirectUnAuth(authUrl: string, initialAuthToken: string, errorData: ErrorResponse): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_acUnauthorized(authUrl: string, initialAuthToken: string, authFailedErr: ErrorResponse): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_acAuth(authUrl: string, authToken: string, hasQueuedItem?: boolean): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_redirectedAuthorizedGet(data: object, authToken: string, initialToken: string, getUrl: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_authorizedGet(data: object, authToken: string, getUrl: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_UnAuthorizedGet(unauthorizedErr: ErrorResponse, getUrl: string, initialAuthToken?: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    simpleAuth(authUrl: string, authToken: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    simpleAuthorizedGet(authToken: string, data: any, getUrl: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    simpleUnAuthorizedGet(unauthorizedErr: ErrorResponse, authErr: ErrorResponse, getUrl: string, authUrl: string, initialAuthToken: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    simpleUnauthorizedGetTurningIntoAuthorized(authToken: string, initialAuthToken: string, authUrl: string, data: any, errorData: any, getUrl: string): {
        name: string;
        input: string;
        output: string;
        stage: string;
    }[];
    partial_unAuthorizedGet: () => never[];
};
