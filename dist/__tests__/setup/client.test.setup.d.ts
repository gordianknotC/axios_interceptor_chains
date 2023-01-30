import { ClientOption } from "../../base/itf/client_itf";
import { _EErrorCode } from "../__mocks__/axios";
export declare const EErrorCode: typeof _EErrorCode;
export type DataResponse<T> = {
    data: T;
    pager: any;
};
export type ErrorResponse = {
    error_key: string;
    error_code: string;
    error_msg: string;
    message: string;
};
export type SuccessResponse = {
    succeed: boolean;
};
export type AuthResponse = DataResponse<{
    token: string;
}>;
export declare const formatHeader: {
    value: {
        format: string;
    };
};
export declare const requestClientOption: ClientOption<DataResponse<any>, ErrorResponse, SuccessResponse>;
