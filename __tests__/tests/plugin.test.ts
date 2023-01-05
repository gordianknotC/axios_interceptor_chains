import { BaseRemoteClient } from '@/index';
import { DataResponse, ErrorResponse, remoteClientOption, SuccessResponse } from '../setup/client.test.setup';
import axios from "axios";

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
  beforeEach(()=>{
    console.log("remoteClientOption:", remoteClientOption);
    client = new BaseRemoteClient(remoteClientOption)
  });

  test("", ()=>{
    expect(true).toBeTruthy();
  });
});


