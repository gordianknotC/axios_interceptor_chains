import { BaseRemoteClient } from '@/base/impl/remote_client_impl';
import { authToken, DataResponse, ErrorResponse, formatHeader, remoteClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import mockAxios, { getMockAxiosInstances, mockAdapter } from '../__mocks__/axios';
import { Arr, Completer } from '@gdknot/frontend_common';
import { AxiosTestHelper } from '../helpers/axo.test.helper';

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
  let client: BaseRemoteClient<DataResponse, ErrorResponse, SuccessResponse>;
  let instances: jest.Mocked<AxiosInstance>[];
  let axiosInstance: jest.Mocked<AxiosInstance>;
  let helper: AxiosTestHelper;
  beforeEach(()=>{
    mockAxios;
    client = new BaseRemoteClient(remoteClientOption);
    helper = new AxiosTestHelper(
      client,
      remoteClientOption.requestChain[0] as any, 
      remoteClientOption.requestChain[1] as any,
      remoteClientOption.responseChain[0] as any,
    );
    instances = getMockAxiosInstances();
    axiosInstance = Arr(instances).last;
  });

  test("mock instance, expect axios being called and axios instance being created", ()=>{
    const path = "/path/to/get";
    const payload = {username: "hello"};
    expect(instances.length).toBe(1);
    expect((client.client.get as any).mock).not.toBeUndefined();
    //@ts-ignore
    (client.client.get as any).mockResolvedValueOnce((url, config)=>{
      return Promise.resolve({data: {key: "val"}})
    }); 

    client.get(path, payload);
    expect(client.get).toHaveBeenCalledWith(path, payload);
  });

  test("Expect request chain being chained in sequence", ()=>{
    expect(true).toBeTruthy();
    expect(client.requestChain.length).toBe(2);
    expect(client.responseChain.length).toBe(1);
    expect(client.requestChain[0].next).toBe(client.requestChain[1]);
    expect(client.requestChain[1].prev).toBe(client.requestChain[0]);
    expect(client.requestChain[1].prev!.next!).toBe(client.requestChain[1]);
    expect(client.requestChain[0].next!.prev!).toBe(client.requestChain[0]);
  });

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

    test("modify header force to raise unauthorized",async ()=>{
      const url = "/path/to/get";
      const expectedFetched = {
        data: {username: "hello"}
      };
      const mockReturns = {
        "error_code": 401,
        "error_key": "Unauthorized",
        "error_name": "Unauthorized",
        "message": "Unauthorized",
      };
      const payload = {};
      const completer = new Completer();
      const wait = (helper.authHeaderUpdater!.process as any as jest.SpyInstance)
        .withImplementation(
          (config: AxiosRequestConfig<any>)=>{
            return config;
          }, async ()=>{
            return completer.future;
          }
        );
      await helper.expectGetPassed(url,payload, mockReturns, expectedFetched);
      completer.complete({});
      (helper.authHeaderUpdater!.process as any as jest.SpyInstance).withImplementation
    })
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


