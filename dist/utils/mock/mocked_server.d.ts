import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
export declare class MockedServer {
    validToken: string;
    registry: Record<string, Omit<AxiosResponse, "config"> & {
        useValidator: boolean;
    }>;
    defaultResponse: Omit<AxiosResponse, "config"> & {
        useValidator: boolean;
    };
    constructor(validToken: string);
    private headerValidator?;
    setAuthHeaderGuard(validator: (config: AxiosRequestConfig) => AxiosError | undefined | null): void;
    registerResponse(url: string, response: any, useValidator?: boolean): void;
    getResponse(config: AxiosRequestConfig): Promise<AxiosResponse | AxiosError>;
    clear(): void;
}
