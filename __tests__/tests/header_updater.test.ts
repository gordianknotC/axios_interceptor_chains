import { BaseClient } from '~/base/impl/base_client_impl';
import { DataResponse, ErrorResponse, formatHeader, requestClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import mockAxios, { authToken, EServerResponse, getMockAxiosInstances, mockAdapter, mockServer } from '../__mocks__/axios';
import { Arr, Completer, Logger } from '@gdknot/frontend_common';
import { AxiosTestHelper, ChainCondition, env, RequestAuthRejectStage } from '../helpers/axo.test.helper';
import { EClientStage } from '~/index';
import { LogModules } from '~/setup/logger.setup';

const D = new Logger(LogModules.Test);

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
    //@ts-ignore
    client = new BaseClient({
      ...requestClientOption,
      requestChain: [
        requestClientOption.requestChain[0],
        requestClientOption.requestChain[1]
      ],
      responseChain: [
      ],
      authOption: {
        ...requestClientOption.authOption,
        requestChain: [],
        responseChain: []
      }
    });
    helper = new AxiosTestHelper(client, authToken.value);
    instances = getMockAxiosInstances();
    axiosInstance = Arr(instances).last;
  });
 

  describe("UpdateHeaderPlugin", ()=>{
    test("expect get function being called and headers being updated", async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const mockReturns = async ()=> expectedFetched;
      const payload = {}
      await helper.expectGetPassed(url, payload, mockReturns, expectedFetched, )
    });
    test("expect get function being called and headers being updated", async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const payload = {};
      mockServer.registerResponse(helper.client.authClient?.option.axiosConfig.url!, async ()=>({data: {
        token: preRenderedAuthToken
      }}), false);
      const fetched = await helper.get(url, payload, async()=>{
        return expectedFetched;
      });
      expect(mockAdapter).toBeCalled();
      const authHeader = {
        Authorization: authToken.value
      }
    });
    test("expect header updated", async ()=>{
      jest.clearAllMocks();
      const span = 100;
      const url = "/path/to/get/headerTest";
      const expectedFetched = {
        data: {username: "headerTest"}
      };
      const future = helper.get(url, {}, async()=>{
        await wait(span - 30);
        return expectedFetched;
      });
      expect(helper.client.option.authOption.tokenGetter()).toEqual(preRenderedAuthToken);
      const modifiedToken = "hello";
      authToken.value = modifiedToken;
      const calls = {
        header: false,
        can: false,
      }
      expect(helper.authHeaderUpdater.tokenGetter()).toBe(modifiedToken);
      expect(helper.authHeaderUpdater.tokenGetter()).not.toBe(preRenderedAuthToken);
      expect(helper.authHeaderUpdater.processFulFill).not.toBeCalled();
      
      helper.authHeaderUpdater.onCanProcess(()=>{
        console.log("authHeaderUpdater.onCanProcess");
        calls.can = true;
        authToken.value = preRenderedAuthToken;
        expect(helper.authHeaderUpdater.tokenGetter()).toBe(preRenderedAuthToken);
      })

      helper.authHeaderUpdater.onProcess(()=>{
        console.log("authHeaderUpdater.onProcess", helper.authHeaderUpdater.tokenGetter());
        calls.header = true;
        expect(helper.authHeaderUpdater.processFulFill).toBeCalled();
      })
      const result = await future;
      expect(calls.header).toBeTruthy();
      expect(calls.can).toBeTruthy();
      expect(mockAdapter).toBeCalled();
      const serverResponse: AxiosResponse = await Arr(mockAdapter.mock.results).last.value;
      expect((serverResponse.config.headers as any).Authorization).toEqual(preRenderedAuthToken)
    });
  });
 
})




