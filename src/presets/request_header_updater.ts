import { BaseRequestHeaderGuard } from "@/base/impl/base_request_header_updater_impl";
import { AxiosHeaders } from "axios";

export type AxiosHeaderValue = AxiosHeaders | string | string[] | number | boolean | null;
export type RawAxiosHeaders = Record<string, AxiosHeaderValue>;

export class UpdateAuthHeaderPlugin<
  RESPONSE ,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private tokenGetter: ()=>string
  ){
    super();
  }
  protected appendRequestHeader():  RawAxiosHeaders{
    return {
      Authorization: this.tokenGetter(),
    }
  }
}

export class UpdateExtraHeaderPlugin<
  RESPONSE  ,
  ERROR,
  SUCCESS
> extends BaseRequestHeaderGuard<RESPONSE, ERROR, SUCCESS> {
  constructor(
    private headerGetter: ()=>any
  ){
    super();
  }
  protected appendRequestHeader(): RawAxiosHeaders {
    return this.headerGetter();
  }
}




