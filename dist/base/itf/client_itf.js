//
//
//          T Y P E S
//
//
//
/** 代表 client 當前的狀態表示, idle/fetching/authorizing*/
export var EClientStage;
(function (EClientStage) {
    EClientStage["idle"] = "idle";
    EClientStage["fetching"] = "fetching";
    EClientStage["authorizing"] = "authorizing";
})(EClientStage || (EClientStage = {}));
//
//
//      B A S E     I N T E R F A C E S
//
//
//
export class IBaseClientMethods {
}
export class IBaseClientResponsibilityChain {
}
export class IBaseClientProperties {
}
//
//
//      C O M P O U N D        I N T E R F A C E S
//
//
//
//
export class IBaseAuthClient {
}
/**  api client service
 * @typeParam DATA - response 型別
 * @typeParam ERROR - error 型別
 * @typeParam SUCCESS - success 型別
 * @typeParam QUEUE - {@link QueueItem} 裡的 Meta 型別
 */
export class IBaseClient {
}
//# sourceMappingURL=client_itf.js.map