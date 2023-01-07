import { BaseRemoteClient } from '@/index';
import { authToken, DataResponse, ErrorResponse, formatHeader, remoteClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios, { AxiosInstance, AxiosResponse } from "axios";
import mockAxios, { getMockAxiosInstances, mockAdapter, mockServer } from '../__mocks__/axios';
import { Arr } from '@gdknot/frontend_common';
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
      console.log("mocked get...");
      return Promise.resolve({data: {key: "val"}})
    }); 

    // console.log("client.get path:", path);
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
      const config = {url};
      const expectedFetched = {
        data: {username: "hello"}
      };
      const fetched = helper.get(url, {}, ()=>{
        return expectedFetched;
      });
      expect(await fetched).toEqual(expectedFetched);
      expect(mockAdapter).toBeCalled();
      const authHeader = {
        common: {
          Authorization: authToken
        }
      }
      const lastVal: AxiosResponse = await Arr(mockAdapter.mock.results).last.value;
      console.log("AxiosConfig:", JSON.stringify(lastVal));
      expect((lastVal.headers as any).format).toEqual(formatHeader.format);
      expect((lastVal.headers as any).common.Authorization).toEqual(authHeader.common.Authorization);
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


