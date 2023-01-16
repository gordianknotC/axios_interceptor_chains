import axios from "axios";
import { merge } from "merge-anything";
export class MockedServer {
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
    }
    setAuthHeaderGuard(validator) {
        this.headerValidator = validator;
    }
    registerResponse(url, response, useValidator = true) {
        this.registry[url] = merge(this.defaultResponse, { data: response, useValidator });
        console.log("register response:", url, this.registry[url]);
    }
    getResponse(config) {
        const url = config.url;
        const header = config.headers;
        const response = {
            ...(this.registry[url] ?? this.defaultResponse),
            config,
        };
        const useValidator = ((this.registry[url])?.useValidator) ?? true;
        console.log("mockServer getResponse", url);
        if (this.registry[url]) {
            console.log("found registered result on url", url, this.registry[url]);
        }
        if (useValidator) {
            if (!this.headerValidator) {
                console.log("no header validator - resolve response:");
                return Promise.resolve(response);
            }
            else {
                const errorResponse = this.headerValidator(config);
                const isHeaderValid = errorResponse == undefined;
                if (isHeaderValid) {
                    console.log("valid header - resolve response:");
                    return Promise.resolve(response);
                }
                else {
                    console.log("invalid header - reject response:", config.headers);
                    return Promise.reject(errorResponse);
                }
            }
        }
        else {
            return Promise.resolve(response);
        }
    }
    clear() {
        this.registry = {};
    }
}
//# sourceMappingURL=mocked_server.js.map