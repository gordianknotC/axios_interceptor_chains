define("src/setup/logger.setup", ["require", "exports", "@gdknot/frontend_common", "@gdknot/frontend_common/dist/utils/logger.types"], function (require, exports, frontend_common_1, logger_types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogModules = exports.logger = exports.EModules = void 0;
    var EModules;
    (function (EModules) {
        EModules["Client"] = "Client";
        EModules["AuthGuard"] = "AuthGuard";
        EModules["AuthClient"] = "AuthClient";
        EModules["RequestReplacer"] = "RequestReplacer";
        EModules["HeaderUpdater"] = "HeaderUpdater";
        EModules["Plugin"] = "Plugin";
        EModules["Test"] = "Test";
    })(EModules = exports.EModules || (exports.EModules = {}));
    function logger(module) {
        return (0, frontend_common_1.LazyHolder)(() => new frontend_common_1.Logger(module));
    }
    exports.logger = logger;
    const ClientModule = {
        moduleName: EModules.Client,
        disallowedHandler: (level) => false,
    };
    const modules = [
        ClientModule,
        { ...ClientModule, moduleName: EModules.Test },
        { ...ClientModule, moduleName: EModules.AuthGuard },
        { ...ClientModule, moduleName: EModules.AuthClient },
        { ...ClientModule, moduleName: EModules.Plugin },
        { ...ClientModule, moduleName: EModules.RequestReplacer },
        { ...ClientModule, moduleName: EModules.HeaderUpdater }
    ];
    frontend_common_1.Logger.setLevelColors({
        [logger_types_1.ELevel.trace]: (msg) => msg.grey,
        [logger_types_1.ELevel.debug]: function (msg) {
            return msg.white;
        },
        [logger_types_1.ELevel.info]: function (msg) {
            return msg.blue;
        },
        [logger_types_1.ELevel.warn]: function (msg) {
            return msg.yellow;
        },
        [logger_types_1.ELevel.current]: function (msg) {
            return msg.cyanBG;
        },
        [logger_types_1.ELevel.error]: function (msg) {
            return msg.red;
        },
        [logger_types_1.ELevel.fatal]: function (msg) {
            return msg.bgBrightRed;
        },
    });
    exports.LogModules = frontend_common_1.Logger.setLoggerAllowanceByEnv({
        test: modules,
        develop: modules
    });
    frontend_common_1.Logger.setCurrentEnv(() => {
        return "production";
    });
});
define("src/utils/common_utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ensureCanReject = exports.ensureCanProcessFulFill = exports.ensureNoRaise = exports.wait = void 0;
    function wait(span) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, span);
        });
    }
    exports.wait = wait;
    function ensureNoRaise(action, defaults) {
        try {
            return action();
        }
        catch (e) {
            // console.warn(`catch error on`, e);
            return defaults(e);
        }
    }
    exports.ensureNoRaise = ensureNoRaise;
    function ensureCanProcessFulFill(action) {
        return ensureNoRaise(action, () => false);
    }
    exports.ensureCanProcessFulFill = ensureCanProcessFulFill;
    function ensureCanReject(action) {
        return ensureNoRaise(action, () => false);
    }
    exports.ensureCanReject = ensureCanReject;
});
define("src/base/impl/request_plugins_impl", ["require", "exports", "console", "src/base/itf/plugin_chains_itf"], function (require, exports, console_1, plugin_chains_itf_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseClientServiceRequestPlugin = void 0;
    /**
     * {@inheritdoc BaseClientServicesPluginChains}
     * 所有 request chain 均繼承 {@link BaseClientServiceRequestPlugin} */
    class BaseClientServiceRequestPlugin extends plugin_chains_itf_1.BaseClientServicesPluginChains {
        constructor() {
            super();
            (0, console_1.assert)(() => this.assertCanAssemble() == undefined, ``);
        }
        /** resolve request 並且繼續下一個 request fulfill chain */
        resolve(configOrResponse) {
            return (0, plugin_chains_itf_1.processRequestFulFill)(configOrResponse, this.next);
        }
        /** resolve request 並結束整個 request chain */
        resolveAndIgnoreAll(configOrResponse) {
            return Promise.resolve(configOrResponse);
        }
        /** reject request 並且繼續下一個 request reject chain */
        reject(input) {
            return (0, plugin_chains_itf_1.processRequestReject)(input, this.next);
        }
        /** reject request 不執行於此後的 chain */
        rejectAndIgnoreAll(input) {
            return Promise.reject(input);
        }
        assertCanAssemble() {
            return "";
        }
        canGoNext(config) {
            return super.canGoNext(config);
        }
        /**
         * 決定是否能夠進行至 {@link processFulFill}
         * default: true */
        canProcessFulFill(config) {
            return super.canProcessFulFill(config);
        }
        /**
         * 決定是否能夠進行至 {@link processReject}
         * default: true */
        canProcessReject(error) {
            return super.canProcessReject(error);
        }
        /**
         * axios request interceptor onFulFill 時執行，
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processFulFill(config) {
            return (0, plugin_chains_itf_1.processRequestFulFill)(config, this.next);
        }
        /**
         * axios request interceptor onReject 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processReject(error) {
            return (0, plugin_chains_itf_1.processRequestReject)(error, this.next);
        }
    }
    exports.BaseClientServiceRequestPlugin = BaseClientServiceRequestPlugin;
});
define("src/base/itf/plugin_chains_itf", ["require", "exports", "src/setup/logger.setup", "src/utils/common_utils", "@gdknot/frontend_common"], function (require, exports, logger_setup_1, common_utils_1, frontend_common_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseClientServicesPluginChains = exports.processRequestReject = exports.processRequestFulFill = exports.processResponseReject = exports.processResponseFulFill = exports.ChainActionStage = void 0;
    const D = new frontend_common_2.Logger(logger_setup_1.LogModules.Plugin);
    const byPassAll = false;
    var ChainActionStage;
    (function (ChainActionStage) {
        ChainActionStage[ChainActionStage["processRequest"] = 0] = "processRequest";
        ChainActionStage[ChainActionStage["processResponse"] = 1] = "processResponse";
        ChainActionStage[ChainActionStage["rejectRequest"] = 2] = "rejectRequest";
        ChainActionStage[ChainActionStage["rejectResponse"] = 3] = "rejectResponse";
        ChainActionStage[ChainActionStage["canProcessRequest"] = 4] = "canProcessRequest";
        ChainActionStage[ChainActionStage["canProcessResponse"] = 5] = "canProcessResponse";
        ChainActionStage[ChainActionStage["canRejectRequest"] = 6] = "canRejectRequest";
        ChainActionStage[ChainActionStage["canRejectResponse"] = 7] = "canRejectResponse";
    })(ChainActionStage = exports.ChainActionStage || (exports.ChainActionStage = {}));
    var EMethod;
    (function (EMethod) {
        EMethod["processFulFill"] = "processFulFill";
        EMethod["canProcessFulFill"] = "canProcessFulFill";
        EMethod["processReject"] = "processReject";
        EMethod["canProcessReject"] = "canProcessReject";
    })(EMethod || (EMethod = {}));
    function isAxiosError(input) {
        return input.isAxiosError != undefined;
    }
    function isAxiosResponse(input) {
        return input.status != undefined;
    }
    function isAxiosConfig(input) {
        return !isAxiosError(input) && !isAxiosResponse(input);
    }
    function onStage(chain, input, method) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        chain.setStage(input, method);
        const ret = chain[method](input);
        switch (method) {
            case EMethod.processFulFill:
                (_b = (_a = chain)._onProcess) === null || _b === void 0 ? void 0 : _b.call(_a, input);
                break;
            case EMethod.canProcessFulFill:
                (_d = (_c = chain)._onCanProcess) === null || _d === void 0 ? void 0 : _d.call(_c, input);
                break;
            case EMethod.processReject:
                (_f = (_e = chain)._onProcessReject) === null || _f === void 0 ? void 0 : _f.call(_e, input);
                break;
            case EMethod.canProcessReject:
                (_h = (_g = chain)._onCanProcessReject) === null || _h === void 0 ? void 0 : _h.call(_g, input);
                break;
            default:
                break;
        }
        return ret;
    }
    //
    //    R E S P O N S E 
    //
    //
    function processResponseFulFill(response, chain) {
        if (!chain)
            return Promise.resolve(response); // 結束責任鍊
        if ((0, common_utils_1.ensureCanProcessFulFill)(() => onStage(chain, response, EMethod.canProcessFulFill))) {
            return onStage(chain, response, EMethod.processFulFill); // chain
        }
        else {
            if (chain.next && chain.canGoNext(response.config)) {
                return processResponseFulFill(response, chain.next); // next chain
            }
            return processResponseFulFill(response, undefined);
        }
    }
    exports.processResponseFulFill = processResponseFulFill;
    function processResponseReject(error, chain) {
        var _a, _b;
        if (!chain)
            return Promise.reject(error);
        if ((0, common_utils_1.ensureCanReject)(() => {
            var _a, _b;
            const canGo = onStage(chain, error, EMethod.canProcessReject);
            D.info([chain.constructor.name, "Response.canProcessReject", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers, , canGo]);
            return canGo;
        })) {
            D.info([chain.constructor.name, "Response.processReject", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers,]);
            return onStage(chain, error, EMethod.processReject);
            ;
        }
        else {
            if (chain.next && chain.canGoNext(error.config)) {
                return processResponseReject(error, chain.next);
            }
            return processResponseReject(error, undefined);
        }
    }
    exports.processResponseReject = processResponseReject;
    function onResponseFulFilled(chain) {
        return (response) => {
            var _a;
            D.current(["Start FulFull Response Chain", chain.constructor.name, (_a = response.config) === null || _a === void 0 ? void 0 : _a.url, "with response:\n", response.data]);
            if (byPassAll)
                return Promise.resolve(response);
            return processResponseFulFill(response, chain);
        };
    }
    function onResponseError(chain) {
        return (error) => {
            var _a;
            D.current(["Start Reject Response Chain", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url]);
            if (byPassAll)
                return Promise.reject(error.response);
            return processResponseReject(error, chain);
        };
    }
    //
    //
    //       R E Q U E S T
    //
    //
    //
    function processRequestFulFill(config, chain) {
        if (!chain)
            return config;
        if ((0, common_utils_1.ensureCanProcessFulFill)(() => {
            const canGo = onStage(chain, config, EMethod.canProcessFulFill);
            D.info([chain.constructor.name, "Request.canProcessFulFill", config.url, config.headers, canGo]);
            return canGo;
        })) {
            D.info([chain.constructor.name, "Request.processFulFill", config.url, config.headers,]);
            return onStage(chain, config, EMethod.processFulFill);
        }
        else {
            if (chain.next && chain.canGoNext(config))
                return processRequestFulFill(config, chain.next);
            return processRequestFulFill(config, undefined);
        }
    }
    exports.processRequestFulFill = processRequestFulFill;
    function processRequestReject(error, chain) {
        var _a, _b;
        if (!chain)
            return Promise.reject(error);
        if ((0, common_utils_1.ensureCanReject)(() => {
            var _a, _b;
            const canGo = onStage(chain, error, EMethod.canProcessReject);
            D.info([chain.constructor.name, "Request.canProcessReject", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers, canGo]);
            return canGo;
        })) {
            D.info([chain.constructor.name, "Request.processReject", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers]);
            return onStage(chain, error, EMethod.processReject);
        }
        else {
            if (chain.next && chain.canGoNext(error.config))
                return processRequestReject(error, chain.next);
            return processRequestReject(error, undefined);
        }
    }
    exports.processRequestReject = processRequestReject;
    function onRequestFulFilled(chain) {
        return (config) => {
            D.current(["Start FulFull Request Chain", chain.constructor.name, config === null || config === void 0 ? void 0 : config.url]);
            if (byPassAll)
                return config;
            return processRequestFulFill(config, chain);
        };
    }
    function onRequestError(chain) {
        return (error) => {
            var _a, _b;
            D.current(["Start Reject Request Chain", chain.constructor.name, (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = error.config) === null || _b === void 0 ? void 0 : _b.headers]);
            if (byPassAll)
                return Promise.reject(error.response);
            return processRequestReject(error, chain);
        };
    }
    // export abstract class PluginChainActionRegistry {
    //   abstract name: string;
    //   abstract requestAction: (request: AxiosRequestConfig)=> void;
    //   abstract requestAction: (request: AxiosRequestConfig)=> void;
    //   abstract requestAction: (request: AxiosRequestConfig)=> void;
    // }
    /**
     * {@inheritdoc BaseClientServicesPluginChains}
     * @typeParam INPUT -  process function 的輸入型別
     * @typeParam OUTPUT - process function 的輸出型別
     * @typeParam CLIENT - client 型別
     */
    class BaseClientServicesPluginChains {
        /** instal request/response responsibility chain
        * @see {@link BaseClient}
        * @example - 於 BaseClient 內部
        ```ts
           if (is.not.empty(requestChain)){
              BaseClientServicesPluginChains.install(requestChain, this, "request");
           }
           if (is.not.empty(responseChain)){
              BaseClientServicesPluginChains.install(responseChain, this, "response");
           }
        ```
        */
        static install(chain, client, interceptors) {
            (0, frontend_common_2.assert)(() => chain.length >= 1);
            const masterChain = chain[0];
            const tail = chain.slice(1);
            masterChain.init(client);
            if (tail.length >= 1) {
                masterChain.addAll(tail);
            }
            if (interceptors == "response") {
                client.axios.interceptors.response.use(onResponseFulFilled(masterChain), onResponseError(masterChain));
            }
            else {
                client.axios.interceptors.request.use(onRequestFulFilled(masterChain), onRequestError(masterChain));
            }
        }
        constructor() { }
        /** 增加下一個 chain */
        addNext(next) {
            (0, frontend_common_2.assert)(() => this.client != undefined, "undefined client");
            this.next = next;
            next.prev = this;
            next.init(this.client);
        }
        /** 增加上一個 chain */
        addPrev(prev) {
            (0, frontend_common_2.assert)(() => this.client != undefined, "undefined client");
            this.prev = prev;
            prev.next = this;
            prev.init(this.client);
        }
        addAll(_all) {
            (0, frontend_common_2.assert)(() => this.client != undefined, "undefined client");
            const allSerial = [this, ..._all];
            for (let i = 0; i < allSerial.length - 1; i++) {
                const next = allSerial[i + 1];
                if (next)
                    allSerial[i].addNext(next);
            }
        }
        /** default: true */
        canGoNext(config) {
            return this.next != undefined;
        }
        /** default: true */
        canProcessFulFill(config) {
            return true;
        }
        /** default: true */
        canProcessReject(error) {
            return true;
        }
        setStage(input, method) {
            switch (method) {
                case EMethod.processFulFill:
                    this.stage = isAxiosConfig(input)
                        ? ChainActionStage.processRequest
                        : ChainActionStage.processResponse;
                    break;
                case EMethod.canProcessFulFill:
                    this.stage = isAxiosConfig(input)
                        ? ChainActionStage.canProcessRequest
                        : ChainActionStage.canProcessResponse;
                    break;
                case EMethod.processReject:
                    this.stage = isAxiosConfig(input)
                        ? ChainActionStage.rejectRequest
                        : ChainActionStage.rejectResponse;
                    break;
                case EMethod.canProcessReject:
                    this.stage = isAxiosConfig(input)
                        ? ChainActionStage.canRejectRequest
                        : ChainActionStage.canRejectResponse;
                    break;
                default:
                    break;
            }
        }
        /** {@link AxiosResponse}|{@link AxiosError} 轉換為 {@link axiosConfig} */
        toAxiosConfig(input) {
            return isAxiosConfig(input)
                ? input
                : isAxiosError(input)
                    ? input.config
                    : isAxiosResponse(input)
                        ? input.config
                        : (function () { throw new Error(); })();
        }
        /**
         * 以當前的物件名稱及 {@link ChanActionStage} 註記於 {@link AxiosRequestConfig}.header
         * 中, 用於當 RequestChain / ResponseChain 轉發流程時，得以透過 header 得知該流程由哪裡轉發而來
         * @example
         * reject 當前 request, 並標記於 header 中, 好讓其他 chain 能夠知道這個 AxiosError
         * 是由哪一個 chain reject 而來
         * ```ts
          // RequestChain
          protected switchIntoRejectResponse(config: AxiosRequestConfig, ident:string){
            this.markDirty(config);
            const stage = this.stage!;
            const axiosError: AxiosError = {
              isAxiosError: false,
              toJSON: function (): object {
                return axiosError;
              },
              name: ident,
              message: ident,
              config
            };
            return Promise.reject(axiosError) as any;
          }
          // ResponseChain
          processReject(error: AxiosError<unknown, any>): Promise<AxiosResponse<any, any> | AxiosError<unknown, any>> {
            if (this.isDirtiedBy(error, ACAuthResponseGuard.name, ChainActionStage.processResponse)){
              console.log("processReject - requests from ACAuthGuard")
              return Promise.reject(error);
            }
            return this.reject(error);
          }
         *
         * ```
         * mark request header as dirty */
        markDirty(input) {
            const config = this.toAxiosConfig(input);
            const name = this.constructor.name;
            config.headers[`__chain_action_${name}__`] = this.stage;
            return config;
        }
        /** read request header to see if it's dirtied or not */
        isDirtiedBy(input, identity, stage) {
            const config = this.toAxiosConfig(input);
            const result = stage
                ? config.headers[`__chain_action_${identity}__`] == stage
                : config.headers[`__chain_action_${identity}__`] != undefined;
            return result;
        }
        onProcess(cb, terminateAfterCall = true) {
            this._onProcess = () => {
                cb();
                if (terminateAfterCall) {
                    this._onProcess = undefined;
                }
            };
        }
        onProcessReject(cb, terminateAfterCall = true) {
            this._onProcessReject = () => {
                cb();
                if (terminateAfterCall) {
                    this._onCanProcess = undefined;
                }
            };
        }
        onCanProcess(cb, terminateAfterCall = true) {
            this._onCanProcess = () => {
                cb();
                if (terminateAfterCall) {
                    this._onCanProcess = undefined;
                }
            };
        }
        onCanProcessReject(cb, terminateAfterCall = true) {
            this._onCanProcessReject = () => {
                cb();
                if (terminateAfterCall) {
                    this._onCanProcessReject = undefined;
                }
            };
        }
        init(client) {
            this.client = client;
        }
    }
    exports.BaseClientServicesPluginChains = BaseClientServicesPluginChains;
});
define("src/base/itf/client_itf", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBaseClient = exports.IBaseAuthClient = exports.IBaseClientProperties = exports.IBaseClientResponsibilityChain = exports.IBaseClientMethods = exports.EClientStage = void 0;
    //
    //
    //          T Y P E S
    //
    //
    /** 代表 client 當前的狀態表示, idle/fetching/authorizing*/
    var EClientStage;
    (function (EClientStage) {
        EClientStage["idle"] = "idle";
        EClientStage["fetching"] = "fetching";
        EClientStage["authorizing"] = "authorizing";
        EClientStage["authFetched"] = "authFetched";
        EClientStage["authUpdated"] = "authUpdated";
    })(EClientStage = exports.EClientStage || (exports.EClientStage = {}));
    //
    //
    //      B A S E     I N T E R F A C E S
    //
    //
    //
    class IBaseClientMethods {
    }
    exports.IBaseClientMethods = IBaseClientMethods;
    class IBaseClientResponsibilityChain {
    }
    exports.IBaseClientResponsibilityChain = IBaseClientResponsibilityChain;
    class IBaseClientProperties {
    }
    exports.IBaseClientProperties = IBaseClientProperties;
    //
    //
    //      C O M P O U N D        I N T E R F A C E S
    //
    //
    //
    //
    class IBaseAuthClient {
    }
    exports.IBaseAuthClient = IBaseAuthClient;
    /**  api client service
     * @typeParam DATA - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
     * @typeParam QUEUE - {@link QueueItem} 裡的 Meta 型別
     */
    class IBaseClient {
    }
    exports.IBaseClient = IBaseClient;
});
define("src/base/impl/base_request_guard", ["require", "exports", "src/base/impl/request_plugins_impl", "@gdknot/frontend_common", "src/setup/logger.setup"], function (require, exports, request_plugins_impl_1, frontend_common_3, logger_setup_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseRequestHeaderGuard = exports.BaseRequestGuard = void 0;
    const D = new frontend_common_3.Logger(logger_setup_2.LogModules.HeaderUpdater);
    /**
     * @typeParam RESPONSE - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
    */
    class BaseRequestGuard extends request_plugins_impl_1.BaseClientServiceRequestPlugin {
        constructor() {
            super();
            this._enabled = true;
        }
        enable() {
            this._enabled = true;
        }
        disable() {
            this._enabled = false;
        }
        canProcessFulFill(config) {
            if (!this._enabled)
                return false;
            return super.canProcessFulFill(config);
        }
        canProcessReject(error) {
            if (!this._enabled)
                return false;
            return super.canProcessReject(error);
        }
        /** reject request chain 中斷 request chain 進入 response chain 並標記 request header,
         * 這時流程會走到 onReject response chain
         * @example -
         * 替換 request
         ```ts
          // request chain - 流程會轉到 axios.interceptors.response.onReject
          processFulFill(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
            return this.switchIntoRejectResponse(config, BaseRequestReplacer.name);
          }
          // response chain
          processReject
      
         ```
         * */
        switchIntoRejectResponse(config) {
            this.markDirty(config);
            const ident = this.constructor.name;
            const stage = this.stage;
            const axiosError = {
                isAxiosError: false,
                toJSON: function () {
                    return axiosError;
                },
                name: ident,
                message: ident,
                config
            };
            return Promise.reject(axiosError);
        }
    }
    exports.BaseRequestGuard = BaseRequestGuard;
    /** 用來更新 AxiosRequestConfig
     * @typeParam RESPONSE - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
    */
    class BaseRequestHeaderGuard extends BaseRequestGuard {
        constructor() {
            super();
        }
        appendRequestHeader() {
            throw new frontend_common_3.NotImplementedError("getRequestHeader");
        }
        processFulFill(config) {
            const header = config.headers;
            const appendedHeader = this.appendRequestHeader();
            header.set(appendedHeader);
            D.info(["update header:", appendedHeader, "new header:", header]);
            return this.resolve(config);
        }
    }
    exports.BaseRequestHeaderGuard = BaseRequestHeaderGuard;
});
define("src/presets/request_header_updater", ["require", "exports", "src/base/impl/base_request_guard", "console"], function (require, exports, base_request_guard_1, console_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClientRequestExtraHeaderUpdater = exports.ClientRequestAuthHeaderUpdater = void 0;
    /** 自動將 axios request config 寫入正確的 authorization header
     * @example
     * ```ts
      const requestChain = [
          new UpdateAuthHeaderPlugin(()=>{
            return authorizationStore.token
          })
      ];
      ```
     */
    class ClientRequestAuthHeaderUpdater extends base_request_guard_1.BaseRequestHeaderGuard {
        constructor(
        /** 使用者自定義 AuthToken 參照*/
        tokenGetter) {
            super();
            this.tokenGetter = tokenGetter;
        }
        /**
         * 用來返回慾更新寫入 AxiosRequestConfig 的 header
         * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
         * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
        */
        appendRequestHeader() {
            (0, console_2.assert)(() => this.tokenGetter() != undefined, "unexpected tokenGetter returns");
            return {
                Authorization: this.tokenGetter(),
            };
        }
    }
    exports.ClientRequestAuthHeaderUpdater = ClientRequestAuthHeaderUpdater;
    class ClientRequestExtraHeaderUpdater extends base_request_guard_1.BaseRequestHeaderGuard {
        constructor(headerGetter) {
            super();
            this.headerGetter = headerGetter;
        }
        /**
         * 用來返回慾更新寫入 AxiosRequestConfig 的 header
         * @returns - 為 RawAxiosHeader, RawAxiosHeader 為 Record<string, string|number>,
         * 如要放複雜的物件得轉成 json, 並寫於 header 寫入 json 型別
        */
        appendRequestHeader() {
            return this.headerGetter();
        }
    }
    exports.ClientRequestExtraHeaderUpdater = ClientRequestExtraHeaderUpdater;
});
define("src/base/impl/base_auth_client", ["require", "exports", "tslib", "src/base/itf/client_itf", "src/base/itf/plugin_chains_itf", "axios", "@gdknot/frontend_common", "src/setup/logger.setup"], function (require, exports, tslib_1, client_itf_1, plugin_chains_itf_2, axios_1, frontend_common_4, logger_setup_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseAuthClient = void 0;
    axios_1 = tslib_1.__importDefault(axios_1);
    const D = new frontend_common_4.Logger(logger_setup_3.LogModules.Client);
    class BaseAuthClient {
        get callInterval() {
            return (new Date()).getTime() - this._lastT;
        }
        get canAuth() {
            return this.authCompleter == undefined
                && (this.hostClient.stage == client_itf_1.EClientStage.idle
                    || this.hostClient.stage == client_itf_1.EClientStage.fetching);
        }
        constructor(option, hostClient, markAuthorizing, markIdle, markFetched, markUpdated) {
            this.option = option;
            this.hostClient = hostClient;
            this.markAuthorizing = markAuthorizing;
            this.markIdle = markIdle;
            this.markFetched = markFetched;
            this.markUpdated = markUpdated;
            /** numbers of all authorization calls */
            this._totalAuthCounter = 0;
            /** numbers of all authorization calls in last second*/
            this.authCounter = 0;
            this._lastT = (new Date()).getTime();
            D.info(["AuthClient init"]);
            const { requestChain, responseChain, axiosConfig: config, interval } = option;
            const authDebounceImmediate = true;
            this.requestChain = requestChain;
            this.responseChain = responseChain;
            this.queue = new frontend_common_4.AsyncQueue();
            this.axios = axios_1.default.create(config);
            this.requester = async () => {
                try {
                    this.authCounter++;
                    if (!this.canAuth) {
                        D.info(["auth already called, wait for response, completer:", this.hostClient.stage, this.authCompleter]);
                        return this.authCompleter.future;
                    }
                    this.authCompleter = new frontend_common_4.Completer();
                    markAuthorizing();
                    const _inst = this.axios;
                    const { axiosConfig, payloadGetter, tokenGetter, tokenUpdater } = option;
                    const { url } = axiosConfig;
                    const axiosOption = {
                        method: "post",
                        url,
                        data: payloadGetter(),
                        headers: {
                            Authorization: tokenGetter()
                        }
                    };
                    if (payloadGetter())
                        axiosOption.data = payloadGetter();
                    D.current(["auth before fetch!", url]);
                    const response = await _inst(axiosOption);
                    D.current(["auth response!"]);
                    this.authCompleter.complete(response.data);
                    const completer = this.authCompleter;
                    this.resetCompleter(interval !== null && interval !== void 0 ? interval : 600);
                    return completer.future;
                }
                catch (err) {
                    console.error("Exception on auth request:", err);
                    this.authCompleter = undefined;
                    markIdle();
                    return Promise.reject(err);
                }
            };
            if (frontend_common_4.is.not.empty(requestChain)) {
                plugin_chains_itf_2.BaseClientServicesPluginChains.install(requestChain, this, "request");
            }
            if (frontend_common_4.is.not.empty(responseChain)) {
                plugin_chains_itf_2.BaseClientServicesPluginChains.install(responseChain, this, "response");
            }
            setInterval(() => {
                this.resetAuthCounter();
            }, 1000);
        }
        resetCompleter(interval) {
            this._lastT = (new Date()).getTime();
            clearTimeout(this.authCompleterTimeout);
            this.authCompleterTimeout = setTimeout(() => {
                this.authCompleter = undefined;
            }, interval);
        }
        resetAuthCounter(idleTime = 2000) {
            this._totalAuthCounter += this.authCounter;
            this.authCounter = 0;
        }
    }
    exports.BaseAuthClient = BaseAuthClient;
});
define("src/base/impl/base_client_impl", ["require", "exports", "tslib", "src/base/itf/client_itf", "src/base/itf/plugin_chains_itf", "axios", "@gdknot/frontend_common", "src/setup/logger.setup", "src/base/impl/base_auth_client"], function (require, exports, tslib_2, client_itf_2, plugin_chains_itf_3, axios_2, frontend_common_5, logger_setup_4, base_auth_client_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseClient = exports.DEFAULT_AUTH_CLIENT_OPTION = void 0;
    axios_2 = tslib_2.__importDefault(axios_2);
    const D = new frontend_common_5.Logger(logger_setup_4.LogModules.Client);
    exports.DEFAULT_AUTH_CLIENT_OPTION = {
        interval: 600,
        payloadGetter: (() => { }),
        tokenGetter: (() => ""),
        tokenUpdater: ((response) => { }),
        redirect: ((response) => {
            return { clearQueue: true };
        }),
    };
    /** {@inheritdoc IClientService}
    *
    * @typeParam DATA - response 型別
    * @typeParam ERROR - error 型別
    * @typeParam SUCCESS - success 型別
    */
    class BaseClient {
        /** stage {@link EClientStage} */
        get _stage() {
            return this.__stage;
        }
        ;
        /** stage {@link EClientStage} */
        set _stage(_) {
            var _a, _b, _c, _d, _e, _f;
            if (this.__stage != _) {
                switch (_) {
                    case client_itf_2.EClientStage.authorizing:
                        console.log("call authorizing:", this._onAuthorizing);
                        (_a = this._onAuthorizing) === null || _a === void 0 ? void 0 : _a.call(this, this.__stage);
                        break;
                    case client_itf_2.EClientStage.fetching:
                        (_b = this._onFetching) === null || _b === void 0 ? void 0 : _b.call(this, this.__stage);
                        break;
                    case client_itf_2.EClientStage.idle:
                        (_c = this._onIdle) === null || _c === void 0 ? void 0 : _c.call(this, this.__stage);
                        break;
                    case client_itf_2.EClientStage.authFetched:
                        (_d = this._onAuthFetched) === null || _d === void 0 ? void 0 : _d.call(this, this.__stage);
                        break;
                    case client_itf_2.EClientStage.authUpdated:
                        (_e = this._onAuthUpdated) === null || _e === void 0 ? void 0 : _e.call(this, this.__stage);
                        break;
                }
            }
            D.info(["set stage:", _.toString(), this.__stage.toString()]);
            this.__stage = _;
            (_f = this._onStageChanged) === null || _f === void 0 ? void 0 : _f.call(this, this.stage);
        }
        get stage() {
            return this._stage;
        }
        ;
        constructor(option) {
            var _a;
            this.option = option;
            /** stage {@link EClientStage} */
            this.__stage = client_itf_2.EClientStage.idle;
            const { requestChain, responseChain, axiosConfig: config, isErrorResponse, isDataResponse, isSuccessResponse } = option;
            this.isErrorResponse = isErrorResponse;
            this.isDataResponse = isDataResponse;
            this.isSuccessResponse = isSuccessResponse;
            const authDebounceImmediate = true;
            this.requestChain = requestChain;
            this.responseChain = responseChain;
            this.axios = axios_2.default.create(config);
            this._stage = client_itf_2.EClientStage.idle;
            this.queue = new frontend_common_5.AsyncQueue();
            if (option.authOption) {
                option.authOption = Object.freeze(Object.assign({
                    ...exports.DEFAULT_AUTH_CLIENT_OPTION,
                }, (_a = option.authOption) !== null && _a !== void 0 ? _a : {}));
                this.authClient = new base_auth_client_1.BaseAuthClient(option.authOption, this, () => this._stage = client_itf_2.EClientStage.authorizing, () => this._stage = client_itf_2.EClientStage.idle, () => this._stage = client_itf_2.EClientStage.authFetched, () => this._stage = client_itf_2.EClientStage.authUpdated);
            }
            if (frontend_common_5.is.not.empty(requestChain)) {
                plugin_chains_itf_3.BaseClientServicesPluginChains.install(requestChain, this, "request");
            }
            if (frontend_common_5.is.not.empty(responseChain)) {
                plugin_chains_itf_3.BaseClientServicesPluginChains.install(responseChain, this, "response");
            }
        }
        // fixme: 由 queue 真的實作，由 queue中檢查，而不是設值
        /** 設置 client 當前 stage */
        setStage(stage) {
            switch (stage) {
                case client_itf_2.EClientStage.authUpdated:
                case client_itf_2.EClientStage.authFetched:
                case client_itf_2.EClientStage.authorizing:
                    this._stage = stage;
                    break;
                case client_itf_2.EClientStage.fetching:
                    if (this.stage == client_itf_2.EClientStage.authorizing || this.stage == client_itf_2.EClientStage.authFetched) {
                        return;
                    }
                    this._stage = stage;
                    break;
                case client_itf_2.EClientStage.idle:
                    if (this.stage == client_itf_2.EClientStage.authorizing || this.stage == client_itf_2.EClientStage.authFetched) {
                        return;
                    }
                    this._stage = stage;
                    break;
            }
        }
        onStageChanged(cb, wipeAfterCall = false) {
            this._onStageChanged = wipeAfterCall
                ? () => { cb(this.stage); this._onStageChanged = undefined; }
                : cb;
        }
        onIdle(cb, wipeAfterCall = false) {
            this._onIdle = wipeAfterCall
                ? (prev) => { cb(prev); this._onIdle = undefined; }
                : cb;
        }
        onFetching(cb, wipeAfterCall = false) {
            this._onFetching = wipeAfterCall
                ? () => { cb(); this._onFetching = undefined; }
                : cb;
        }
        onAuthorizing(cb, wipeAfterCall = false) {
            this._onAuthorizing = wipeAfterCall
                ? (prev) => { cb(prev); this._onAuthorizing = undefined; }
                : cb;
        }
        onAuthFetched(cb, wipeAfterCall = false) {
            this._onAuthFetched = wipeAfterCall
                ? (prev) => { cb(prev); this._onAuthFetched = undefined; }
                : cb;
        }
        onAuthUpdated(cb, wipeAfterCall = false) {
            this._onAuthUpdated = wipeAfterCall
                ? (prev) => { cb(prev); this._onAuthUpdated = undefined; }
                : cb;
        }
        async _request(method, url, data, headers, responseTransformer, config) {
            var _a, _b, _c, _d;
            try {
                const option = method == "get"
                    ? Object.freeze({ method, url, params: data, headers })
                    : Object.freeze({ method, url, data, headers });
                responseTransformer !== null && responseTransformer !== void 0 ? responseTransformer : (responseTransformer = (res) => {
                    return res.data;
                });
                D.info(["_request, before fetch", option]);
                this.setStage(client_itf_2.EClientStage.fetching);
                const res = await this.axios(option);
                const isValidAxiosResponse = res.data != undefined;
                isValidAxiosResponse
                    ? D.info(["_request, after fetch, with response", option])
                    : D.info(["_request, after fetch, no data response", option]);
                this.setStage(client_itf_2.EClientStage.idle);
                return responseTransformer(res);
            }
            catch (e) {
                this.setStage(client_itf_2.EClientStage.idle);
                if (e == undefined) {
                    console.error(`Network Error: url - ${url}, method - ${method}`);
                    const code = undefined;
                    throw new axios_2.default.AxiosError("Network Error", code, config);
                }
                else if (e.isAxiosError) {
                    const error = e;
                    const msg = {
                        message: error.message,
                        response: error.response,
                        requestConfig: {
                            method: (_a = error.config) === null || _a === void 0 ? void 0 : _a.method,
                            url: (_b = error.config) === null || _b === void 0 ? void 0 : _b.url,
                            params: (_c = error.config) === null || _c === void 0 ? void 0 : _c.params,
                            data: (_d = error.config) === null || _d === void 0 ? void 0 : _d.data
                        },
                    };
                    throw new Error(`[AxiosError]: ${JSON.stringify(msg)}`);
                }
                throw new Error(`${e}`);
            }
        }
        async requestByConfig(config) {
            const { method, url, data, headers } = config;
            D.info(["requestByConfig", url, data]);
            return this._request(method, url, Object.freeze(data), headers !== null && headers !== void 0 ? headers : {}, (response) => {
                return response;
            }, config);
        }
        async get(url, payload) {
            return this._request("get", url, Object.freeze(payload));
        }
        async post(url, payload) {
            return this._request("post", url, Object.freeze(payload));
        }
        async postForm(url, formData) {
            return this._request("post", url, Object.freeze(formData), {
                "Content-Type": "multipart/form-data"
            });
        }
        async auth() {
            (0, frontend_common_5.assert)(() => this.authClient != undefined && this.authClient.requester != undefined, "axios client for authorization not initialized properly");
            return this.authClient.requester().then((_) => {
                D.info(["auth response:", _]);
                return _;
            });
        }
        async put(url, payload) {
            return this._request("put", url, Object.freeze(payload));
        }
        async del(url, payload) {
            return this._request("delete", url, Object.freeze(payload));
        }
    }
    exports.BaseClient = BaseClient;
});
define("src/base/impl/response_plugins_impl", ["require", "exports", "@gdknot/frontend_common", "src/base/itf/plugin_chains_itf"], function (require, exports, frontend_common_6, plugin_chains_itf_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseClientServiceResponsePlugin = void 0;
    /** 所有 response chain 均繼承 {@link BaseClientServiceResponsePlugin} */
    class BaseClientServiceResponsePlugin extends plugin_chains_itf_4.BaseClientServicesPluginChains {
        constructor() {
            super();
            (0, frontend_common_6.assert)(() => this.assertCanAssemble() == undefined, ``);
        }
        /** resolve response 並且繼續下一個 response fulfill chain */
        resolve(configOrResponse) {
            return (0, plugin_chains_itf_4.processResponseFulFill)(configOrResponse, this.next);
        }
        /** resolve response 不執行於此後的 chain */
        resolveAndIgnoreAll(configOrResponse) {
            return Promise.resolve(configOrResponse);
        }
        /** reject response 並且繼續下一個 response reject chain */
        reject(input) {
            return (0, plugin_chains_itf_4.processResponseReject)(input, this.next);
        }
        /** reject response 不執行於此後的 chain */
        rejectAndIgnoreAll(input) {
            return Promise.reject(input);
        }
        // todo: -------- 
        assertCanAssemble() {
            return undefined;
        }
        /**
         * 決定是否能夠進行 next chain
         * @returns - default: true */
        canGoNext(config) {
            return super.canGoNext(config);
        }
        /**
         * 決定是否能夠進行至 {@link processFulFill}
         * @returns - default: true */
        canProcessFulFill(response) {
            return super.canProcessFulFill(response);
        }
        /**
         * 決定是否能夠進行至 {@link processReject}
         * @returns - default: true */
        canProcessReject(error) {
            return super.canProcessReject(error);
        }
        /**
         * axios response interceptor onFulFill 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processFulFill(response) {
            return (0, plugin_chains_itf_4.processResponseFulFill)(response, this.next);
        }
        /**
         * axios response interceptor onReject 時執行,
         * 覆寫請記得 call super，不然 responsibility chain 不會繼續
         * - call super: 繼續 responsibility chain
         * - 不 call super: 中斷 responsibility chain
         * - 若 Promise.reject, axios返回錯
         * - 若 Promise.resolve, axios不返回錯
         */
        processReject(error) {
            return (0, plugin_chains_itf_4.processResponseReject)(error, this.next);
        }
    }
    exports.BaseClientServiceResponsePlugin = BaseClientServiceResponsePlugin;
});
define("src/base/impl/base_auth_response_guard", ["require", "exports", "tslib", "src/setup/logger.setup", "src/utils/common_utils", "@gdknot/frontend_common", "axios", "src/base/impl/response_plugins_impl"], function (require, exports, tslib_3, logger_setup_5, common_utils_2, frontend_common_7, axios_3, response_plugins_impl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseAuthResponseGuard = void 0;
    axios_3 = tslib_3.__importDefault(axios_3);
    const D = new frontend_common_7.Logger(logger_setup_5.LogModules.AuthGuard);
    /**
     * {@inheritdoc BaseClientServiceResponsePlugin}
     * 用來處理當 request 發出後出現 401/Unauthorized error，處理流程為
     * - {@link canProcessReject} > {@link processReject}
     *    - {@link onRestoreRequest}
     *    - {@link onRequestNewAuth}
     *        - {@link onAuthError}
     *        - {@link onAuthSuccess}
     *        - {@link onAuthUncaughtError}
    */
    class BaseAuthResponseGuard extends response_plugins_impl_1.BaseClientServiceResponsePlugin {
        constructor() {
            super();
        }
        /** ### 用來生成代替 unauthorized error 的空請求
         * 當 unauthorized error 後，auth token 換發前，會生成一個空的 Promise 請求，
         * 以代替原請求因 unauthorized error 所產生的錯誤，{@link BaseAuthResponseGuard} 會先
         * 返回這個空的 Promise 好讓原 axios 的請求持續等待。
         * @param error - {@link AxiosError}
         * @returns - {@link Completer<any, QueueItem>}
         */
        onRestoreRequest(error) {
            var _a, _b;
            const requestConfig = error.config;
            const timeout = (_a = this.client.axios.defaults.timeout) !== null && _a !== void 0 ? _a : 10 * 1000;
            const id = error.config.url;
            //console.log("onRestoreRequest:", error.config);
            const completer = (_b = this.client) === null || _b === void 0 ? void 0 : _b.queue.enqueue(id, () => {
                return (0, common_utils_2.wait)(timeout);
            });
            const item = completer._meta;
            item.meta = { requestConfig };
            return completer;
        }
        /** ### 用來定義當 unauthorized error 後，auth token 換發時的主要邏輯, 預設為 this.client.auth()
         * @param error - {@link AxiosError}
         * @param pendingRequest - 由{@link onRestoreRequest} 所生成的 pendingRequest，
         * 其內容為一個永不 resolve 的 Promise 物件，直到 auth token 重新換發後再次重新送出原請求，才
         * 會更新 pendingRequest 的內容，在這之前 pendingRequest 的 Promise 物件會一直保持 pending，
         * 除非 timeout
         */
        onRequestNewAuth(error) {
            return this.client.auth();
        }
        /**
        * @extendSummary - 用來處理當特定 response error 下，保流原請求後，進行 token 換發，流程為：
        * - {@link onRestoreRequest} 保留請請
        * - {@link onRequestNewAuth} 換發 auth token
        *     - {@link onAuthError} 當 auth token 換發失败
        *     - {@link onAuthSuccess} 當 auth token 換發成功
        *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
        */
        async reject(input) {
            var _a, _b;
            try {
                const error = input;
                const pending = this.onRestoreRequest(error);
                D.info(["onRestoreRequest A", (_a = error.config) === null || _a === void 0 ? void 0 : _a.url, (_b = this.client) === null || _b === void 0 ? void 0 : _b.queue.queue.length]);
                const authResponse = await this.onRequestNewAuth(error);
                return pending.future;
            }
            catch (e) {
                throw e;
            }
        }
        rejectAndIgnoreAll(input) {
            return super.rejectAndIgnoreAll(input);
        }
        /** @returns - false */
        canProcessFulFill(config) {
            return false;
        }
        //
        //
        //    R E J E C T
        //
        //
        /**
         * @extendSummary -
         * 當 error.response?.status == axios.HttpStatusCode.Unauthorized
         * 時可進行至 processReject 處理
         */
        canProcessReject(error) {
            var _a;
            return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) == axios_3.default.HttpStatusCode.Unauthorized;
        }
        /**
        * @extendSummary - 用來處理 unauthorized error 下，保流原請求後，進行 token 換發，流程為：
        * - {@link onRestoreRequest} 保留請請
        * - {@link onRequestNewAuth} 換發 auth token
        *     - {@link onAuthError} 當 auth token 換發失败
        *     - {@link onAuthSuccess} 當 auth token 換發成功
        *     - {@link onAuthUncaughtError} 當 auth token 換發錯誤
        */
        async processReject(error) {
            throw new frontend_common_7.NotImplementedError();
        }
    }
    exports.BaseAuthResponseGuard = BaseAuthResponseGuard;
});
define("src/base/impl/base_request_replacer", ["require", "exports", "src/base/itf/client_itf", "@gdknot/frontend_common", "src/base/impl/base_request_guard", "src/setup/logger.setup"], function (require, exports, client_itf_3, frontend_common_8, base_request_guard_2, logger_setup_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseRequestReplacer = void 0;
    const D = new frontend_common_8.Logger(logger_setup_6.LogModules.RequestReplacer);
    /**
     * {@inheritdoc BaseRequestGuard}
     *
     * 使用情境如，當第一個 request 出現 Unauthorized 錯誤時，
     * 後續所有的 request 在第一個 request 重新換發 token 並返回正確的 request 前, 都
     * 需要等待，這時就需要直接取代 request, 讓它保持 pending 待第一個 request 換發成功
     * 後再行處理，流程為
     * - request
     *    {@link canProcessFulFill} > {@link processFulFill}
     * - response
     *    {@link canProcessReject} > {@link processReject}
     *
     * @typeParam RESPONSE - response 型別
     * @typeParam ERROR - error 型別
     * @typeParam SUCCESS - success 型別
     */
    class BaseRequestReplacer extends base_request_guard_2.BaseRequestGuard {
        /**
         * 當 {@link canProcessFulFill} 為 true 則可以進行 {@link processFulFill}，這裡
         * {@link canProcessFulFill} 只處理當 client 狀態為 {@link EClientStage.authorizing} 時，
         * 代表client正處於換發 authorization token， 這時應處理所有進來的 request, 替代成 pending
         * @returns -
         * ```ts
         * this.client!.stage == EClientStage.authorizing
         * ```
         * */
        canProcessFulFill(config) {
            return this.client.stage == client_itf_3.EClientStage.authorizing;
        }
        /**
         * @extendSummary -
         * 當{@link canProcessFulFill}成立，強制將 request raise exception, 好進行至
         * reject進行攔截
         * */
        processFulFill(config) {
            return this.switchIntoRejectResponse(config);
        }
        /** false */
        canProcessReject(error) {
            return false;
        }
    }
    exports.BaseRequestReplacer = BaseRequestReplacer;
});
define("src/presets/network_error_response_guard", ["require", "exports", "src/base/impl/response_plugins_impl"], function (require, exports, response_plugins_impl_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NetworkErrorResponseGuard = void 0;
    /**
     * {@inheritdoc BaseClientServiceResponsePlugin}
     * 用來攔截 Network Error
     * */
    class NetworkErrorResponseGuard extends response_plugins_impl_2.BaseClientServiceResponsePlugin {
        constructor(networkErrorHandler) {
            super();
            this.networkErrorHandler = networkErrorHandler;
        }
        canProcessFulFill(config) {
            return false;
        }
        /**
         * @extendSummary -
         * 這裡只查找 error.message.toLowerCase() == "network error" 者, 若成立則 {@link processReject}
         */
        canProcessReject(error) {
            try {
                return error.message.toLowerCase() == "network error";
            }
            catch (e) {
                console.error("Exception on canProcessReject, error:", error);
                return false;
            }
        }
        /**
         * @extendSummary -
         * 執行 {@link networkErrorHandler} 並繼續 responsibility chain
         */
        processReject(error) {
            this.networkErrorHandler(error);
            return this.reject(error);
            return super.processReject(error);
        }
    }
    exports.NetworkErrorResponseGuard = NetworkErrorResponseGuard;
});
define("src/base/impl/base_auth_client_response_guard", ["require", "exports", "@gdknot/frontend_common", "src/base/itf/client_itf", "src/base/impl/response_plugins_impl"], function (require, exports, frontend_common_9, client_itf_4, response_plugins_impl_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthClientStageMarker = exports.AuthClientResponseGuard = void 0;
    class AuthClientResponseGuard extends response_plugins_impl_3.BaseClientServiceResponsePlugin {
        get isAuthorizing() {
            return this.client.hostClient.stage == client_itf_4.EClientStage.authorizing;
        }
        get isFetched() {
            return this.client.hostClient.stage == client_itf_4.EClientStage.authFetched;
        }
        get isUpdated() {
            return this.client.hostClient.stage == client_itf_4.EClientStage.authUpdated;
        }
        get hasQueue() {
            return !this.client.hostClient.queue.isEmpty;
        }
        get host() {
            return this.client.hostClient;
        }
        get queue() {
            return this.client.hostClient.queue;
        }
        constructor() {
            super();
        }
    }
    exports.AuthClientResponseGuard = AuthClientResponseGuard;
    class AuthClientStageMarker extends AuthClientResponseGuard {
        canProcessFulFill(config) {
            return false;
        }
        canProcessReject(error) {
            return false;
        }
        processFulFill(response) {
            throw new frontend_common_9.UnExpectedError("");
        }
        processReject(error) {
            throw new frontend_common_9.UnExpectedError("");
        }
    }
    exports.AuthClientStageMarker = AuthClientStageMarker;
});
define("src/presets/auth_client_guards", ["require", "exports", "tslib", "@gdknot/frontend_common", "axios", "src/base/impl/base_auth_client_response_guard", "src/setup/logger.setup"], function (require, exports, tslib_4, frontend_common_10, axios_4, base_auth_client_response_guard_1, logger_setup_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACIdleMarker = exports.ACFetchedMarker = exports.ACTokenUpdater = exports.ACAuthResponseGuard = void 0;
    axios_4 = tslib_4.__importDefault(axios_4);
    const D = new frontend_common_10.Logger(logger_setup_7.LogModules.AuthClient);
    /** 處理以下請況
     *
     * 1) 用來處理當非AuthClient 送出的請求於遠端返回 unauthorized error
     * (response error) 發生後 AuthResponseGuard 會將原請求放到駐列中，並透過
     * AuthClient 發出換發 token 請求, AuthClient interceptor 透過讀取當
     * auth token 成功換發且更新後，若駐列中有未完成的請求，則 ACAuthResponseGuard
     * 會負責將這些請求重新送出
     *
     * 2) 當 AuthClient 換發 token 失敗
     **/
    class ACAuthResponseGuard extends base_auth_client_response_guard_1.AuthClientResponseGuard {
        /** ### 用來處理當 unauthorized error 後 auth token 換發成功
         * @param errorResponseBeforeReAuth - auth token 換發「前」失敗的 response
         * @param queueItem - 於 {@link onBeforeRequestNewAuth} 所生成的新 Promise 請求，用來代替 ReAuth 前的失敗請求
         */
        onAuthSuccess(response) {
            D.info(["onAuthSuccess, pending queues:", this.queue.queue.length]);
            for (let index = 0; index < this.queue.queue.length; index++) {
                const completer = this.queue.queue[index];
                const id = completer._meta.id;
                const config = this.markDirty(completer._meta.meta.requestConfig);
                this.host.requestByConfig(config).then((_) => {
                    this.queue.dequeueByResult({ id, result: _ });
                    D.info(["dequeueByResult, id:", id, "result:", _]);
                }).catch(async (e) => {
                    if (completer.isRejected) {
                        this.queue.dequeueByResult({ id: completer._meta.id, result: {} });
                        return completer.future;
                    }
                    completer.reject(e);
                    this.queue.dequeueByResult({ id: completer._meta.id, result: {} });
                    return e;
                });
            }
            return response;
        }
        /** ### 用來處理當 unauthorized error 後 auth token 可預期下的換發失敗
         * @param authFailedResponse - auth token 換發前失敗的 response
         * @returns - {@link AxiosResponse}
         */
        onAuthError(authFailedResponse) {
            var _a, _b, _c, _d;
            D.info(["onAuthError"]);
            if (this.host.option.authOption) {
                const action = (_c = (_b = (_a = this.host.option.authOption).redirect) === null || _b === void 0 ? void 0 : _b.call(_a, authFailedResponse)) !== null && _c !== void 0 ? _c : {
                    clearQueue: true,
                };
                if (action.clearQueue)
                    (_d = this.client) === null || _d === void 0 ? void 0 : _d.queue.clearQueue();
            }
        }
        onAuthUncaughtError(error) {
        }
        /**
         * 當 response 處於, 代表我們可以使用最新的 auth token 重新送出並清空 request queue 的的請求
         * 1) auth token updated 2) request queue 有東西
         */
        canProcessFulFill(response) {
            return (this.isUpdated) && this.hasQueue;
        }
        processFulFill(response) {
            return this.resolve(this.onAuthSuccess(response));
        }
        canProcessReject(error) {
            return true;
        }
        processReject(error) {
            if (this.host.isErrorResponse(error.response)) {
                this.onAuthError(error.response);
            }
            else {
                this.onAuthUncaughtError(error);
            }
            return this.reject(error);
        }
    }
    exports.ACAuthResponseGuard = ACAuthResponseGuard;
    /** markIdle */
    class ACTokenUpdater extends base_auth_client_response_guard_1.AuthClientResponseGuard {
        canProcessFulFill(response) {
            D.info(["ACTokenUpdater.canProcessFulFill, response:", response]);
            return this.host.isDataResponse(response)
                && (response.status == axios_4.default.HttpStatusCode.Ok);
        }
        processFulFill(response) {
            var _a, _b, _c, _d;
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.option.tokenUpdater(response);
            D.current(["ACTokenUpdater:", response.data, (_b = this.client) === null || _b === void 0 ? void 0 : _b.option.tokenGetter()]);
            if (((_c = this.client) === null || _c === void 0 ? void 0 : _c.option.tokenGetter()) == undefined) {
                throw new Error("Unexpected tokenGetter/tokenUpdater");
            }
            (_d = this.client) === null || _d === void 0 ? void 0 : _d.markUpdated();
            return this.resolve(response);
        }
        canProcessReject(error) {
            return false;
        }
    }
    exports.ACTokenUpdater = ACTokenUpdater;
    /** 用來標定目前的 auth client stage 處於 auth token fetched 階段
     * @see {@link EClientStage}
    */
    class ACFetchedMarker extends base_auth_client_response_guard_1.AuthClientStageMarker {
        canProcessFulFill(config) {
            this.client.markFetched();
            return super.canProcessFulFill(config);
        }
        canProcessReject(error) {
            this.client.markFetched();
            return super.canProcessReject(error);
        }
    }
    exports.ACFetchedMarker = ACFetchedMarker;
    /** 用來標定目前的 auth client stage 處於 idle 階段
     * @see {@link EClientStage}
    */ class ACIdleMarker extends base_auth_client_response_guard_1.AuthClientStageMarker {
        canProcessFulFill(config) {
            this.client.markIdle();
            return super.canProcessFulFill(config);
        }
        canProcessReject(error) {
            this.client.markIdle();
            return super.canProcessReject(error);
        }
    }
    exports.ACIdleMarker = ACIdleMarker;
});
define("src/presets/request_replacer", ["require", "exports", "src/base/impl/base_request_replacer"], function (require, exports, base_request_replacer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestReplacer = void 0;
    /**
     * {@inheritdoc BaseRequestReplacer}
     * 用來取代當前的 request, @see {@link BaseRequestReplacer}
     * 使用者可以延申擴展成不同的 RequestReplacer，需覆寫
     * {@link canProcessFulFill} / {@link newRequest}
     * */
    class RequestReplacer extends base_request_replacer_1.BaseRequestReplacer {
    }
    exports.RequestReplacer = RequestReplacer;
});
define("__tests__/__mocks__/axios", ["require", "exports", "tslib", "axios", "merge-anything", "@gdknot/frontend_common"], function (require, exports, tslib_5, axios_5, merge_anything_1, frontend_common_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mostRecentAxiosInstanceSatisfying = exports.clearMockAxios = exports.getMockAxiosInstances = exports.mockAdapter = exports.mockServer = exports.UnauthorizedResponseError = exports.AuthTokenMissingError = exports.AuthTokenExpiredError = exports.EServerResponse = exports._EErrorCode = exports.authToken = void 0;
    axios_5 = tslib_5.__importDefault(axios_5);
    exports.authToken = { value: "I'M Auth Token" };
    var _EErrorCode;
    (function (_EErrorCode) {
        _EErrorCode[_EErrorCode["ACCESS_TOKEN_MISSING"] = 3101] = "ACCESS_TOKEN_MISSING";
        _EErrorCode[_EErrorCode["ACCESS_TOKEN_EXPIRED"] = 3102] = "ACCESS_TOKEN_EXPIRED";
        // followings are not for guarantee
        _EErrorCode[_EErrorCode["PAYLOAD_MISSING_KEY"] = 2102] = "PAYLOAD_MISSING_KEY";
        _EErrorCode[_EErrorCode["INVALID_PERMISSION"] = 3002] = "INVALID_PERMISSION";
        _EErrorCode[_EErrorCode["USER_IS_BLOCK"] = 205] = "USER_IS_BLOCK";
        _EErrorCode[_EErrorCode["USER_NOT_VERIFY"] = 206] = "USER_NOT_VERIFY";
    })(_EErrorCode = exports._EErrorCode || (exports._EErrorCode = {}));
    var EServerResponse;
    (function (EServerResponse) {
        EServerResponse[EServerResponse["resolved"] = 0] = "resolved";
        EServerResponse[EServerResponse["reject"] = 1] = "reject";
    })(EServerResponse = exports.EServerResponse || (exports.EServerResponse = {}));
    exports.AuthTokenExpiredError = {
        error_key: "ACCESS_TOKEN_EXPIRED",
        error_code: _EErrorCode.ACCESS_TOKEN_EXPIRED.toString(),
        error_msg: "ACCESS_TOKEN_EXPIRED",
        message: "ACCESS_TOKEN_EXPIRED"
    };
    exports.AuthTokenMissingError = {
        message: "ACCESS_TOKEN_MISSING",
        error_msg: "ACCESS_TOKEN_MISSING",
        error_code: _EErrorCode.ACCESS_TOKEN_MISSING.toString(),
        error_key: "ACCESS_TOKEN_MISSING",
    };
    exports.UnauthorizedResponseError = {
        message: "Unauthorized",
        error_msg: "Unauthorized",
        error_code: axios_5.default.HttpStatusCode.Unauthorized.toString(),
        error_key: "Unauthorized",
    };
    class IMockedServer {
    }
    class MockedServer {
        constructor(validToken) {
            this.validToken = validToken;
            this.registry = {};
            this.defaultResponse = {
                data: {},
                status: axios_5.default.HttpStatusCode.Ok,
                statusText: "",
                headers: {},
                useValidator: true,
            };
            this.setHeaderValidator((config) => {
                try {
                    const token = config.headers.get("Authorization");
                    const authorized = token == validToken;
                    console.log("MockServer - authorized?:", authorized, config.url, token, validToken);
                    // 無錯誤
                    if (authorized)
                        return null;
                    const name = "Unauthorized";
                    const message = name;
                    const statusText = name;
                    const response = {
                        data: exports.UnauthorizedResponseError,
                        status: axios_5.default.HttpStatusCode.Unauthorized,
                        statusText,
                        headers: {},
                        config,
                    };
                    const request = undefined;
                    console.log("MockServer - return unauthorized error", config.url);
                    return new axios_5.default.AxiosError(name, undefined, config, request, response);
                }
                catch (e) {
                    console.error("setAuthHeaderGuard failed, config:", config, "error:", e);
                    throw e;
                }
            });
        }
        setHeaderValidator(validator) {
            this.headerValidator = validator;
        }
        registerResponse(url, responseCB, useValidator = true, status = axios_5.default.HttpStatusCode.Ok) {
            (0, frontend_common_11.assert)(() => typeof responseCB == "function", "invalid type");
            this.registry[url] = (0, merge_anything_1.merge)(this.defaultResponse, {
                data: responseCB,
                useValidator,
                status
            });
            (0, frontend_common_11.assert)(() => typeof this.registry[url].data == "function", "invalid type");
            console.log("MockServer - register response, url:", url, "content:", this.registry[url]);
        }
        async getResponse(config) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            console.log("MockServer -  getResponse", config.url);
            const url = config.url;
            const header = config.headers;
            const registered = this.registry[url];
            const { status: registeredStatus } = registered;
            const promiseData = ((_a = registered === null || registered === void 0 ? void 0 : registered.data) !== null && _a !== void 0 ? _a : (() => { }))();
            const responseWithoutData = {
                ...this.defaultResponse,
                config,
                status: registeredStatus
            };
            const useValidator = (_c = (_b = this.registry[url]) === null || _b === void 0 ? void 0 : _b.useValidator) !== null && _c !== void 0 ? _c : true;
            if (this.registry[url]) {
                console.log("MockServer - found registered result on url", useValidator, url);
            }
            if (useValidator) {
                if (!this.headerValidator) {
                    console.log("MockServer - no header validator - resolve response:", url);
                    responseWithoutData.data = await promiseData;
                    const response = responseWithoutData;
                    if (registeredStatus == axios_5.default.HttpStatusCode.Ok) {
                        (_d = this._onStage) === null || _d === void 0 ? void 0 : _d.call(this, EServerResponse.resolved, response);
                        return Promise.resolve(response);
                    }
                    else {
                        (_e = this._onStage) === null || _e === void 0 ? void 0 : _e.call(this, EServerResponse.reject, response);
                        return Promise.reject(response);
                    }
                }
                else {
                    const errorResponse = this.headerValidator(config);
                    const isHeaderValid = errorResponse == undefined;
                    if (isHeaderValid) {
                        responseWithoutData.data = await promiseData;
                        const response = responseWithoutData;
                        console.log("MockServer - valid header - ", url, "response:", response, "this.registry[url]:", this.registry);
                        (_f = this._onStage) === null || _f === void 0 ? void 0 : _f.call(this, EServerResponse.resolved, response);
                        return Promise.resolve(response);
                    }
                    else {
                        console.log("MockServer - invalid header - ", url);
                        (_g = this._onStage) === null || _g === void 0 ? void 0 : _g.call(this, EServerResponse.reject, errorResponse);
                        return Promise.reject(errorResponse);
                    }
                }
            }
            else {
                console.log("MockServer - no validator", url);
                responseWithoutData.data = await promiseData;
                const response = responseWithoutData;
                if (registeredStatus == axios_5.default.HttpStatusCode.Ok) {
                    (_h = this._onStage) === null || _h === void 0 ? void 0 : _h.call(this, EServerResponse.resolved, response);
                    return Promise.resolve(response);
                }
                else {
                    (_j = this._onStage) === null || _j === void 0 ? void 0 : _j.call(this, EServerResponse.reject, response);
                    return Promise.reject(response);
                }
            }
        }
        onResponse(cb) {
            this._onStage = (stage, data) => {
                const remove = cb(stage, data);
                if (remove) {
                    this._onStage = undefined;
                }
                return remove;
            };
        }
        clear() {
            this.registry = {};
        }
    }
    function getMockedAdapter(mockServer) {
        const mockAdapter = jest.fn(async (config) => {
            var _a;
            config.headers.set("User-Agent", "axios/" + "1.2.1", false);
            console.log("Adapter - before mockServer.getResponse, url", config.url);
            const response = await mockServer.getResponse(config);
            config.data = response;
            console.log("Adapter - return response", {
                config: {
                    headers: (_a = response.config) === null || _a === void 0 ? void 0 : _a.headers
                },
                data: response.data,
                headers: response.headers,
            });
            return response;
        });
        mockAdapter.__name__ = "mockAdapter";
        return mockAdapter;
    }
    function mockAxiosCreate(mockAxios, mockServer, mockAdapter) {
        const origCreate = jest.spyOn(axios_5.default, "create");
        let instances = [];
        mockAxios.create = ((config) => {
            config.adapter = mockAdapter;
            const _origInst = origCreate(config);
            const _origRequest = _origInst.request.bind(_origInst);
            (0, frontend_common_11.assert)(() => _origInst != undefined);
            const inst = jest.mocked(_origInst);
            jest.spyOn(inst, "get");
            jest.spyOn(inst, "put");
            jest.spyOn(inst, "delete");
            jest.spyOn(inst, "post");
            jest.spyOn(inst, "request");
            (0, frontend_common_11.assert)(() => inst != undefined);
            (0, frontend_common_11.assert)(() => inst.get.mock != undefined);
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
            getMockAxiosInstances,
            mostRecentAxiosInstanceSatisfying,
            clearMockAxios,
        };
    }
    const mockAxios = jest.createMockFromModule("axios");
    exports.mockServer = new MockedServer(exports.authToken.value);
    exports.mockAdapter = getMockedAdapter(exports.mockServer);
    const util = mockAxiosCreate(mockAxios, exports.mockServer, exports.mockAdapter);
    exports.getMockAxiosInstances = util.getMockAxiosInstances, exports.clearMockAxios = util.clearMockAxios, exports.mostRecentAxiosInstanceSatisfying = util.mostRecentAxiosInstanceSatisfying;
    exports.default = mockAxios;
});
define("__tests__/helpers/chain.test.helper", ["require", "exports", "src/base/itf/plugin_chains_itf"], function (require, exports, plugin_chains_itf_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.expectedChainFlow = void 0;
    const S = (s) => JSON.stringify(s);
    function lStrip(data, matcher, index = 0) {
        let lbound = 0;
        for (let idx = 0; idx < data.length; idx++) {
            const record = data[idx];
            if (matcher(record, idx)) {
                lbound = idx;
                return data.slice(lbound, data.length - 1);
            }
        }
        return [];
    }
    function rStrip(data, matcher, index = 0) {
        let rbound = data.length - 1;
        for (let idx = data.length - 1; idx <= 0; idx--) {
            const record = data[idx];
            if (matcher(record, index)) {
                rbound = idx;
                return data.slice(0, rbound);
            }
        }
        return [];
    }
    exports.expectedChainFlow = {
        partial_acRedirectUnAuth(authUrl, initialAuthToken, errorData) {
            initialAuthToken = initialAuthToken
                ? `,"Authorization":"${initialAuthToken}"`
                : "";
            return [
                {
                    name: `ACFetchedMarker.canProcessReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
                    output: `false`,
                    stage: `authFetched`
                },
                {
                    name: `ACTokenUpdater.canProcessReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
                    output: `false`,
                    stage: `authFetched`
                },
                {
                    name: `ACAuthResponseGuard.canProcessReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
                    output: `true`,
                    stage: `authFetched`
                },
                {
                    name: `ACIdleMarker.canProcessReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
                    output: `false`,
                    stage: `idle`
                },
                {
                    name: `ACAuthResponseGuard.processReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/x-www-form-urlencoded"${initialAuthToken},"User-Agent":"axios/1.2.1"},"method":"post","url":"${authUrl}","data":${S(errorData)},"errorMessage":"${errorData.message}"}`,
                    output: `{}`,
                    stage: `idle`
                }
            ];
        },
        partial_acUnauthorized(authUrl, initialAuthToken, authFailedErr) {
            return [
                {
                    name: `ACFetchedMarker.canProcessReject`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
                    output: `false`,
                    stage: `authFetched`
                },
                {
                    name: `ACTokenUpdater.canProcessReject`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
                    output: `false`,
                    stage: `authFetched`
                },
                {
                    name: `ACAuthResponseGuard.canProcessReject`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":${S(authFailedErr)}}`,
                    output: `true`,
                    stage: `authFetched`
                }
            ];
        },
        partial_acAuth(authUrl, authToken, hasQueuedItem = false) {
            const processFulFillOfAcResponseGuardOrNot = hasQueuedItem
                ? [{
                        name: `ACAuthResponseGuard.processFulFill`,
                        input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                        output: `{}`,
                        stage: `idle`
                    }]
                : [];
            return [
                {
                    name: `ACFetchedMarker.canProcessFulFill`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                    output: `false`,
                    stage: `authFetched`
                },
                {
                    name: `ACTokenUpdater.canProcessFulFill`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                    output: `true`,
                    stage: `authFetched`
                },
                {
                    name: `ACAuthResponseGuard.canProcessFulFill`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                    output: `${hasQueuedItem}`,
                    stage: `authUpdated`
                },
                {
                    name: `ACIdleMarker.canProcessFulFill`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                    output: `false`,
                    stage: `idle`
                },
                ...processFulFillOfAcResponseGuardOrNot,
                {
                    name: `ACTokenUpdater.processFulFill`,
                    input: `{"headers":{},"method":"post","url":"${authUrl}","data":{"token":"${authToken}"}}`,
                    output: `{}`,
                    stage: `idle`
                }
            ];
        },
        partial_redirectedAuthorizedGet(data, authToken, initialToken, getUrl) {
            return [
                {
                    name: `ClientRequestAuthHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${initialToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    output: `true`,
                    stage: `idle`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    output: `true`,
                    stage: `idle`
                },
                {
                    name: `RequestReplacer.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    output: `false`,
                    stage: `idle`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    stage: `idle`
                },
                {
                    name: `ClientRequestAuthHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock","User-Agent":"axios/1.2.1","__chain_action_ACAuthResponseGuard__":"${plugin_chains_itf_5.ChainActionStage.processResponse}"}}`,
                    stage: `idle`
                },
                {
                    name: `AuthResponseGuard.canProcessFulFill`,
                    input: `{"headers":{},"method":"get","url":"${getUrl}","data":${S(data)}}`,
                    output: `false`,
                    stage: `idle`
                },
                {
                    name: `NetworkErrorResponseGuard.canProcessFulFill`,
                    input: `{"headers":{},"method":"get","url":"${getUrl}","data":${S(data)}}`,
                    output: `false`,
                    stage: `idle`
                }
            ];
        },
        partial_authorizedGet(data, authToken, getUrl) {
            return [
                {
                    name: `ClientRequestAuthHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*"}}`,
                    output: `true`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}"}}`,
                    output: `true`,
                    stage: `fetching`
                },
                {
                    name: `RequestReplacer.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
                    output: `false`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestAuthHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*","Authorization":"${authToken}","format":"mock"}}`,
                    stage: `fetching`
                },
                {
                    name: `AuthResponseGuard.canProcessFulFill`,
                    input: `{"headers":{},"method":"get","url":"${getUrl}","data":${data}}`,
                    output: `false`,
                    stage: `fetching`
                },
                {
                    name: `NetworkErrorResponseGuard.canProcessFulFill`,
                    input: `{"headers":{},"method":"get","url":"${getUrl}","data":${data}}`,
                    output: `false`,
                    stage: `fetching`
                }
            ];
        },
        partial_UnAuthorizedGet(unauthorizedErr, getUrl, initialAuthToken) {
            initialAuthToken = initialAuthToken ? `"Authorization":"${initialAuthToken}"` : "";
            return [
                {
                    name: `ClientRequestAuthHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*"}}`,
                    output: `true`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken}}}`,
                    output: `true`,
                    stage: `fetching`
                },
                {
                    name: `RequestReplacer.canProcessFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
                    output: `false`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestExtraHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
                    stage: `fetching`
                },
                {
                    name: `ClientRequestAuthHeaderUpdater.processFulFill`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
                    output: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock"}}`,
                    stage: `fetching`
                },
                {
                    name: `AuthResponseGuard.canProcessReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock","User-Agent":"axios/1.2.1"},"method":"get","url":"${getUrl}","data":${S(unauthorizedErr)},"errorMessage":"${unauthorizedErr.message}"}`,
                    output: `true`,
                    stage: `fetching`
                },
                {
                    name: `AuthResponseGuard.processReject`,
                    input: `{"headers":{"Accept":"application/json, text/plain, */*",${initialAuthToken},"format":"mock","User-Agent":"axios/1.2.1"},"method":"get","url":"${getUrl}","data":${S(unauthorizedErr)},"errorMessage":"${unauthorizedErr.message}"}`,
                    output: `{}`,
                    stage: `authorizing`
                },
            ];
        },
        simpleAuth(authUrl, authToken) {
            return this.partial_acAuth(authUrl, authToken);
        },
        simpleAuthorizedGet(authToken, data, getUrl) {
            return this.partial_authorizedGet(data, authToken, getUrl);
        },
        simpleUnAuthorizedGet(unauthorizedErr, authErr, getUrl, authUrl, initialAuthToken) {
            return [
                ...this.partial_UnAuthorizedGet(unauthorizedErr, getUrl, initialAuthToken),
                ...this.partial_acUnauthorized(authUrl, initialAuthToken, authErr),
            ];
        },
        simpleUnauthorizedGetTurningIntoAuthorized(authToken, initialAuthToken, authUrl, data, errorData, getUrl) {
            const hasQueuedRequest = true;
            return [
                ...this.partial_UnAuthorizedGet(errorData, getUrl, initialAuthToken),
                ...this.partial_acAuth(authUrl, authToken, hasQueuedRequest),
                ...this.partial_redirectedAuthorizedGet(data, authToken, initialAuthToken, getUrl)
            ];
        },
        partial_unAuthorizedGet: () => []
    };
});
define("__tests__/helpers/axo.test.helper", ["require", "exports", "src/presets/auth_response_guard", "src/presets/request_header_updater", "__tests__/setup/client.test.setup", "__tests__/__mocks__/axios", "@gdknot/frontend_common", "src/presets/network_error_response_guard", "src/presets/auth_client_guards", "src/index", "src/setup/logger.setup", "__tests__/helpers/chain.test.helper"], function (require, exports, auth_response_guard_1, request_header_updater_1, client_test_setup_1, axios_6, frontend_common_12, network_error_response_guard_1, auth_client_guards_1, index_1, logger_setup_8, chain_test_helper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AxiosTestHelper = exports.wrapImplementation = exports.wait = exports.env = exports.ResponseScenario = exports.RequestAuthRejectStage = exports.RequestScenario = exports.ChainCondition = void 0;
    const D = new frontend_common_12.Logger(logger_setup_8.LogModules.Test);
    var ChainKind;
    (function (ChainKind) {
        ChainKind["ClientRequestChain"] = "ClientRequestChain";
        ChainKind["ClientResponseChain"] = "ClientResponseChain";
        ChainKind["ACRequestChain"] = "ACRequestChain";
        ChainKind["ACResponseChain"] = "ACResponseChain";
        ChainKind["ACFetchedMarker"] = "ACFetchedMarker";
        ChainKind["ACTokenUpdater"] = "ACTokenUpdater";
        ChainKind["ACAuthResponseGuard"] = "ACAuthResponseGuard";
        ChainKind["ACIdleMarker"] = "ACIdleMarker";
        ChainKind["AuthResponseGuard"] = "AuthResponseGuard";
        ChainKind["NetworkErrorResponseGuard"] = "NetworkErrorResponseGuard";
        ChainKind["ClientRequestExtraHeaderUpdater"] = "ClientRequestExtraHeaderUpdater";
        ChainKind["ClientRequestAuthHeaderUpdater"] = "ClientRequestAuthHeaderUpdater";
        ChainKind["RequestReplacer"] = "RequestReplacer";
    })(ChainKind || (ChainKind = {}));
    var ChainCondition;
    (function (ChainCondition) {
        ChainCondition[ChainCondition["untouchedAll"] = 0] = "untouchedAll";
        ChainCondition[ChainCondition["processUntouched"] = 1] = "processUntouched";
        ChainCondition[ChainCondition["rejectUntouched"] = 2] = "rejectUntouched";
        ChainCondition[ChainCondition["processOnly"] = 3] = "processOnly";
        ChainCondition[ChainCondition["bypassProcess"] = 4] = "bypassProcess";
        ChainCondition[ChainCondition["rejectOnly"] = 5] = "rejectOnly";
        ChainCondition[ChainCondition["bypassReject"] = 6] = "bypassReject";
        ChainCondition[ChainCondition["processAndReject"] = 7] = "processAndReject";
        ChainCondition[ChainCondition["bypassProcessAndReject"] = 8] = "bypassProcessAndReject";
    })(ChainCondition = exports.ChainCondition || (exports.ChainCondition = {}));
    var RequestScenario;
    (function (RequestScenario) {
        RequestScenario[RequestScenario["unauthorizeRequest"] = 0] = "unauthorizeRequest";
        RequestScenario[RequestScenario["unauthorizeRequestTurningIntoAuthorizedByChain"] = 1] = "unauthorizeRequestTurningIntoAuthorizedByChain";
        RequestScenario[RequestScenario["pendingIntoQueue"] = 2] = "pendingIntoQueue";
        RequestScenario[RequestScenario["pendingByDebounce"] = 3] = "pendingByDebounce";
    })(RequestScenario = exports.RequestScenario || (exports.RequestScenario = {}));
    var RequestAuthRejectStage;
    (function (RequestAuthRejectStage) {
        RequestAuthRejectStage["sendingOrigRequest"] = "sendingOrigRequest";
        RequestAuthRejectStage["origRequestBeingRejected"] = "origRequestBeingRejected";
        RequestAuthRejectStage["rejectedRequestPendingInQueue"] = "rejectedRequestPendingInQueue";
        RequestAuthRejectStage["sendingReAuthRequestOnAuthGuard"] = "sendingReAuthRequestOnAuthGuard";
        RequestAuthRejectStage["reAuthRequestFetched"] = "reAuthRequestFetched";
        RequestAuthRejectStage["newAuthTokenBeingUpdated"] = "newAuthTokenBeingUpdated";
        RequestAuthRejectStage["newAuthSuccessfullyFetchedMarkIdle"] = "newAuthMarkIdle";
        RequestAuthRejectStage["origPendingRequestBeingResponse"] = "origPendingRequestBeingResponse";
    })(RequestAuthRejectStage = exports.RequestAuthRejectStage || (exports.RequestAuthRejectStage = {}));
    var ResponseScenario;
    (function (ResponseScenario) {
        ResponseScenario[ResponseScenario["unauthorizedResponse"] = 0] = "unauthorizedResponse";
        ResponseScenario[ResponseScenario["unauthorizedResponseTurningIntoAuthorizedByChain"] = 1] = "unauthorizedResponseTurningIntoAuthorizedByChain";
    })(ResponseScenario = exports.ResponseScenario || (exports.ResponseScenario = {}));
    exports.env = "production";
    function wait(span) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, span);
        });
    }
    exports.wait = wait;
    function getMaybes(_input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (typeof _input == "boolean") {
            return _input;
        }
        const mayBeConfig = (_a = _input.config) !== null && _a !== void 0 ? _a : (_b = _input.response) === null || _b === void 0 ? void 0 : _b.config;
        const mayBeHeaders = (_e = (_c = _input.headers) !== null && _c !== void 0 ? _c : (_d = _input.config) === null || _d === void 0 ? void 0 : _d.headers) !== null && _e !== void 0 ? _e : mayBeConfig === null || mayBeConfig === void 0 ? void 0 : mayBeConfig.headers;
        const mayBeData = (_m = (_k = (_h = (_g = (_f = _input.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.data) !== null && _h !== void 0 ? _h : (_j = _input.data) === null || _j === void 0 ? void 0 : _j.data) !== null && _k !== void 0 ? _k : (_l = _input.response) === null || _l === void 0 ? void 0 : _l.data) !== null && _m !== void 0 ? _m : _input.data;
        const errorMessage = _input.message;
        return (0, frontend_common_12.Obj)({
            headers: mayBeHeaders,
            method: mayBeConfig === null || mayBeConfig === void 0 ? void 0 : mayBeConfig.method,
            url: mayBeConfig === null || mayBeConfig === void 0 ? void 0 : mayBeConfig.url,
            data: mayBeData,
            errorMessage: errorMessage,
        }).omitBy((key, val) => val == undefined);
    }
    const S = (s) => JSON.stringify(s);
    function wrapImplementation(helper, inst, propName, newImpl, stage) {
        const origImplementation = inst[propName].bind(inst);
        inst[propName] = (() => { });
        jest.spyOn(inst, propName).mockImplementation((...args) => {
            try {
                const output = origImplementation(...args);
                const stage = helper.client.stage;
                helper.chainTestStacks.push({
                    name: `${inst.constructor.name}.${propName.toString()}`,
                    input: S(getMaybes(args[0])),
                    output: S(getMaybes(output)),
                    stage,
                });
                return newImpl(output, ...args);
            }
            catch (e) {
                console.warn("Exception on wrapImplementation, propName", propName, "inst.name:", inst.constructor.name, e);
                throw e;
            }
        });
    }
    exports.wrapImplementation = wrapImplementation;
    function wrapGuardImpl(helper, plugin) {
        if (plugin) {
            const stage = helper.client.stage;
            wrapImplementation(helper, plugin, "processFulFill", (origImplResult, config) => {
                // console.log(plugin.constructor.name,   "process:", origImplResult);
                return origImplResult;
            }, stage);
            wrapImplementation(helper, plugin, "canProcessFulFill", (origImplResult, config) => {
                // console.log(plugin.constructor.name, " canProcess:", origImplResult);
                return origImplResult;
            }, stage);
            wrapImplementation(helper, plugin, "processReject", (origImplResult, error) => {
                // console.log(plugin.constructor.name, " processError:", origImplResult);
                return origImplResult;
            }, stage);
            wrapImplementation(helper, plugin, "canProcessReject", (origImplResult, error) => {
                // console.log(plugin.constructor.name, " canProcessError:", origImplResult);
                return origImplResult;
            }, stage);
        }
    }
    class AxiosTestHelper {
        constructor(client, authToken) {
            this.client = client;
            this.authToken = authToken;
            this.chainTestStacks = [];
            this.acCalls = {
                acFetcher: false,
                acToken: false,
                acAuth: false,
                acIdle: false,
            };
            jest.spyOn(client, "get");
            jest.spyOn(client, "put");
            jest.spyOn(client, "post");
            client.requestChain.forEach((guard) => {
                wrapGuardImpl(this, guard);
            });
            client.responseChain.forEach((guard) => {
                wrapGuardImpl(this, guard);
            });
            client.authClient.requestChain.forEach((guard) => {
                wrapGuardImpl(this, guard);
            });
            client.authClient.responseChain.forEach((guard) => {
                wrapGuardImpl(this, guard);
            });
        }
        get authGuard() {
            return (0, frontend_common_12.Arr)(this.client.responseChain).firstWhere((_) => _.constructor.name == auth_response_guard_1.AuthResponseGuard.name);
        }
        get networkErrorGuard() {
            return (0, frontend_common_12.Arr)(this.client.responseChain).firstWhere((_) => _.constructor.name == network_error_response_guard_1.NetworkErrorResponseGuard.name);
        }
        get authHeaderUpdater() {
            return (0, frontend_common_12.Arr)(this.client.requestChain).firstWhere((_) => _.constructor.name == request_header_updater_1.ClientRequestAuthHeaderUpdater.name);
        }
        get extraHeaderUpdater() {
            return (0, frontend_common_12.Arr)(this.client.requestChain).firstWhere((_) => _.constructor.name == request_header_updater_1.ClientRequestExtraHeaderUpdater.name);
        }
        get requestReplacer() {
            return (0, frontend_common_12.Arr)(this.client.requestChain).firstWhere((_) => _.constructor.name == index_1.RequestReplacer.name);
        }
        //
        get acAuthGuard() {
            return (0, frontend_common_12.Arr)(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == auth_client_guards_1.ACAuthResponseGuard.name);
        }
        get acFetchedMarker() {
            return (0, frontend_common_12.Arr)(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == auth_client_guards_1.ACFetchedMarker.name);
        }
        get acTokenUpdater() {
            return (0, frontend_common_12.Arr)(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == auth_client_guards_1.ACTokenUpdater.name);
        }
        get acIdleMarker() {
            return (0, frontend_common_12.Arr)(this.client.authClient.responseChain).firstWhere((_) => _.constructor.name == auth_client_guards_1.ACIdleMarker.name);
        }
        get(url, payload, result) {
            const _url = new URL(url, "http://localhost");
            _url.search = new URLSearchParams(payload).toString();
            axios_6.mockServer.registerResponse(url, result);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            return this.client.get(url, payload);
        }
        auth(result, useValidator = false) {
            const url = this.client.option.authOption.axiosConfig.url;
            const _rawUrl = new URL(url, "http://localhost");
            _rawUrl.search = new URLSearchParams(this.client.option.authOption.payloadGetter()).toString();
            axios_6.mockServer.registerResponse(url, result, useValidator);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            return this.client.auth();
        }
        put(url, data, result) {
            const _url = new URL(url, "http://localhost");
            _url.search = new URLSearchParams(data).toString();
            axios_6.mockServer.registerResponse(url, result);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            return this.client.put(url, data);
        }
        post(url, data, result) {
            const _url = new URL(url, "http://localhost");
            _url.search = new URLSearchParams(data).toString();
            axios_6.mockServer.registerResponse(url, result);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            return this.client.post(url, data);
        }
        del(url, data, result) {
            const _url = new URL(url, "http://localhost");
            _url.search = new URLSearchParams(data).toString();
            axios_6.mockServer.registerResponse(url, result);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            return this.client.del(url, data);
        }
        async expectUnauthorized(url, payload, mockReturns, expectedFetched) {
            axios_6.authToken.value = "hot!!";
            axios_6.mockServer.registerResponse(this.client.option.authOption.axiosConfig.url, () => Promise.resolve({
                data: {
                    token: this.authToken,
                },
            }), false);
            expect(axios_6.mockServer.registry[url]).not.toBeUndefined();
            const fetched = await this.get(url, payload, () => {
                return mockReturns;
            });
            expect(axios_6.mockAdapter, "Adapter should be called").toBeCalled();
            const authHeader = {
                Authorization: axios_6.authToken.value,
            };
            const lastVal = await (0, frontend_common_12.Arr)(axios_6.mockAdapter.mock.results).last
                .value;
            const headerInConfig = lastVal.config.headers;
            const tokenInHeader = lastVal.config.headers.Authorization;
            expect(tokenInHeader == axios_6.authToken.value, `tokenInHeader:${tokenInHeader} != ${axios_6.authToken.value}`).toBeTruthy();
            // expect(this.client.isErrorResponse(fetched)).toBeTruthy();
            // expect((fetched as ErrorResponse).message).toBe("Unauthorized");
            // expect((lastVal.headers as any).format).toEqual(formatHeader.value.format);
            expect(headerInConfig.Authorization, "header in config not updated properly").toEqual(authHeader.Authorization);
            expect(this.authGuard.canProcessReject, "expect canProcessReject called").toBeCalled();
            expect(this.authGuard.canProcessFulFill, "expect canProcessFulFill called").toBeCalled();
            return Promise.resolve({});
        }
        async expectGetPassed(url, payload, mockReturns, expectedFetched) {
            const fetched = await this.get(url, payload, mockReturns);
            expect(axios_6.mockAdapter).toBeCalled();
            const authHeader = {
                Authorization: axios_6.authToken.value,
            };
            const lastVal = await (0, frontend_common_12.Arr)(axios_6.mockAdapter.mock.results).last
                .value;
            const headerInConfig = lastVal.config.headers;
            const tokenInHeader = lastVal.config.headers.Authorization;
            expect(tokenInHeader == axios_6.authToken.value, `tokenInHeader:${tokenInHeader} != ${axios_6.authToken.value}`).toBeTruthy();
            expect(fetched).toEqual(expectedFetched);
            expect(headerInConfig.format).toEqual(client_test_setup_1.formatHeader.value.format);
            expect(headerInConfig.Authorization).toEqual(authHeader.Authorization);
            return fetched;
        }
        get unAuthorizedResponse() {
            return axios_6.UnauthorizedResponseError;
        }
        spyOnAllGuards() {
            jest.spyOn(this.authGuard, "onRestoreRequest");
            jest.spyOn(this.authGuard, "onRequestNewAuth");
            jest.spyOn(this.acAuthGuard, "onAuthSuccess");
            jest.spyOn(this.acAuthGuard, "onAuthError");
        }
        expectRequestReject_OnServerPerspective() {
            axios_6.mockServer.onResponse((stage, data) => {
                expect(stage).toBe(axios_6.EServerResponse.reject);
                expect(data.message).toBe(this.unAuthorizedResponse.message);
                expect(this.extraHeaderUpdater.canProcessFulFill).toBeCalled();
                expect(this.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
                expect(this.authHeaderUpdater.canProcessFulFill).toBeCalled();
                expect(this.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
                expect(this.requestReplacer.canProcessFulFill).toBeCalled();
                expect(this.requestReplacer.canProcessFulFill).toReturnWith(false);
                console.log("end of first time reject from server");
                return true;
            });
        }
        expectACAuthChainNotStartedYet() {
            expect(this.acAuthGuard.canProcessFulFill).not.toBeCalled();
            expect(this.acFetchedMarker.canProcessFulFill).not.toBeCalled();
            expect(this.acIdleMarker.canProcessFulFill).not.toBeCalled();
            expect(this.acTokenUpdater.canProcessFulFill).not.toBeCalled();
        }
        expectRequestRestored_andAuthRequestBeingSend_onAuthGuard() {
            this.expectRequestReject_OnChainPerspectiveByCondition({
                chain: this.authGuard,
                condition: ChainCondition.processUntouched,
            });
            // original request being rejected hence calling client.auth()
            this.expectRequestReject_OnChainPerspectiveByCondition({
                chain: this.authGuard,
                condition: ChainCondition.rejectOnly,
            });
            expect(this.authGuard.onRestoreRequest).toBeCalled();
            expect(this.authGuard.onRequestNewAuth).toBeCalled();
        }
        expectReAuthSuccess_OnACAuthGuard() {
            this.expectRequestReject_OnChainPerspectiveByCondition({
                chain: this.acAuthGuard,
                condition: ChainCondition.processOnly,
            });
            expect(this.acAuthGuard.onAuthSuccess).toBeCalled();
            expect(this.acAuthGuard.onAuthError).not.toBeCalled();
            this.expectRequestReject_OnChainPerspectiveByCondition({
                chain: this.acIdleMarker,
                condition: ChainCondition.bypassProcess,
            });
        }
        expectAuthRequestNotYetCall() {
            expect(this.acTokenUpdater.canProcessFulFill).not.toBeCalled();
            expect(this.acAuthGuard.canProcessFulFill).not.toBeCalled();
            expect(this.acFetchedMarker.canProcessFulFill).not.toBeCalled();
            expect(this.acIdleMarker.canProcessFulFill).not.toBeCalled();
        }
        expectRequestReject_OnChainPerspectiveByCondition(option, internalCall = false) {
            const { condition, chain } = option;
            const selfCall = this.expectRequestReject_OnChainPerspectiveByCondition.bind(this);
            switch (condition) {
                case ChainCondition.processUntouched:
                    expect(chain.processFulFill).not.toBeCalled();
                    expect(chain.canProcessFulFill).not.toBeCalled();
                    break;
                case ChainCondition.rejectUntouched:
                    expect(chain.processReject).not.toBeCalled();
                    expect(chain.canProcessReject).not.toBeCalled();
                    break;
                case ChainCondition.untouchedAll:
                    selfCall({ ...option, condition: ChainCondition.rejectUntouched });
                    selfCall({ ...option, condition: ChainCondition.processUntouched });
                    break;
                case ChainCondition.bypassProcessAndReject:
                    selfCall({ ...option, condition: ChainCondition.bypassProcess });
                    selfCall({ ...option, condition: ChainCondition.bypassReject });
                    break;
                case ChainCondition.processOnly:
                    expect(chain.canProcessFulFill).toBeCalled();
                    expect(chain.processFulFill).toBeCalled();
                    break;
                case ChainCondition.bypassProcess:
                    expect(chain.canProcessFulFill).toBeCalled();
                    expect(chain.processFulFill).not.toBeCalled();
                    break;
                case ChainCondition.rejectOnly:
                    expect(chain.canProcessReject).toBeCalled();
                    expect(chain.processReject).toBeCalled();
                    break;
                case ChainCondition.bypassReject:
                    expect(chain.canProcessReject).toBeCalled();
                    expect(chain.processReject).not.toBeCalled();
                    break;
                case ChainCondition.processAndReject:
                    selfCall({ ...option, condition: ChainCondition.processOnly });
                    selfCall({ ...option, condition: ChainCondition.rejectOnly });
                    break;
                default:
                    break;
            }
        }
        expectAcResponseCalled(option) {
            const acCalls = { ...this.acCalls };
            this.acFetchedMarker.onCanProcess(() => {
                acCalls.acFetcher = true;
            });
            this.acTokenUpdater.onCanProcess(() => {
                acCalls.acToken = true;
            });
            this.acAuthGuard.onCanProcess(() => {
                acCalls.acAuth = true;
            });
            this.acIdleMarker.onCanProcess(() => {
                acCalls.acIdle = true;
            });
            expect(acCalls.acFetcher).toBe(option.acFetcher);
            expect(acCalls.acToken).toBe(option.acToken);
            expect(acCalls.acAuth).toBe(option.acAuth);
            expect(acCalls.acIdle).toBe(option.acIdle);
        }
        expectRequestReject_OnAdapterPerspective() {
            expect(axios_6.mockAdapter).toBeCalled();
            (0, frontend_common_12.Arr)(axios_6.mockAdapter.mock.results)
                .last.value.then((_) => {
                D.info(["\n\nmockAdapter resolve:", _]);
            })
                .catch((e) => {
                D.info(["\n\nmockAdapter reject:", e]);
                expect(e.response.data, "expect throw Unauthorized error").toEqual(this.unAuthorizedResponse);
            });
        }
        onExpectServer(stage) {
            const self = this;
            switch (stage) {
                case axios_6.EServerResponse.resolved:
                    axios_6.mockServer.onResponse((stage, data) => {
                        expect(stage).toBe(axios_6.EServerResponse.resolved);
                        expect(self.extraHeaderUpdater.canProcessFulFill).toBeCalled();
                        expect(self.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
                        expect(self.authHeaderUpdater.canProcessFulFill).toBeCalled();
                        expect(self.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
                        expect(self.requestReplacer.canProcessFulFill).toBeCalled();
                        expect(self.requestReplacer.canProcessFulFill).toReturnWith(false);
                        console.log("end of first time reject from server");
                        return true;
                    });
                    break;
                case axios_6.EServerResponse.reject:
                    axios_6.mockServer.onResponse((stage, data) => {
                        expect(stage).toBe(axios_6.EServerResponse.reject);
                        expect(data.message).toBe(this.unAuthorizedResponse.message);
                        expect(self.extraHeaderUpdater.canProcessFulFill).toBeCalled();
                        expect(self.extraHeaderUpdater.canProcessFulFill).toReturnWith(true);
                        expect(self.authHeaderUpdater.canProcessFulFill).toBeCalled();
                        expect(self.authHeaderUpdater.canProcessFulFill).toReturnWith(true);
                        expect(self.requestReplacer.canProcessFulFill).toBeCalled();
                        expect(self.requestReplacer.canProcessFulFill).toReturnWith(false);
                        console.log("end of first time reject from server");
                        return true;
                    });
                    break;
                default:
                    break;
            }
        }
        async expectStage_OnChainPerspective(stage) {
            const helper = this;
            const terminate = true;
            D.current([stage]);
            switch (stage) {
                case RequestAuthRejectStage.sendingOrigRequest:
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.authHeaderUpdater,
                        condition: ChainCondition.processOnly,
                    });
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.extraHeaderUpdater,
                        condition: ChainCondition.processOnly,
                    });
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.requestReplacer,
                        condition: ChainCondition.bypassProcess,
                    });
                    break;
                case RequestAuthRejectStage.origRequestBeingRejected:
                    this.onExpectServer(axios_6.EServerResponse.reject);
                    break;
                case RequestAuthRejectStage.rejectedRequestPendingInQueue:
                    try {
                        helper.expectRequestReject_OnChainPerspectiveByCondition({
                            chain: helper.authHeaderUpdater,
                            condition: ChainCondition.processOnly,
                        });
                        helper.expectRequestReject_OnChainPerspectiveByCondition({
                            chain: helper.extraHeaderUpdater,
                            condition: ChainCondition.processOnly,
                        });
                        helper.expectRequestReject_OnChainPerspectiveByCondition({
                            chain: helper.requestReplacer,
                            condition: ChainCondition.bypassProcess,
                        });
                        helper.expectRequestReject_OnAdapterPerspective();
                        helper.expectRequestRestored_andAuthRequestBeingSend_onAuthGuard();
                        helper.expectAuthRequestNotYetCall();
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                case RequestAuthRejectStage.sendingReAuthRequestOnAuthGuard:
                    try {
                        expect(helper.authGuard.onRequestNewAuth).toBeCalled();
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                case RequestAuthRejectStage.reAuthRequestFetched:
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acFetchedMarker,
                        condition: ChainCondition.bypassProcess,
                    });
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acTokenUpdater,
                        condition: ChainCondition.processUntouched,
                    });
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acIdleMarker,
                        condition: ChainCondition.processUntouched,
                    });
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acAuthGuard,
                        condition: ChainCondition.processUntouched,
                    });
                    break;
                case RequestAuthRejectStage.newAuthTokenBeingUpdated:
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acTokenUpdater,
                        condition: ChainCondition.processOnly,
                    });
                    expect(axios_6.authToken.value).toBe(this.authToken);
                    break;
                case RequestAuthRejectStage.newAuthSuccessfullyFetchedMarkIdle:
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acAuthGuard,
                        condition: ChainCondition.processOnly,
                    });
                    expect(helper.acAuthGuard.onAuthSuccess).toBeCalled();
                    expect(helper.acAuthGuard.onAuthError).not.toBeCalled();
                    helper.expectRequestReject_OnChainPerspectiveByCondition({
                        chain: helper.acIdleMarker,
                        condition: ChainCondition.bypassProcess,
                    });
                    break;
                case RequestAuthRejectStage.origPendingRequestBeingResponse:
                    expect(helper.authGuard.canProcessFulFill).toReturnWith(false);
                    expect(helper.authGuard.processFulFill).not.toBeCalled();
                    expect(helper.authGuard.canProcessReject).toReturnWith(true);
                    expect(helper.authGuard.processReject).toBeCalled();
                    break;
                default:
                    break;
            }
        }
        async expectUnAuthRequestTurningIntoAuth(option) {
            var _a;
            jest.clearAllMocks();
            this.spyOnAllGuards();
            const url = "/path/to/get/url2";
            const expected = { data: { username: "expect2" } };
            const payload = {};
            const terminate = true;
            axios_6.authToken.value = "helloworld";
            axios_6.mockServer.registerResponse((_a = this.client.authClient) === null || _a === void 0 ? void 0 : _a.option.axiosConfig.url, async () => ({
                data: {
                    token: this.authToken,
                },
            }), false);
            const future = this.get(url, payload, async () => {
                await wait(200);
                return expected;
            });
            this.expectRequestReject_OnServerPerspective();
        }
        clearTestRecords() {
            this.chainTestStacks.length = 0;
        }
        expectMatchSimpleAuthClientChain(preRenderedAuthToken, authUrl) {
            console.log(JSON.stringify(this.chainTestStacks));
            expect(this.chainTestStacks).toEqual(chain_test_helper_1.expectedChainFlow.simpleAuth(authUrl, preRenderedAuthToken));
            expect(this.client.option.authOption.tokenGetter()).toEqual(preRenderedAuthToken);
        }
    }
    exports.AxiosTestHelper = AxiosTestHelper;
});
define("__tests__/setup/client.test.setup", ["require", "exports", "src/presets/request_header_updater", "src/presets/auth_response_guard", "src/presets/network_error_response_guard", "src/presets/request_replacer", "src/presets/auth_client_guards", "__tests__/__mocks__/axios"], function (require, exports, request_header_updater_2, auth_response_guard_2, network_error_response_guard_2, request_replacer_1, auth_client_guards_2, axios_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requestClientOption = exports.formatHeader = exports.EErrorCode = void 0;
    exports.EErrorCode = axios_7._EErrorCode;
    const timeout = 10 * 1000;
    const baseURL = "http://localhost";
    exports.formatHeader = { value: { format: "mock" } };
    const authUrl = "path/to/auth_url";
    exports.requestClientOption = {
        isSuccessResponse: (s) => s.succeed != undefined,
        isDataResponse: (d) => d.data != undefined,
        isErrorResponse: (e) => e.error_code != undefined,
        axiosConfig: {
            baseURL,
            timeout,
        },
        requestChain: [
            new request_header_updater_2.ClientRequestAuthHeaderUpdater(function () {
                return axios_7.authToken.value;
            }),
            new request_header_updater_2.ClientRequestExtraHeaderUpdater(function () {
                return exports.formatHeader.value;
            }),
            new request_replacer_1.RequestReplacer(
            // replacementIdentifier = BaseRequestReplacer...
            ),
        ],
        responseChain: [
            new auth_response_guard_2.AuthResponseGuard(),
            new network_error_response_guard_2.NetworkErrorResponseGuard(function networkError(error) {
                console.log("detect network error:", error);
            }),
        ],
        authOption: {
            axiosConfig: {
                url: authUrl,
                baseURL,
                timeout: 12000,
            },
            interval: 600,
            requestChain: [],
            responseChain: [
                new auth_client_guards_2.ACFetchedMarker(),
                new auth_client_guards_2.ACTokenUpdater(),
                new auth_client_guards_2.ACAuthResponseGuard(),
                new auth_client_guards_2.ACIdleMarker(),
            ],
            payloadGetter: function () {
                return null;
            },
            tokenGetter: function () {
                console.log("tokenGetter:", axios_7.authToken.value);
                return axios_7.authToken.value;
            },
            tokenUpdater: function (response) {
                try {
                    console.log("tokenUpdater", response.data.data.token);
                    axios_7.authToken.value = response.data.data.token;
                }
                catch (e) {
                    console.error("tokenUpdater error, response:", response, "\nerror:", e);
                    throw e;
                }
            },
            redirect: function (response) {
                console.log("redirect home");
                return null;
            },
        },
    };
});
define("src/presets/auth_response_guard", ["require", "exports", "tslib", "src/base/impl/base_auth_response_guard", "src/base/itf/plugin_chains_itf", "src/base/impl/response_plugins_impl", "axios", "src/index", "src/presets/auth_client_guards"], function (require, exports, tslib_6, base_auth_response_guard_1, plugin_chains_itf_6, response_plugins_impl_4, axios_8, __1, auth_client_guards_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthResponseGuard = exports.ForbiddenResponseGuard = void 0;
    axios_8 = tslib_6.__importDefault(axios_8);
    class ForbiddenResponseGuard extends response_plugins_impl_4.BaseClientServiceResponsePlugin {
        canProcessReject(error) {
            const status = error.response.status;
            return status == axios_8.default.HttpStatusCode.Forbidden;
        }
    }
    exports.ForbiddenResponseGuard = ForbiddenResponseGuard;
    /**{@inheritdoc} BaseAuthResponseGuard */
    class AuthResponseGuard extends base_auth_response_guard_1.BaseAuthResponseGuard {
        onRequestNewAuth(error) {
            return super.onRequestNewAuth(error);
        }
        onRestoreRequest(error) {
            return super.onRestoreRequest(error);
        }
        processReject(error) {
            if (this.isDirtiedBy(error, auth_client_guards_3.ACAuthResponseGuard.name, plugin_chains_itf_6.ChainActionStage.processResponse)) {
                return this.rejectAndIgnoreAll(error);
            }
            return this.reject(error);
        }
        /**
         * @returns - 用來攔截以下二種情況
         * isUnAuthorizedResponse || isRaisedFromRequestReplacer;
         */
        canProcessReject(error) {
            var _a;
            const isUnAuthorizedResponse = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) == axios_8.default.HttpStatusCode.Unauthorized;
            const isRaisedFromRequestReplacer = this.isDirtiedBy(error, __1.RequestReplacer.name);
            return isUnAuthorizedResponse || isRaisedFromRequestReplacer;
        }
    }
    exports.AuthResponseGuard = AuthResponseGuard;
});
//
//
//  INTERFACES
//
define("src/index", ["require", "exports", "src/base/itf/client_itf", "src/base/itf/plugin_chains_itf", "src/base/impl/request_plugins_impl", "src/base/impl/base_client_impl", "src/base/impl/response_plugins_impl", "src/base/impl/base_auth_response_guard", "src/base/impl/base_request_replacer", "src/base/impl/base_request_guard", "src/presets/request_header_updater", "src/presets/network_error_response_guard", "src/presets/auth_response_guard", "src/presets/request_replacer", "src/presets/auth_client_guards"], function (require, exports, client_itf_5, plugin_chains_itf_7, request_plugins_impl_2, base_client_impl_1, response_plugins_impl_5, base_auth_response_guard_2, base_request_replacer_2, base_request_guard_3, request_header_updater_3, network_error_response_guard_3, auth_response_guard_3, request_replacer_2, auth_client_guards_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACIdleMarker = exports.ACTokenUpdater = exports.ACFetchedMarker = exports.ACAuthResponseGuard = exports.RequestReplacer = exports.AuthResponseGuard = exports.NetworkErrorResponseGuard = exports.UpdateExtraHeaderPlugin = exports.UpdateAuthHeaderPlugin = exports.BaseRequestHeaderGuard = exports.BaseRequestReplacer = exports.BaseAuthResponseGuard = exports.BaseClientServiceResponsePlugin = exports.BaseClient = exports.BaseClientServiceRequestPlugin = exports.ChainActionStage = exports.BaseClientServicesPluginChains = exports.EClientStage = void 0;
    Object.defineProperty(exports, "EClientStage", { enumerable: true, get: function () { return client_itf_5.EClientStage; } });
    Object.defineProperty(exports, "BaseClientServicesPluginChains", { enumerable: true, get: function () { return plugin_chains_itf_7.BaseClientServicesPluginChains; } });
    Object.defineProperty(exports, "ChainActionStage", { enumerable: true, get: function () { return plugin_chains_itf_7.ChainActionStage; } });
    Object.defineProperty(exports, "BaseClientServiceRequestPlugin", { enumerable: true, get: function () { return request_plugins_impl_2.BaseClientServiceRequestPlugin; } });
    Object.defineProperty(exports, "BaseClient", { enumerable: true, get: function () { return base_client_impl_1.BaseClient; } });
    Object.defineProperty(exports, "BaseClientServiceResponsePlugin", { enumerable: true, get: function () { return response_plugins_impl_5.BaseClientServiceResponsePlugin; } });
    Object.defineProperty(exports, "BaseAuthResponseGuard", { enumerable: true, get: function () { return base_auth_response_guard_2.BaseAuthResponseGuard; } });
    Object.defineProperty(exports, "BaseRequestReplacer", { enumerable: true, get: function () { return base_request_replacer_2.BaseRequestReplacer; } });
    Object.defineProperty(exports, "BaseRequestHeaderGuard", { enumerable: true, get: function () { return base_request_guard_3.BaseRequestHeaderGuard; } });
    Object.defineProperty(exports, "UpdateAuthHeaderPlugin", { enumerable: true, get: function () { return request_header_updater_3.ClientRequestAuthHeaderUpdater; } });
    Object.defineProperty(exports, "UpdateExtraHeaderPlugin", { enumerable: true, get: function () { return request_header_updater_3.ClientRequestExtraHeaderUpdater; } });
    Object.defineProperty(exports, "NetworkErrorResponseGuard", { enumerable: true, get: function () { return network_error_response_guard_3.NetworkErrorResponseGuard; } });
    Object.defineProperty(exports, "AuthResponseGuard", { enumerable: true, get: function () { return auth_response_guard_3.AuthResponseGuard; } });
    Object.defineProperty(exports, "RequestReplacer", { enumerable: true, get: function () { return request_replacer_2.RequestReplacer; } });
    Object.defineProperty(exports, "ACAuthResponseGuard", { enumerable: true, get: function () { return auth_client_guards_4.ACAuthResponseGuard; } });
    Object.defineProperty(exports, "ACFetchedMarker", { enumerable: true, get: function () { return auth_client_guards_4.ACFetchedMarker; } });
    Object.defineProperty(exports, "ACTokenUpdater", { enumerable: true, get: function () { return auth_client_guards_4.ACTokenUpdater; } });
    Object.defineProperty(exports, "ACIdleMarker", { enumerable: true, get: function () { return auth_client_guards_4.ACIdleMarker; } });
});
//# sourceMappingURL=index.js.map