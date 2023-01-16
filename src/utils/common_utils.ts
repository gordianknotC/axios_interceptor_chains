import { AllowedModule } from "@gdknot/frontend_common";

export function wait (span: number): Promise<boolean>{
    return new Promise(resolve =>{
      setTimeout(()=>{
        resolve(true);
      }, span);
    });
  }


export
function ensureNoRaise<T>(action: ()=> T, defaults: (error?: any)=> T): T{
  try{
    return action();
  }catch(e){
    console.warn(`catch error on`, e);
    return defaults(e);
  } 
}



export
function ensureCanProcessFulFill(action: ()=>boolean): boolean{
  return ensureNoRaise(action, ()=>false);
}

export
function ensureCanReject(action: ()=>boolean): boolean{
  return ensureNoRaise(action, ()=>false);
}

