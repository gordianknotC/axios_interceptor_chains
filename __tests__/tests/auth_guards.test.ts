import { BaseClient } from '@/base/impl/base_client_impl';
import { DataResponse, EErrorCode, ErrorResponse, formatHeader, requestClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import mockAxios, { authToken, AuthTokenExpiredError, EServerResponse, getMockAxiosInstances, mockAdapter, mockServer, UnauthorizedResponseError } from '../__mocks__/axios';
import { Arr, Completer, Logger } from '@gdknot/frontend_common';
import { AxiosTestHelper, ChainCondition, env, RequestAuthRejectStage } from '../helpers/axo.test.helper';
import { EClientStage } from '@/index';
import { LogModules } from '@/setup/logger.setup';
import { expectedChainFlow } from '../helpers/chain.test.helper';
import { rejects } from 'assert';

const S = (s: any)=>JSON.stringify(s)
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
 
describe("AuthGuard", ()=>{
  describe("Unit Function testing", ()=>{
    const preRenderedAuthToken = authToken.value;
    let client: BaseClient<DataResponse<any>, ErrorResponse, SuccessResponse>;
    let helper: AxiosTestHelper;
    
    beforeEach(()=>{
      mockAxios;
      client = new BaseClient(requestClientOption);
      helper = new AxiosTestHelper(client, authToken.value);
      mockServer.clear();
      jest.clearAllMocks();
    });

    test("simple authorization - A - valid initialToken not provided", async ()=>{
      authToken.value = "hot!!";
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const useValidator = false;
      const authUrl = helper.client.authClient?.option.axiosConfig.url!;
      const future = helper.auth(()=>{
        return Promise.resolve(expectedResponse);
      }, useValidator);
      const received = await future;
      console.dir(helper.chainTestStacks, {colors: true, depth: 5});
      expect(helper.chainTestStacks)
        .toEqual(expectedChainFlow.simpleAuth(authUrl, preRenderedAuthToken))
    });
    test("simple authorization - B - valid initialToken provided", async ()=>{
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const useValidator = false;
      const authUrl = helper.client.authClient?.option.axiosConfig.url!;
      const future = helper.auth(()=>{
        return Promise.resolve(expectedResponse);
      }, useValidator);
      const received = await future;
      console.dir(helper.chainTestStacks, {colors: true, depth: 5});
      expect(helper.chainTestStacks)
        .toEqual(expectedChainFlow.simpleAuth(authUrl, preRenderedAuthToken))
    });
    test("simple authorization failed", async ()=>{
    });
    test("simple authorized get", async ()=>{
      const url1 = "/path/to/get/url1";
      const expect1 = {data: {username: "expect1"}};
      const result = await helper.get(url1, {}, async ()=>{
        await wait(300);
        return expect1;
      });
      console.dir(helper.chainTestStacks, {colors: true, depth: 5});
      expect(helper.chainTestStacks)
        .toEqual(expectedChainFlow.simpleAuthorizedGet(preRenderedAuthToken, S(expect1.data), url1))
    });
    test("simple unauthorized get", async ()=>{
      mockServer.clear();
      const initialToken = "hot!!";
      const getUrl = "/path/to/get/url1";
      const authUrl = helper.client.authClient?.option.axiosConfig.url!;
      const expect1 = {data: {username: "expect1"}};
      const useAuthValidator = false;
      const authResponseStatus = axios.HttpStatusCode.Unauthorized;
      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!, 
        async ()=>({
          ...AuthTokenExpiredError
        }), 
        useAuthValidator, 
        authResponseStatus
      );
      authToken.value = initialToken;

      const unauthorizedErr = UnauthorizedResponseError as ErrorResponse;
      const authErr = AuthTokenExpiredError as ErrorResponse;
      const result =  await helper.get(getUrl, {}, async ()=>{
        await wait(300);
        return expect1;
      }).then((_)=>{
        expect(true, "expect reject, not resolve").toBeFalsy();
        return _;
      }).catch((e)=>{
        expect(helper.client.authClient?.option.tokenGetter()).toBe(authToken.value);
        expect(helper.client.authClient?.option.tokenGetter()).toBe(initialToken);
        expect(authToken.value, "expect unauthorized").toBe(initialToken)
        console.group("[CHAIN]");
        console.dir(helper.chainTestStacks, {colors: true, depth: 5});
        console.groupEnd();
        return e;
      });

      expect(helper.chainTestStacks)
        .toEqual(expectedChainFlow.simpleUnAuthorizedGet(
          unauthorizedErr, authErr, getUrl, authUrl, initialToken
        ));
    }); 
    
    test("simple unauthorized get turning into authorized", async ()=>{
      const initialAuthToken =  "hot!!";
      authToken.value = initialAuthToken;
      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!, 
        async ()=>({data: {
          token: preRenderedAuthToken
        }}), false
      );
      const url1 = "/path/to/get/url1";
      const expect1 = {data: {username: "expect1"}};
      const future = helper.get(url1, {}, async ()=>{
        await wait(300);
        return expect1;
      });
      const errorData = UnauthorizedResponseError as ErrorResponse;
      const authUrl = helper.client.authClient?.option.axiosConfig.url!;
      expect(future).resolves.not.toThrow();
      future.then((_)=>{
        console.dir(helper.chainTestStacks, {colors: true, depth: 5});
        expect(helper.chainTestStacks)
          .toEqual(expectedChainFlow.simpleUnauthorizedGetTurningIntoAuthorized(
            preRenderedAuthToken, initialAuthToken, authUrl, expect1.data, errorData, url1
          ))
      });
    }); 
  });
  
})




