import { BaseClient } from '@/base/impl/base_client_impl';
import { DataResponse, ErrorResponse, formatHeader, requestClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import mockAxios, { authToken, EServerResponse, getMockAxiosInstances, mockAdapter, mockServer } from '../__mocks__/axios';
import { Arr, Completer, Logger } from '@gdknot/frontend_common';
import { AxiosTestHelper, ChainCondition, env, RequestAuthRejectStage } from '../helpers/axo.test.helper';
import { EClientStage } from '@/index';
import { LogModules } from '@/setup/logger.setup';

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
        return Promise.resolve({testIdle: "triggered or not"})
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

    test("send auth triple times, expect triggered once only", async ()=>{
      const lbound = mockAdapter.mock.results.length;
      let future1, future2, future3;
      
      mockServer.registerResponse(helper.client.authClient?.option.axiosConfig.url!, async ()=>{
        await wait(100);
        return Promise.resolve({data: {
          token: preRenderedAuthToken
        }});
      }, false);

      helper.client.onAuthorizing(()=>{
        console.log("onAuthorizing...");
        // called.onAuthorizing = true;
        expect(helper.client.authClient?.authCompleter).not.toBeUndefined();
        expect(helper.client.authClient?.canAuth).toBeFalsy();
        future2 = helper.client.auth();
        future3 = helper.client.auth();
        
        helper.client.onAuthFetched(()=>{
          // called.onAuthFetched = true;
          helper.expectRequestReject_OnChainPerspectiveByCondition({
            chain: helper.acFetchedMarker, condition: ChainCondition.bypassProcess
          })
        })

        helper.client.onAuthUpdated(()=>{
          // called.onAuthUpdated = true;
          expect(authToken.value).toEqual(preRenderedAuthToken);
          helper.expectRequestReject_OnChainPerspectiveByCondition({
            chain: helper.acTokenUpdater, condition: ChainCondition.processOnly
          })
        })
      });

      expect(helper.client.authClient?.canAuth).toBeTruthy();
      future1 = helper.client.auth();
      await wait(50);

      const r1 = await future1;
      const r2 = await future2;
      const r3 = await future3;

      expect(mockAdapter, "Adapter should be called").toBeCalled();
      expect(mockAdapter.mock.results.length).toBe(lbound + 1);
      
      expect(helper.client.stage).toBe(EClientStage.idle)
      expect(r1).toEqual(r2);
      expect(r1).toEqual(r3);
      expect(r2).toEqual(r3);
    });

    test("consecutively auth calling within min interval, expect only one call accepted", async ()=>{
      jest.clearAllMocks();
      const lbound = mockAdapter.mock.results.length;
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const interval =helper.client.authClient!.option.interval ?? 1000;
      const result = await helper.auth(()=>{
        return Promise.resolve(expectedResponse);
      }, false);
      await wait(interval/2);
      expect(helper.client.authClient?.callInterval).toBeLessThan(interval);
      const result2 = await helper.auth(()=>{
        return Promise.resolve({});
      }, false);
      expect(mockAdapter, "Adapter should be called").toBeCalled();
      expect(mockAdapter.mock.results.length).toBe(lbound + 1);
    });

    test("consecutively auth calling beyond min interval, expect both dual calls accepted", async ()=>{
      jest.clearAllMocks();
      const lbound = mockAdapter.mock.results.length;
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const interval =helper.client.authClient!.option.interval ?? 1000;
      const result1 = await helper.auth(()=>{
        return Promise.resolve(expectedResponse);
      }, false);
      await wait(interval + 100);
      expect(helper.client.authClient?.callInterval).toBeGreaterThan(interval);
      const result2 = await helper.auth(()=>{
        return Promise.resolve({data: {token: "hello"}});
      }, false);
      expect(result1).not.toEqual(result2);
      expect(mockAdapter, "Adapter should be called").toBeCalled();
      expect(mockAdapter.mock.results.length).toBe(lbound + 2);
    });

    test("expect authCounter have been reset every seconds", async ()=>{
      const expectedResponse = {data: {token: preRenderedAuthToken}};
      const authCounter = ()=>(helper.client.authClient as any).authCounter;
      const totalCounter = ()=>(helper.client.authClient as any)._totalAuthCounter;
      function addThreeCall(){
        helper.auth(()=>{
          return Promise.resolve(expectedResponse);
        }, false);
        helper.auth(()=>{
          return Promise.resolve(expectedResponse);
        }, false);
        helper.auth(()=>{
          return Promise.resolve(expectedResponse);
        }, false);
      }
      addThreeCall();
      await wait(400);
      expect(authCounter()).toBe(3);
      addThreeCall()
      await wait(600)
      expect(authCounter()).toBe(0)
      expect(totalCounter()).toBe(6)
    })
  })
})




