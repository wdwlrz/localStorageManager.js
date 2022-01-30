# localStorageManager.js

自动维护localStorage，可在vue中响应，实时更新数据到js对象里。

Automatically maintain localstorage, listen in Vue and update data to JS object in real time.

demo:

let ls = new localStorageManager();

ls.data; // data in localStorage

ls.set(key,value); // localStorage.setItem();  value can be an Object or Array

ls.get(key,needParse_or_Options); // localStorage.getItem();  needParse_or_Options is not required

ls.del(key); // localStorage.removeItem();

ls.clear(); // localStorage.clear();

ls.initData(force=false); // update ls.data


let app=new Vue({

  el:'#app',
  
  data:{
  
    storageData:ls.data   // when you changed localStorage, ls.data has been changed, {{storageData.name}} has been changed too.
    
    }
  
})
