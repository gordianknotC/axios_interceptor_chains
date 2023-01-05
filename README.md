


# 前端常用工具:

## 安裝
```bash
yarn add @gdknot/frontend_common
```
## documentation
```bash
yarn serve:doc
```
## Feature
- facade
- provider
- injector
- declare lazy loading object
- declare lazy loading function
- promise queue
- a CRUD function for writing pseudo code api

# Table of Content
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
table of content

- [前端常用工具:](#%E5%89%8D%E7%AB%AF%E5%B8%B8%E7%94%A8%E5%B7%A5%E5%85%B7)
  - [安裝](#%E5%AE%89%E8%A3%9D)
  - [documentation](#documentation)
  - [Feature](#feature)
- [Table of Content](#table-of-content)
- [Facade:](#facade)
  - [Provider Pattern](#provider-pattern)
    - [Dependency Provider(對應 dependency injector)](#dependency-provider%E5%B0%8D%E6%87%89-dependency-injector)
    - [Facade Provider (對應Facade Injector)](#facade-provider-%E5%B0%8D%E6%87%89facade-injector)
  - [Injector Pattern](#injector-pattern)
    - [InjectDependency](#injectdependency)
    - [InjectFacade](#injectfacade)
  - [應用於 App 上開發](#%E6%87%89%E7%94%A8%E6%96%BC-app-%E4%B8%8A%E9%96%8B%E7%99%BC)
    - [以 Domain Driven Design 為架構的 App 為例](#%E4%BB%A5-domain-driven-design-%E7%82%BA%E6%9E%B6%E6%A7%8B%E7%9A%84-app-%E7%82%BA%E4%BE%8B)
- [Lazy Loading:](#lazy-loading)
  - [lazyHolder - lazy loading for objects](#lazyholder---lazy-loading-for-objects)
    - [Example: 以Locale 為例](#example-%E4%BB%A5locale-%E7%82%BA%E4%BE%8B)
  - [CallableDelegate - lazy loading for functions](#callabledelegate---lazy-loading-for-functions)
    - [以注入 vue watch method 為例](#%E4%BB%A5%E6%B3%A8%E5%85%A5-vue-watch-method-%E7%82%BA%E4%BE%8B)
- [Queue:](#queue)
    - [enqueue](#enqueue)
    - [dequeue](#dequeue)
    - [dequeueByResult](#dequeuebyresult)
- [Writing pseudo code for api - 測試API工具:](#writing-pseudo-code-for-api---%E6%B8%AC%E8%A9%A6api%E5%B7%A5%E5%85%B7)
  - [CRUD](#crud)
    - [Example](#example)
- [注入 ui framework reactive 方法:](#%E6%B3%A8%E5%85%A5-ui-framework-reactive-%E6%96%B9%E6%B3%95)
  - [Inject Reactive Method](#inject-reactive-method)
    - [Vue 為例](#vue-%E7%82%BA%E4%BE%8B)
    - [React 為例](#react-%E7%82%BA%E4%BE%8B)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

[s-provideDependency]: src/vueMixins/common.ts
[s-provideFacade]: src/vueMixins/common.ts
[s-queue]: src/utils/queue.ts
[s-test-queue]: __tests__/queue.test.ts

---
# Facade:
籍用 [Facade design pattern](https://refactoring.guru/design-patterns/facade) 的概念，為App / Framework提供一個入口界面，這個入口界面依循相依分離原則，進一部使界面分離成為可能，其內部基本 design pattern 為一個 provider/injector design pattern 及為 facade 專門化的 provider/injector design pattern

__example__ 
```ts
//宣告 facade 界面
export type AppFacade = 
  FacadeMappers &
  FacadeDateSource &
  FacadeRepository &
  FacadePresentationStore &
  FacadeDomainService;

export const facade = IFacade<AppFacade>();

// inject facade 內容
provideFacade({
    deps: {
      ...mappers,
      ...dataSource,
      ...rep,
      ...presentation,
      ...services
    }, 
});
```


二種 pattern 區分如下：

1) 提供 [Dependency Provider](#dependency-provider%E5%B0%8D%E6%87%89-dependency-injector) design pattern，將 dependency以 ident 作為 key 植入 container
2) 提供 [Facade Provider](#facade-provider-%E5%B0%8D%E6%87%89facade-injector) design pattern，將 dependency 以 FACADE_KEY 作為 key 植入 container, 為App開發時提供一個入口，以存取所需的一切資料. 
  

## Provider Pattern
### Dependency Provider(對應 dependency injector)
#### provideDependency
[source][s-provideDependency] | 型別定義
```ts
type ProviderParams<T> = {
    deps: Partial<T>, 
    merge?: boolean, 
    ident?: string | symbol
};

/**
*  Dependency Provider
 * provide 方法，將 dependency 以 ident 作為 key 植入 container
 * @param option - {@link ProviderParams}
 * @see also {@link provideFacade}
 * */
function provideDependency<T>(option: ProviderParams<T>)
```
#### 不指定 Ident
```ts
const merge = true;
provideDependency({deps: {a: 1, source: {a: 2}}, merge});
provideDependency({deps: {b: 3, source: {b: 4}}, merge});
const a = injectDependency("a");
const aOfSource = injectDependency("source.a");
const b = injectDependency("b");
const bOfSource = injectDependency("source.b");
assert(a == 1);
assert(b == 3);
assert(aOfSource == 2);
assert(bOfSource == 4);
```
#### 指定 Ident
```ts
provideDependency({deps: {a: 1, source: {a: 2}}, ident: "a"});
provideDependency({deps: {b: 3, source: {b: 4}}, ident: "b"});
const a = injectDependency("a", "a");
const aOfSource = injectDependency("source.a", "a");
const b = injectDependency("b", "a");
const bOfSource = injectDependency("source.b", "a");
assert(a == 1);
assert(b == undefined);
assert(aOfSource == 2);
assert(bOfSource == undefined);

```

#### without enabling merge
```ts
test("Simple test without enabling merge", ()=>{
  provideDependency({
    deps: {
      Elton: "Elton",
      John: "John",
      users: {
        EltonJohn: "EltonJohn"
      }
    }
  });
  const Elton = injectDependency("Elton");
  const John = injectDependency("John");
  const EltonJohn = injectDependency("users.EltonJohn");
  expect(Elton).toBe("Elton");
  expect(John).toBe("John");
  expect(EltonJohn).toBe("EltonJohn");
});
```

#### with enabling merge
```ts
provideDependency({
  deps: {
    Elton: "Elton",
    John: "John",
    users: {
      EltonJohn: "EltonJohn"
    }
  }
});

provideDependency({
  deps: {
    Curtis: "Curtis"
  },
  merge: true
});
const Elton = injectDependency("Elton");
const John = injectDependency("John");
const EltonJohn = injectDependency("users.EltonJohn");
const Curtis = injectDependency("Curtis");
expect(Elton).toBe("Elton");
expect(John).toBe("John");
expect(EltonJohn).toBe("EltonJohn");
expect(Curtis).toBe("Curtis");
```


### Facade Provider (對應Facade Injector)
[source][s-provideFacade] | 型別定義

```ts
type ProviderParams<T> = {
    deps: Partial<T>, 
    merge?: boolean, 
    ident?: string | symbol
};
/**
 *  @params deps dependency 物件值鍵對
 *  @params merge 是否對 provider 所提併的值鍵對進與 container 進行合併 
 *  @params ident 用以識別 container 取值所需要的 key
 *  */
function function provideFacade<T>(option: ProviderParams<T>)
```

#### 不合併 provide 物件 
```ts
const merge = false;
provideFacade({
    deps: {
        source: {
            a: 1
        }
    }, 
    merge
});
// 覆寫
provideFacade({
    deps: {
        source: {
            b: 2
        }
    }, 
    merge
});
const facade = injectFacade();
assert(facade.source.a == undefined);
assert(facade.source.b == 2);
```
#### 合併 provide 物件

```ts
const merge = true;
provideFacade({
    deps:{
        source: {
            a: 1
        }
    }, 
    merge
});

provideFacade({
    deps: {
        source: {b: 2},
        appended: {a: 1}
    },
    merge
}
const facade = injectFacade();
assert(facade.source.a == 1);
assert(facade.source.b == 2);
assert(facade.appended.a == 1);
```


## Injector Pattern
### InjectDependency
```ts
/**
 * Dependency Injector
 * @see {@link injectDependency} 
 * @param ident  
 * @param pathOrName
 */
function injectDependency<T>(pathOrName: string, ident=DEP_KEY): T；

```
### InjectFacade
```ts
/**
 * Dependency Injector
 * 注入 IFacade interface, 對應 provideFacade
  * @see {@link provideDependency}
 * @param ident  
 */
export function injectFacade<T>(ident=FACADE_KEY): T
```



## 應用於 App 上開發
### 以 Domain Driven Design 為架構的 App 為例

**main.ts**
```ts
/**
 * Facade
 * 提供 APP 入口界面，實際上的相依則以 provideFacade 以注入的方式
 * 注入 container 中，其運作方式 同 DI pattern
 * 
 * AppFacade 用來定義 Facade 的型別，以供 typescript 辨示 
 * */
export type AppFacade = 
  FacadeMappers &
  FacadeDateSource &
  FacadeRepository &
  FacadePresentationStore &
  FacadeDomainService;

/**
 * facade 用來存取 Domain Driven Design 架構中的 data source / domain / presentation，這裡只定義型別，進行界面分離， IFacade 內部會以 lazyloading 的方式宣告，直到 facade 第一次實際被使用時，才會進行存取。
 */
export const facade = IFacade<AppFacade>();

const executeAndLog = (msg: string, cb: ()=>void)=>{
  console.group("", `----------${msg}---------`);
  cb();
  console.groupEnd();
}

/**
 *  設定 App 所需要的相依注入
 * */
(function setupDependencies() {
  "use strict";
  console.group("===============JinHao INFO================")
  executeAndLog("APP_PLUGIN", ()=>setupAppPlugins(app, facade));
  // ---------------
  // data source 注入
  executeAndLog("DATE_SERVICES", ()=>setupDataCoreServices(app, facade));
  executeAndLog("MAPPERS", ()=>setupMappers(app, facade));
  executeAndLog("REPOS", ()=>setupRepositories(app, facade));
  // -----------
  // domain 注入
  executeAndLog("DOMAIN_SERVICES", ()=>setupDomainServices(app, facade));
  // ----------------
  // presentation 注入
  executeAndLog("VIEW_STORES", ()=>setupPresentationStores(app, facade, true));
  app.mount("#app");
  executeAndLog("VIEW_STORES", ()=>setupPresentationStores(app, facade, false));
  console.groupEnd();
})();

```

**mappers/index**
```ts
export type FacadeMappers = {
  data: {
    mappers: {
      user: BaseModelMapper<UserEntity, UserDomainModel>;
      announcement: BaseModelMapper<AnnouncementEntity, AnnouncementDomainModel>;
    };
  };
};

export function setupMappers(app: App<Element>, facade: AppFacade) {
  const mergeObject = true;
  provideFacade(
    {
      data: {
        mappers: {
          user: userMapper(),
          announcement: annMapper()
        }
      }
    },
    mergeObject
  );
}
```

**repositories/index**
```ts
export type FacadeRepository = {
  data: {
    repo: {
      user: TUserRepository,
      announcement: TAnnouncementRepository,
      reset: ()=>void
    };
  };
};

// todo: index repositories 統一注入
export function setupRepositories(app: App<Element>, facade: AppFacade) {
  const mergeObject = true;
  const client = facade.data.remoteClient;

  /** repository 設定，注入 */
  const userMapper = facade.data.mappers.user;
  const user = new UserRepositoryImpl(client, userMapper);

  const announcementMapper = facade.data.mappers.announcement;
  const announcement = new AnnouncementRepositoryImpl(client, announcementMapper);
  
  provideFacade({
      data: {
        repo: {
          user,
          announcement,
          reset: ()=>{
            appLocalStorageMgr().clear();
          }
        }
      }
    },
    mergeObject
  );
}
```

**vue或其他地方使用時**
```ts
facade.data.remoteClient....
facade.data.repo...
facade....
```






---
# Lazy Loading:

以 proxy實作 lazy loading for objects, 及 lazy loading for functions，用於許多需要相依分離或需要考慮啓動時序問題的情境，其核心類似 Provider/Injector design pattern 及 Delegate design pattern，分為物件LazyHolder 及 Callable Delegate
- Object lazy holder
- Callable Delegate  

## lazyHolder - lazy loading for objects

__實作__
```ts
export function LazyHolder<T extends object>(initializer: () => T): T {
  let instance: T;
  return new Proxy<T>({} as T, {
    get: function (target, name) {
      instance ??= initializer();
      //@ts-ignore
      return instance[name];
    }
  }) as T;
}
```

### Example: 以Locale 為例
以下為例，引用 i18n 時，不用考慮到 createI18n 是否已經初始化，可以在 createI18n 初始化前就引用 i18n, 而不會產生相依問題。

**locale.ts**
```ts
//locale.ts
const Eng = {
    welcome: "welcome",
}
let _i18n;
// lazy loading
const i18n = lazyHolder<Locale<typeof Eng>>(()=>{
    return _i18n ??= createI18n();
});

// 當物件取用後(存取相關屬性，以下例而言是 property t)，才初始化
i18n.t("welcome");
```

**app_store.ts**
```ts
//app_store.ts
class AppStore{
    constructor(private i18n);
    get currentLanguage(): string{
        return this.i18n.locale.value;
    }
}
const appStore = new AppStore(i18n);
```


## CallableDelegate - lazy loading for functions
__實作__
```ts
export class CallableDelegate<CALLABLE extends Function> extends Function {
  constructor(
    public delegate: CALLABLE
  ) {
    super()    
    return new Proxy(this, {
      apply: (target, thisArg, args) => this.delegate(...args)
    })
  }
}
```
### 以注入 vue watch method 為例
```ts
// 這裡只宣告 watchMethod 的介面，及空的 instance，內容還沒有注入
// 因此會報錯 "watch method used before initialized"
let watchMethod=new CallableDelegate(()=>{
    throw new Error("watch method used before setup");
});
// 可以在程式中任意引用 watch 變數，即便 watchMethod 還沒初始化 
export const watch = watchMethod;

// 提供方法 初始化 watchMethod
function setupWatch(watchConstructor: any){
    watchMethod.delegate = watchConstructor;
}
```




---
# Queue:
Promise 實作駐列處理

- enqueue
- dequeue
- dequeueByResult

__型別__ | [source][s-queue]
```ts
export abstract class IQueue<T extends QueueItem> {
  abstract queue: T[];
  abstract enqueue(
    id: number,
    promise: () => Promise<any>,
    timeout?: number
  ): Promise<any>;
  abstract dequeue(option: {id: number, removeQueue: boolean}): Promise<any>;
  abstract dequeueByResult(option: {id: number, result: any}): Promise<any>;
}
```

### enqueue
> 將請求推到 Queue 裡，並同時執行 QueueItem，直到使用者 [dequeue] 才將 Queued 物件由列表中移除
  
__型別__:
```ts
/**
 * 將請求推到 Queue 裡，並同時執行，直到使用者 
 * {@link dequeue} 才將 Queued 物件由列表中移除
 * @param id - 請求 ID
 * @param promise - 處請求邏輯
 * @param timeout - timeout
 * @returns 
 */
  public enqueue(
    id: number,
    promise: () => Promise<any>,
    timeout: number = 10000,
  ): Promise<any>
```

__example__ | [source][s-test-queue]:
```ts
  const idC = 3;
  q.enqueue(idC, async ()=>{
    return new Promise(async resolve =>{
      await wait(span);
      resolve({idC});
    });
  });
  expect(q.queue.length).toBe(1);
```

### dequeue
> 執行queue裡的item，並依option.removeQueue決定是否移除queued item

__型別__:
```ts
/**
 * 執行queue裡的item，並依option.removeQueue決定是否移除queued item
 * 預設 option.removeQueue 為 true
 * @param option.id - 取得queue的id
 * @param option.removeQueue - 預設 true
 * @returns 
 */
public async dequeue(option: {id: number, removeQueue?: boolean}): Promise<any>
```

__example__ | [source][s-test-queue]:
```ts
test("expect raise exception while it's queuing", async ()=>{
    let rA, rB, rC, rD;
    let [wA, wB, wC, wD] = [100, 200, 600, 800];
    const t = time();
    q.enqueue(idA, async ()=>{
      return new Promise(async resolve =>{
        await wait(wA);
        rA = {idA};
        resolve({idA});
      });
    });
    expect(q.queue.length).toBe(1);
    q.enqueue(idC, async ()=>{
      return new Promise(async resolve =>{
        await wait(wC);
        rC = {idC}
        resolve({idC});
      });
    });
    expect(q.queue.length).toBe(2);
    expect(q.enqueue(idB, async ()=>{
      return new Promise(async (resolve, reject) =>{
        await wait(wB);
        reject("reject...");
      });
    })).rejects.toEqual("reject...");
    expect(q.queue.length).toBe(3);

    const resultA = await q.dequeue({id: idA});
    expect(resultA).toEqual({idA});
    expect(q.queue.length).toBe(2);
    
    const resultC = await q.dequeue({id: idC});
    expect(resultC).toEqual({idC});
    expect(q.queue.length).toBe(1);

    const resultB = await q.dequeue({id: idB});
    expect(q.queue.length).toBe(0);
  });
```

### dequeueByResult
> 提供 queue item 回傳 promise resolve 的結果，並將 queue item 移除 (概念籍用 Dart (Future/Completer))

__型別__:
```ts
  /**
   * 提供 queue item 回傳 promise resolve 的結困，並將 queue item 移除
   * @param option.id - 取得queue的id
   * @param option.removeQueue - 預設 true
   * @returns 
   */
  public async dequeueByResult(option: {id: number, result: any}): Promise<any>
```

__example__ | [source][s-test-queue]:
```ts
const pendingId = "idA";
// 十秒後 timeout
const pending = q.enqueue(pendingId, async ()=>{
    return waitForTimeOut(10 * 1000);
});
// 覆寫內容於是能將值返回給 pending 
q.dequeueByResult({id: pendingId, result: {succeed: true}});
expect(pending).resolves.toEquals({succeed: true});
```


---
# Writing pseudo code for api - 測試API工具:

## CRUD

有時開發時程不允許寫單元測試，只好透過寫假Api餵假資料，CRUD 提供單一Api所需的 Create/Read/Update/Delete 所需的界面。


```ts
export type TSuccessResponse = {
    succeed: boolean;
};

export type TDataResponse<T> = {
    data: T;
    pager?: TPager | null | undefined;
};

/**
 * @param dataList 取得該列表所有資料
 * @param updater  更新該列表所有資料 
 * @param itemGen 依 identity 由列表資料取得該 item
 */
const CRUD = <T extends {id: string|number}>(
  dataList: TOptional<TDataResponse<any[]>>,
  updater:(data: any[])=>void,
  itemGen: (idx: number)=>T
): {
    add: (payload: T)=>Promise<TSuccessResponse>,
    del: (payload: T)=>Promise<TSuccessResponse>,
    edit: (payload: T)=>Promise<TSuccessResponse>,
    get: (payload?: TPagerPayload)=>Promise<TDataResponse<any[]>>,
  }
```

### Example
```ts
const api = {
    news: {
        ...CRUD<NewsItem>(
            DB.getNewsList!,
            data => {
                DB.getNewsList!.data = data;
            },
            idx => {
                const result: NewsItem = {
                    is_publish: true,
                    author: DB.users[range(0, DB.users.length - 1)].username!,
                    content: `${idx} - content`,
                    title: `Loream Ipsum-${idx} dolo sit amet`
                };
                return result;
            }
        )
    }
}

api.news.add(payload);
api.news.del(payload);
api.news.edit(payload);
api.news.get(pagerPayload)
```


---
# 注入 ui framework reactive 方法:
## Inject Reactive Method
設計上希望能夠不相依於任何一個 ui framework，因此需由外部注入相應的 reactive 方法，再於內部使用這個需要被使用者注入的 reactive 方法作為界面，以達到與 ui framework 相依分離，否於未注入前就使用，則會出現 **InvalidUsageError:** 錯誤。

### Vue 為例
1) 注入 vue computed method
2) 注入 vue reactive method
3) 注入 vue watch method
4) 注入 vue ref method
  
**Example:**
```typescript 
import {
  setupComputed,
  setupCurrentEnv,
  setupReactive,
  setupRef,
  setupWatch,
} from "../src/extension/extension_setup";

import {
  computed as RComputed,
  reactive as RReactive,
  ref as RRef,
} from "../src/extension/extension_setup";

import { ref, reactive, watch, computed } from "vue";

describe("ref setup", ()=>{
  beforeAll(() => {
    setupRef(ref);
    setupReactive(reactive);
    setupWatch(watch);
    setupComputed(computed);
    setupCurrentEnv("develop");
  });

  test("computed", ()=>{
    expect(RComputed(()=>13).value).toBe(13);
  });
  test("ref", ()=>{
    expect(RRef(13).value).toBe(13);
  });
  test("reactive", ()=>{
    expect(RReactive({value: 13}).value).toBe(13);
  });
});
```


### React 為例
> todo...