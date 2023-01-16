import { BaseClient } from '@/base/impl/client_impl';
import { authToken, authUrl, DataResponse, ErrorResponse, formatHeader, requestClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import mockAxios, { getMockAxiosInstances, mockAdapter, mockServer } from '../__mocks__/axios';
import { Arr, Completer } from '@gdknot/frontend_common';
import { AxiosTestHelper } from '../helpers/axo.test.helper';
import { EClientStage } from '@/index';

function wait (span: number): Promise<boolean>{
  return new Promise(resolve =>{
    setTimeout(()=>{
      resolve(true);
    }, span);
  });
}
function time(): number{
  return (new Date()).getTime();
}
 
describe("Services", ()=>{
  const preRenderedAuthToken = authToken.value;
  let client: BaseClient<DataResponse<any>, ErrorResponse, SuccessResponse>;
  let instances: jest.Mocked<AxiosInstance>[];
  let axiosInstance: jest.Mocked<AxiosInstance>;
  let helper: AxiosTestHelper;
  beforeEach(()=>{
    mockAxios;
    client = new BaseClient(requestClientOption);
    helper = new AxiosTestHelper(client, authToken.value);
    instances = getMockAxiosInstances();
    axiosInstance = Arr(instances).last;
  });

  describe("Remote Client", ()=>{
    test("Expect request chain being chained in sequence", ()=>{
      expect(client.requestChain.length).toBe(3);
      expect(client.responseChain.length).toBe(2);
      expect(client.requestChain[0].next).toBe(client.requestChain[1]);
      expect(client.requestChain[1].prev).toBe(client.requestChain[0]);
      expect(client.requestChain[1].next).toBe(client.requestChain[2]);
      expect(client.requestChain[2].prev).toBe(client.requestChain[1]);
      expect(client.requestChain[1].prev!.next!).toBe(client.requestChain[1]);
      expect(client.requestChain[0].next!.prev!).toBe(client.requestChain[0]);
    });
  
    test("expect idle stage", ()=>{
      expect(client.stage).toBe(EClientStage.idle);
    });
    test("send a request, expect fetching then switch to idle while there's nothing to do", async ()=>{
      expect(client.stage).toBe(EClientStage.idle);
      const future = helper.get("path/url/idle_triggered_or_not", {}, ()=>{
        return {testIdle: "triggered or not"}
      });
      expect(client.stage).toBe(EClientStage.fetching);
      await future;
      const msg = "interceptors did mount by design on non-auth request";
      expect(client.stage).toBe(EClientStage.idle);
      expect(helper.authHeaderUpdater?.canProcessFulFill, msg).toBeCalled();
      expect(helper.extraHeaderUpdater?.canProcessFulFill, msg).toBeCalled();
      expect(helper.authGuard?.canProcessFulFill, msg).toBeCalled();
      expect(helper.networkErrorGuard?.canProcessFulFill, msg).toBeCalled();
      expect(mockAdapter).toBeCalled();
    });

    test("authA, expect throw an unAuthorization error by remote server", async()=>{
      authToken.value = "hot!!";
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const useValidator = true;
      expect(helper.auth(()=>{
        return expectedResponse;
      }, useValidator)).resolves.toThrow();
      
      authToken.value = preRenderedAuthToken;
    });

    test("authB", async ()=>{
      authToken.value = "hot!!";
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const useValidator = false;
      mockServer.registerResponse(authUrl, {data: {
        token: preRenderedAuthToken
      }}, useValidator);
      const future = helper.auth(()=>{
        return expectedResponse;
      }, useValidator);
      const msg = "interceptors did not mount by design on auth request";
      expect(client.stage).toBe(EClientStage.authorizing);
      expect(helper.authHeaderUpdater?.canProcessFulFill, msg).not.toBeCalled();
      expect(helper.extraHeaderUpdater?.canProcessFulFill, msg).not.toBeCalled();
      expect(helper.authGuard?.canProcessFulFill, msg).not.toBeCalled();
      expect(helper.networkErrorGuard?.canProcessFulFill, msg).not.toBeCalled();
      
      const result = await future;
      expect(result).toEqual(expectedResponse);
      expect(client.stage).toBe(EClientStage.idle);
      authToken.value = preRenderedAuthToken;
    });
  })

  describe("UpdateHeaderPlugin", ()=>{
    test("expect get function being called and headers being updated", async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const mockReturns = expectedFetched;
      const payload = {}
      await helper.expectGetPassed(url, payload, mockReturns, expectedFetched, )
    });
    test("expect get function being called and headers being updated", async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const mockReturns = {
        "error_code": 401,
        "error_key": "Unauthorized key",
        "error_name": "Unauthorized name",
        "message": "Unauthorized message",
      };
      const payload = {};
      
      mockServer.registerResponse(authUrl, {data: {
        token: preRenderedAuthToken
      }}, false);
      const fetched = await helper.get(url, payload, ()=>{
        return expectedFetched;
      });
      expect(mockAdapter).toBeCalled();
      const authHeader = {
        Authorization: authToken.value
      }
    });
  
    test("modify header force to raise unauthorized error",async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const mockReturns = {
        "error_code": 401,
        "error_key": "Unauthorized key",
        "error_name": "Unauthorized name",
        "message": "Unauthorized message",
      };
      const payload = {};
      authToken.value = "hot!!";
      
      mockServer.registerResponse(authUrl, {data: {
        token: preRenderedAuthToken
      }}, false);
      const fetched = await helper.get(url, payload, ()=>{
        return expectedFetched;
      });
      expect(mockAdapter).toBeCalled();
      expect(fetched).toEqual(expectedFetched);
    });
  });

  
  describe("AuthGuard", ()=>{
    test("fetch a authorized request expect pass", ()=>{
      expect(true).toBeTruthy();
    });

    test("send an unauthorized request, expect authorizing and pending current one", ()=>{
      expect(true).toBeTruthy();
    });
  });

});


