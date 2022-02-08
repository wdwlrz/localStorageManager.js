// 作者：jamy
// 博客：www.imjamy.com



// 注意 JSON.parse() 无法解析json5格式的对象


var localStorageManager = function () {

    /****** 私有属性 ******/
    let that = this; // that被赋值为当前对象this，这样私有方法就可以通过that访问共有属性和方法了。

    /****** 对象共有属性 ******/
    this.data={};
    this.originData={};

    /****** 私有方法 ******/
    let matchOptions = function(value){
        let options={isObject:false,isArray:false};
        if (!value){
            return options;
        }
        if (value.constructor === String) {
            try{
                value=JSON.parse(value);
            }catch(e){}
        }
        if (value.constructor === Object) {
            options.isObject=true;
        }
        if (value.constructor === Array) {
            options.isArray=true;
        }
        return options
    };

    let getValueUseMatchType = function(value,options){
        if (options.isArray || options.isObject){
            value=JSON.parse(value);
        }
        return value;
    };

    let updateStorageList = function (item={key:'test',value:'{a:1}',options:matchOptions('{a:1}')},action='add') {
        // item.value 为localStorage里的值(文本型)
        if (item.key=='storageList'){
            console.log("error: localStorageManager 中 storageList 是保留key，不可以手动操作");
            return false;
        }
        let storageList=JSON.parse(localStorage.getItem('storageList'));
        storageList=storageList?storageList:{};
        if (action=='add'){
            that.originData[item.key]=item.value;
            that.data[item.key]=getValueUseMatchType(item.value,item.options);
            delete item['value'];
            storageList[item.key]=item;
            localStorage.setItem('storageList',JSON.stringify(storageList),false);
        }
        if (action=='delete'){
            delete that.originData[item.key];
            delete that.data[item.key];
            delete storageList[item.key];
            localStorage.setItem('storageList',JSON.stringify(storageList),false);
        }
        return true;
    };

    let addEvent = function(){
        // 重写setItem、removeItem，并派发事件
        // 让setItem支持对象与数组
        const signSetItem = localStorage.setItem;
        localStorage.setItem = function (key, val, dispatchEvent=true) {
            if (val.constructor==Object || val.constructor==Array){
                arguments[1]=JSON.stringify(val);
            }
            signSetItem.apply(this, arguments);
            let setEvent = new Event('localStorage_setItemEvent');
            setEvent.key = arguments[0];
            setEvent.value = arguments[1];
            if (dispatchEvent){
                window.top.dispatchEvent(setEvent);
            }
        };

        const signRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function (key, dispatchEvent=true) {
            let removeEvent = new Event('localStorage_removeItemEvent');
            removeEvent.key = key;
            signRemoveItem.apply(this, arguments);
            if (dispatchEvent){
                window.top.dispatchEvent(removeEvent);
            }
        }
    };

    let listener_setItem = function(e){
        let key=e.key;
        let value=e.value;
        let item={
            key:key,
            value:value,
            options:matchOptions(value)
        };
        updateStorageList(item);
    };

    let listener_removeItem = function(e){
        let key=e.key;
        updateStorageList({key:key},'delete');
    };

    let addListener = function(){
        // 添加监听
        // 事件回调必须使用外部函数，匿名函数无法移除
        window.top.addEventListener('localStorage_setItemEvent', listener_setItem);
        window.top.addEventListener('localStorage_removeItemEvent', listener_removeItem);
        // 关闭页面时销毁附加在顶层页面的事件监听
        window.addEventListener('unload', function(){
            window.top.removeEventListener('localStorage_setItemEvent',listener_setItem);
            window.top.removeEventListener('localStorage_removeItemEvent',listener_removeItem);
        });
    };

    /****** 特权方法 --- 可操作私有属性的方法 ******/


    /****** 对象共有方法 ******/
    this.set = function (key,value){
        if (value==undefined){
            console.log("error: 'value'不能为空");
            return false;
        }
        let item={
            key:key,
            value:value,
            options:{
                isObject:false,
                isArray:false,
            }
        };
        if (value.constructor == Object){
            value=JSON.stringify(value);
            item.options.isObject=true;
        }
        if (value.constructor == Array){
            value=JSON.stringify(value);
            item.options.isArray=true;
        }

        localStorage.setItem(key,value); // 会派发事件调用updateStorageList，这里的判断value类型好像多余了，setItem里也会判断
        return true;
    };

    this.get = function (key,needParse_or_Options){
        let options={isObject:false,isArray:false};
        let value=localStorage.getItem(key);
        if (needParse_or_Options==undefined){
            let storageList=JSON.parse(localStorage.getItem('storageList'));
            if (storageList && storageList[key]){
                needParse_or_Options=storageList[key].options;
            }
        }
        if (typeof needParse_or_Options == 'boolean'){
            options.isObject=needParse_or_Options;
        }
        if (typeof needParse_or_Options == 'object'){
            options=needParse_or_Options;
        }
        if (options.isObject || options.isArray){
            try{
                value=JSON.parse(value);
            }catch (e) {
                value=undefined;
            }
        }

        return value;
    };

    this.del = function (key){
        localStorage.removeItem(key);
    };

    this.clear = function () {
        localStorage.clear();
    };

    this.initData = function(rebuild=false){
        this.data={};
        let storageList=undefined;
        if (rebuild==false){
            storageList=this.get('storageList',true);
        }
        if (rebuild==false && storageList){
            for(let key in storageList){
                let value=localStorage.getItem(key);
                let item={
                    key:key,
                    value:value,
                    options:matchOptions(value)
                };
                updateStorageList(item);
            }
        }else{
            let length=localStorage.length;
            for (let i = 0; i < length; i++) {
                let key=localStorage.key(i);
                let value=localStorage.getItem(key);
                let item={
                    key:key,
                    value:value,
                    options:matchOptions(value)
                };
                updateStorageList(item);
            }
        }
    };


    /****** 初始化 ******/
    let init = function () {
        that.initData();
        addEvent();
        addListener();
    };

    /****** 安全模式 ******/
    if(this instanceof localStorageManager){
        init();
    }else{
        return new localStorageManager();
    }

};
