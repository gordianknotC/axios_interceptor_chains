export function getMockedAdapter(mockServer) {
    const mockAdapter = jest.fn((config) => {
        config.headers.set("User-Agent", "axios/" + "1.2.1", false);
        console.log("before mockServer.getResponse, headers:", config.headers);
        const response = mockServer.getResponse(config);
        config.data = response;
        console.log("mockAdapter return response");
        return response;
    });
    mockAdapter.__name__ = "mockAdapter";
    return mockAdapter;
}
//# sourceMappingURL=mocked_adapter.js.map