import { BaseClient } from "@/base/impl/base_client_impl";
import {
  DataResponse,
  EErrorCode,
  ErrorResponse,
  formatHeader,
  requestClientOption,
  SuccessResponse,
} from "../setup/client.test.setup";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import mockAxios, {
  authToken,
  EServerResponse,
  getMockAxiosInstances,
  mockAdapter,
  mockServer,
  UnauthorizedResponseError,
} from "../__mocks__/axios";
import {
  Arr,
  Completer,
  Logger,
  setupCurrentEnv,
} from "@gdknot/frontend_common";
import {
  AxiosTestHelper,
  ChainCondition,
  RequestAuthRejectStage,
} from "../helpers/axo.test.helper";
import { EClientStage } from "@/index";
import { LogModules } from "@/setup/logger.setup";
import { expectedChainFlow } from "../helpers/chain.test.helper";
import { rejects } from "assert";

const S = (s: any) => JSON.stringify(s);
const D = new Logger(LogModules.Test);

function wait(span: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, span);
  });
}

function time(): number {
  return new Date().getTime();
}

describe("AuthGuard", () => {
  describe("Compound Functioning testing", () => {
    const preRenderedAuthToken = authToken.value;
    let client: BaseClient<DataResponse<any>, ErrorResponse, SuccessResponse>;
    let instances: jest.Mocked<AxiosInstance>[];
    let axiosInstance: jest.Mocked<AxiosInstance>;
    let helper: AxiosTestHelper;

    beforeEach(() => {
      mockAxios;
      client = new BaseClient(requestClientOption);
      helper = new AxiosTestHelper(client, authToken.value);
      instances = getMockAxiosInstances();
      axiosInstance = Arr(instances).last;
      jest.clearAllMocks();
      setupCurrentEnv("test");
    });

    test("expect a simple get call get passed", async () => {
      expect(authToken.value).toEqual(preRenderedAuthToken);
      const url1 = "/path/to/get/url1";
      const expect1 = { data: { username: "expect1" } };
      const payload = {};
      const passedResult = await helper.expectGetPassed(
        url1,
        {},
        async () => {
          await wait(300);
          return expect1;
        },
        expect1
      );
    });

    test("expect a simple auth get passed", async () => {
      authToken.value = "hot!!";
      const expectedResponse = { data: { token: preRenderedAuthToken } };
      const useValidator = false;
      const terminate = true;
      const future = helper.auth(() => {
        return Promise.resolve(expectedResponse);
      }, useValidator);

      helper.client.onAuthFetched(async () => {
        await helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.reAuthRequestFetched
        );

        helper.client.onAuthUpdated(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.newAuthTokenBeingUpdated
          );

          helper.client.onIdle(async () => {
            await helper.expectStage_OnChainPerspective(
              RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle
            );
            console.log("end of onAthIdle...");
          }, terminate);
        }, terminate);
      }, terminate);

      const result = await future;
      expect(result).toEqual(expectedResponse);
    });

    test("expect an unauthorized request turns into authorized", async () => {
      helper.spyOnAllGuards();
      const url2 = "/path/to/get/url2";
      const expect2 = { data: { username: "expect2" } };
      const payload = {};
      const terminate = true;
      const errorResponse = {
        message: "Unauthorized",
        error_name: "Unauthorized",
        error_code: 401,
        error_key: "Unauthorized",
      };
      authToken.value = "helloworld";

      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!,
        async () => ({
          data: {
            token: preRenderedAuthToken,
          },
        }),
        false
      );

      const future2 = helper.get(url2, payload, async () => {
        console.log("wait future2");
        await wait(200);
        console.log("end of wait future2,");
        return expect2;
      });

      helper.expectRequestReject_OnServerPerspective();

      helper.client.onAuthorizing(async () => {
        D.current([
          "onAuthorizing....., request rejected and auth request not being send yet",
        ]);
        await helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.rejectedRequestPendingInQueue
        );
        await helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard
        );

        helper.client.onAuthFetched(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.reAuthRequestFetched
          );
        }, terminate);

        helper.client.onAuthUpdated(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.newAuthTokenBeingUpdated
          );
        }, terminate);

        helper.client.onIdle(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle
          );
          console.log("end of onAthIdle...");
        }, terminate);
      }, terminate);

      const result = await future2;
      await helper.expectStage_OnChainPerspective(
        RequestAuthRejectStage.origPendingRequestBeingResponse
      );

      expect(result).toEqual(expect2);
    });

    test("expect multiple unauthorized calls turning into authorized ones", async () => {
      helper.spyOnAllGuards();
      jest.spyOn(helper.client, "auth");
      const url2 = "/path/to/get/url2";
      const url3 = "/path/to/get/url3";
      const url4 = "/path/to/get/url4";
      const expect2 = { data: { username: "expect2" } };
      const expect3 = { data: { username: "expect3" } };
      const expect4 = { data: { username: "expect4" } };
      const payload = {};
      const terminate = true;
      const errorResponse = {
        message: "Unauthorized",
        error_name: "Unauthorized",
        error_code: 401,
        error_key: "Unauthorized",
      };
      authToken.value = "helloworld";
      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!,
        async () => ({
          data: {
            token: preRenderedAuthToken,
          },
        }),
        false
      );

      const future2 = helper.get(url2, payload, async () => {
        console.log("wait future2");
        await wait(200);
        console.log("end of wait future2,");
        return expect2;
      });
      const future3 = helper.get(url3, payload, async () => {
        console.log("wait future3");
        await wait(200);
        console.log("end of wait future3,");
        return expect3;
      });
      const future4 = helper.get(url4, payload, async () => {
        console.log("wait future4");
        await wait(200);
        console.log("end of wait future4,");
        return expect4;
      });
      expect(await future4).toEqual(expect4);
      expect(await future3).toEqual(expect3);
      expect(await future2).toEqual(expect2);
      expect(helper.client.auth).toBeCalledTimes(3);
      expect(helper.client.authClient?.queue.isEmpty).toBeTruthy();
    });

    test("send double request which expected to be unauthorized turning into authorized", async () => {
      const url1 = "/path/to/get/url1";
      const expect1 = { data: { username: "expect1" } };
      const url2 = "/path/to/get/url2";
      const expect3 = { data: { username: "expect2" } };
      const payload = {};
      authToken.value = "hot!!";

      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!,
        async () => ({
          data: {
            token: preRenderedAuthToken,
          },
        }),
        false
      );

      const future1 = helper.get(url1, payload, async () => {
        await wait(200);
        return expect1;
      });

      const future3 = helper.get(url2, payload, async () => {
        await wait(300);
        return expect3;
      });
      const terminate = true;
      helper.onExpectServer(EServerResponse.reject);
      helper.client.onFetching(() => {
        helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.sendingOrigRequest
        );

        helper.client.onAuthorizing(async () => {
          D.current([
            "onAuthorizing....., request rejected and auth request not being send yet",
          ]);
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.rejectedRequestPendingInQueue
          );
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard
          );

          helper.client.onAuthFetched(async () => {
            await helper.expectStage_OnChainPerspective(
              RequestAuthRejectStage.reAuthRequestFetched
            );
          }, terminate);

          helper.client.onAuthUpdated(async () => {
            await helper.expectStage_OnChainPerspective(
              RequestAuthRejectStage.newAuthTokenBeingUpdated
            );
          }, terminate);

          helper.client.onIdle(async () => {
            await helper.expectStage_OnChainPerspective(
              RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle
            );
            console.log("end of onAthIdle...");
          }, terminate);
        }, terminate);
      }, terminate);

      const A = await future1;
      const C = await future3;

      expect(A).toEqual(expect1);
      expect(C).toEqual(expect3);
    });

    test("auth request and normal request called in order, expect the rear calls(normal request) put into queue", async () => {
      helper.spyOnAllGuards();
      const url1 = "/path/to/get/url1";
      const expect1 = { data: { username: "expect1" } };
      const authExpected = { data: { token: preRenderedAuthToken } };
      const payload = {};
      authToken.value = "hot!!";

      const requestReplacer = helper.requestReplacer;
      requestReplacer.onCanProcess(() => {
        expect(requestReplacer.canProcessFulFill).toBeCalled();
        expect(requestReplacer.canProcessFulFill).toReturnWith(true);
        expect(client.stage).toBe(EClientStage.authorizing);
        requestReplacer.onProcess(() => {
          expect(requestReplacer.processFulFill).toBeCalled();

          helper.authGuard.onCanProcessReject(() => {
            console.log("helper.authGuard.onCanProcessReject");
            expect(helper.authGuard.canProcessReject).toBeCalled();
            expect(helper.authGuard.canProcessReject).toReturnWith(true);
          });
          helper.authGuard.onProcessReject(() => {
            console.log("helper.authGuard.onProcessReject");
            helper.expectRequestRestored_andAuthRequestBeingSend_onAuthGuard();
          });
        });
      }, true);

      const terminate = true;
      helper.client.onAuthorizing(async () => {
        D.current([
          "onAuthorizing....., request rejected and auth request not being send yet",
        ]);
        await helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.rejectedRequestPendingInQueue
        );
        await helper.expectStage_OnChainPerspective(
          RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard
        );

        helper.client.onAuthFetched(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.reAuthRequestFetched
          );
        }, terminate);

        helper.client.onAuthUpdated(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.newAuthTokenBeingUpdated
          );
        }, terminate);

        helper.client.onIdle(async () => {
          await helper.expectStage_OnChainPerspective(
            RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle
          );
          console.log("end of onAthIdle...");
        }, terminate);
      }, terminate);

      const acCalls = {
        acFetcher: false,
        acToken: false,
        acAuth: false,
        acIdle: false,
      };
      helper.acFetchedMarker.onCanProcess(() => {
        acCalls.acFetcher = true;
      });
      helper.acTokenUpdater.onCanProcess(() => {
        acCalls.acToken = true;
      });
      helper.acAuthGuard.onCanProcess(() => {
        acCalls.acAuth = true;
        expect(helper.client.queue.queue.length).toBe(1);
        helper.acAuthGuard.onProcess(() => {
          expect(helper.acAuthGuard.processFulFill);
        });
      });
      helper.acIdleMarker.onCanProcess(() => {
        acCalls.acIdle = true;
      });

      const authFuture = helper.auth(async () => {
        D.info(["auth0"]);
        await wait(250);
        D.info(["auth1"]);
        return authExpected;
      }, false);

      const future1 = helper.get(url1, payload, async () => {
        D.info(["get 0"]);
        await wait(300);
        D.info(["get 1"]);
        return expect1;
      });

      const A = await future1;
      const B = await authFuture;
      expect(acCalls.acFetcher).toBe(true);
      expect(acCalls.acToken).toBe(true);
      expect(acCalls.acAuth).toBe(true);
      expect(acCalls.acIdle).toBe(true);

      expect(A).toEqual(expect1);
      expect(B).toEqual(authExpected);
    });

    test("tokenUpdater updating an undefined token, expect rasing error", () => {
      helper.spyOnAllGuards();
      const authExpected = { data: { token: undefined } };
      authToken.value = preRenderedAuthToken;
      expect(
        helper.auth(async () => {
          await wait(250);
          return authExpected;
        }, false)
      ).rejects.toThrowError("Unexpected tokenGetter/tokenUpdater");
    });

    test("consecutively reAuth with an invalid token - expect throws and empty queue", async () => {
      helper.spyOnAllGuards();
      const span = 300;
      const url1 = "/path/to/get/url1";
      const url2 = "/path/to/get/url21";
      const expect1 = { data: { username: "expect1" } };
      const expect2 = { data: { username: "expect2" } };
      const authExpected = { data: { token: "may" } };
      const payload = {};
      authToken.value = "hot!!";

      const authFuture = helper.auth(async () => {
        D.info(["auth0"]);
        await wait(250);
        D.info(["auth1"]);
        return authExpected;
      }, false);

      const future1 = helper.get(url1, payload, async () => {
        D.info(["get 0"]);
        await wait(span);
        D.info(["get 1"]);
        return expect1;
      });
      const future2 = helper.get(url2, payload, async () => {
        D.info(["get 20"]);
        await wait(span);
        D.info(["get 21"]);
        return expect2;
      });
      const future3 = helper.get(url2, payload, async () => {
        D.info(["get 20"]);
        await wait(span);
        D.info(["get 21"]);
        return expect2;
      });

      expect(future1).rejects.toThrow();
      expect(future2).rejects.toThrow();
      expect(future3).rejects.toThrow();
      expect(authFuture).resolves.toEqual(authExpected);
      await wait(100);
      expect(helper.client.queue.queue.length).toBe(3);
      await wait(span);
      expect(helper.client.queue.queue.length).toBe(0);
    });

    test("consecutively send get and auth request orderly in a human nature way, expect rear auth request not being processed since it's canAuth feature", async () => {
      const url1 = "/path/to/get/url1";
      const expect1 = { data: { username: "expect1" } };
      const authExpected = { data: { token: preRenderedAuthToken } };
      const payload = {};
      authToken.value = "hot!!";
      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!,
        async () => ({
          data: {
            token: preRenderedAuthToken,
          },
        }),
        false
      );

      const future1 = helper.get(url1, payload, async () => {
        await wait(300);
        return expect1;
      });

      await wait(100);
      expect(helper.client.authClient?.canAuth).toBeFalsy();

      const authFuture = helper.auth(async () => {
        await wait(250);
        return authExpected;
      }, false);

      const A = await future1;
      const B = await authFuture;
      expect(A).toEqual(expect1);
      expect(B).toEqual(authExpected);
    });

    test("consecutively almost simultaneously send get and auth request in order, expect rear auth call pass the right authorization to the unauthorized get request", async () => {
      const url1 = "/path/to/get/url1";
      const expect1 = { data: { username: "expect1" } };
      const authExpected = { data: { token: preRenderedAuthToken } };
      const payload = {};
      authToken.value = "hot!!";
      helper.clearTestRecords();

      mockServer.registerResponse(
        helper.client.authClient?.option.axiosConfig.url!,
        async () => ({
          data: {
            token: preRenderedAuthToken,
          },
        }),
        false
      );

      const future1 = helper.get(url1, payload, async () => {
        await wait(300);
        return expect1;
      });

      const authFuture = helper.auth(async () => {
        await wait(250);
        return authExpected;
      }, false);

      helper.client.onAuthorizing(() => {
        helper.client.onAuthFetched(() => {
          expect(helper.acFetchedMarker.canProcessFulFill).toBeCalled();
        });
        helper.authGuard.onCanProcessReject(() => {
          expect(helper.acFetchedMarker.canProcessFulFill).toBeCalled();
        });
      });
      helper.authGuard.onCanProcessReject(() => {
        expect(helper.acFetchedMarker.canProcessFulFill).not.toBeCalled();
      });
      // helper.authGuard.onProcessReject(()=>{
      // });
      const A = await future1;
      const B = await authFuture;
      expect(A).toEqual(expect1);
      expect(B).toEqual(authExpected);
    });
  });
});
