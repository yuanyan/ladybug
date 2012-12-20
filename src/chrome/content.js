define("chrome/content",function(require){

    var sniffer = require("sniffer");

    function onRequest(port, request) {
        var action = request.action;

        if('init' == action){

            var documentClone= {
                documentElement : {
                    outerHTML: document.documentElement.outerHTML
                },
                URL : document.URL,
                performance : performance
            };

            var event = {type: 'init', data: documentClone};

            port.postMessage(event);

        }else if( 'sniff' ==  action) {


            sniffer.on("progress", function(data){
                var event = {type: 'progress', data: data};
                port.postMessage(event);
            });

            sniffer.on('end', function(data){
                var event = {type: 'end', data: data};
                port.postMessage(event);
            });

            sniffer.on('error', function(data){
                var event = {type: 'error', data: data};
                port.postMessage(event);
            });

            sniffer.sniff(document);

        }

    }


    chrome.extension.onConnect.addListener(function(port) {

        console.assert(port.name == "ladybug");

        port.onMessage.addListener(onRequest.bind(this, port));

    });


//    function dataPuller(){
//        var script = document.createElement('script');
//        script.setAttribute("type", "text/javascript");
//        script.setAttribute("async", true);
//        script.setAttribute("src", chrome.extension.getURL("src/chrome/puller.js"));
//        //Assuming your host supports both http and https
//        var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
//        head.insertBefore(script, head.firstChild);
//    }


});

