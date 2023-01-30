import { ClientRequestAuthHeaderUpdater, ClientRequestExtraHeaderUpdater, } from "../../presets/request_header_updater";
import { AuthResponseGuard } from "../../presets/auth_response_guard";
import { NetworkErrorResponseGuard } from "../../presets/network_error_response_guard";
import { RequestReplacer } from "../../presets/request_replacer";
import { ACAuthResponseGuard, ACFetchedMarker, ACIdleMarker, ACTokenUpdater } from "../../presets/auth_client_guards";
import { authToken, _EErrorCode } from "../__mocks__/axios";
export const EErrorCode = _EErrorCode;
const timeout = 10 * 1000;
const baseURL = "http://localhost";
export const formatHeader = { value: { format: "mock" } };
const authUrl = "path/to/auth_url";
export const requestClientOption = {
    isSuccessResponse: (s) => s.succeed != undefined,
    isDataResponse: (d) => d.data != undefined,
    isErrorResponse: (e) => e.error_code != undefined,
    axiosConfig: {
        baseURL,
        timeout,
    },
    requestChain: [
        new ClientRequestAuthHeaderUpdater(function () {
            return authToken.value;
        }),
        new ClientRequestExtraHeaderUpdater(function () {
            return formatHeader.value;
        }),
        new RequestReplacer(
        // replacementIdentifier = BaseRequestReplacer...
        ),
    ],
    responseChain: [
        new AuthResponseGuard(),
        new NetworkErrorResponseGuard(function networkError(error) {
            console.log("detect network error:", error);
        }),
    ],
    authOption: {
        axiosConfig: {
            url: authUrl,
            baseURL,
            timeout: 12000,
        },
        interval: 600,
        requestChain: [],
        responseChain: [
            new ACFetchedMarker(),
            new ACTokenUpdater(),
            new ACAuthResponseGuard(),
            new ACIdleMarker(),
        ],
        payloadGetter: function () {
            return null;
        },
        tokenGetter: function () {
            console.log("tokenGetter:", authToken.value);
            return authToken.value;
        },
        tokenUpdater: function (response) {
            try {
                console.log("tokenUpdater", response.data.data.token);
                authToken.value = response.data.data.token;
            }
            catch (e) {
                console.error("tokenUpdater error, response:", response, "\nerror:", e);
                throw e;
            }
        },
        redirect: function (response) {
            console.log("redirect home");
            return null;
        },
    },
};
//# sourceMappingURL=client.test.setup.js.map