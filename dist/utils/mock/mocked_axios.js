import axios from "axios";
import { assert } from "@gdknot/frontend_common";
import { getMockedAdapter } from "./mocked_adapter";
import { MockedServer } from "./mocked_server";
export function getMockedAxios(validToken) {
    const mockAxios = jest.createMockFromModule("axios");
    const origCreate = jest.spyOn(axios, "create");
    let instances = [];
    const mockServer = new MockedServer(validToken);
    const mockAdapter = getMockedAdapter(mockServer);
    mockAxios.create = ((config) => {
        config.adapter = mockAdapter;
        const _origInst = origCreate(config);
        const _origRequest = _origInst.request.bind(_origInst);
        assert(() => _origInst != undefined);
        const inst = jest.mocked(_origInst);
        jest.spyOn(inst, "get");
        jest.spyOn(inst, "put");
        jest.spyOn(inst, "delete");
        jest.spyOn(inst, "post");
        jest.spyOn(inst, "request");
        // console.log(" - -  - - send request", inst.request.mock, inst.defaults == undefined);
        // inst.get("abc/efg", {url: "abc/efg"});
        assert(() => inst != undefined);
        assert(() => inst.get.mock != undefined);
        // const inst = jest.createMockFromModule<AxiosInstance>('axios') as jest.Mocked<AxiosInstance>;
        // inst.defaults = { ...inst.defaults, ...config } as any;
        instances.push(inst);
        const origUseRequest = inst.interceptors.request.use.bind(inst.interceptors.request);
        const origUseResponse = inst.interceptors.response.use.bind(inst.interceptors.response);
        inst.interceptors.request.use = jest.fn((fulfilled, rejected, options) => {
            return origUseRequest(fulfilled, rejected, options);
        });
        inst.interceptors.response.use = jest.fn((fulfilled, rejected, options) => {
            return origUseResponse(fulfilled, rejected, options);
        });
        return inst;
    });
    function getMockAxiosInstances() {
        return instances;
    }
    function mostRecentAxiosInstanceSatisfying(fn) {
        return instances.filter(fn).at(-1);
    }
    function clearMockAxios() {
        instances = [];
    }
    return {
        axios: mockAxios,
        mockAxios,
        mockAdapter,
        mockServer,
        clearMockAxios,
        mostRecentAxiosInstanceSatisfying,
        getMockAxiosInstances
    };
}
//# sourceMappingURL=mocked_axios.js.map