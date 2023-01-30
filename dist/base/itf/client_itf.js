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
//# sourceMappingURL=client_itf.js.map