define('crawler',function(require) {

    var EventEmitter = require("events").EventEmitter;
    var crawler = new EventEmitter();

    var comps,
        fetchCount,
        reqCount,
        reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i;

    function request(comp, total_step, current_step) {

        var ignore = !comp.href || reIgnore.test(comp.href);

        if ( ignore) {

            comps.push(comp);
            checkFinshed();

        }else{

            comp.url = comp.href;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    comp.status = xhr.status;
                    comp.content = xhr.responseText;
                    comp.rawHeaders = xhr.getAllResponseHeaders() || '';
                    comps.push(comp);
                    checkFinshed();
                }
            };
            xhr.open('GET', comp.href, true);
            xhr.send(null);

        }

        crawler.emit('progress', {
            'total_step':total_step,
            'current_step':current_step,
            'message': (ignore? 'Crawl Ignore ': "Crawl ") + (comp.href || comp.type)
        });

    }

    function checkFinshed(){
        var i, comp, len = comps.length;

        reqCount++;
        crawler.emit("request", comps[len-1]);

        if(reqCount === fetchCount){

            for (i = 0; i < len; i++) {
                comp = comps[i];
                //TODO
            }
            crawler.emit("end", comps);
        }

    }

    crawler.crawl = function(arr){
        var i,
            len = arr.length;

        // 初始化爬取状态值
        comps = [];
        fetchCount = len;
        reqCount = 0;

        for (i = 0; i < len; i++) {
            request(arr[i], len, i+1);
        }
    };

    return crawler;
});
