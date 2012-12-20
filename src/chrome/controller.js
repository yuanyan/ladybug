define('chrome/controller', function (require, exports, module) {

    var EventEmitter = require("events").EventEmitter;
    var sniffer = require("sniffer");
    var controller = new EventEmitter();

    /*! @source https://gist.github.com/1129031 */
    /*global document, DOMParser*/
    (function(DOMParser) {
        "use strict";

        var
            DOMParser_proto = DOMParser.prototype
            , real_parseFromString = DOMParser_proto.parseFromString
            ;

        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if ((new DOMParser).parseFromString("", "text/html")) {
                // text/html parsing is natively supported
                return;
            }
        } catch (ex) {}

        DOMParser_proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                var
                    doc = document.implementation.createHTMLDocument("")
                    , doc_elt = doc.documentElement
                    , first_elt
                    ;

                doc_elt.innerHTML = markup;
                first_elt = doc_elt.firstElementChild;

                if ( // are we dealing with an entire document or a fragment?
                    doc_elt.childElementCount === 1
                        && first_elt.localName.toLowerCase() === "html"
                    ) {
                    doc.replaceChild(first_elt, doc_elt);
                }

                return doc;
            } else {
                return real_parseFromString.apply(this, arguments);
            }
        };
    }(DOMParser));

//    function getCookies(comp, last) {
//        chrome.cookies.getAll({url: comp.url}, function (cookies) {
//            var i, len, cookie,
//                cookieStr = '';
//
//            for (i = 0, len = cookies.length; i < len; i += 1) {
//                cookie = cookies[i];
//                cookieStr += cookie.name + '=' + cookie.value + '; ';
//            }
//            comp.cookie = cookieStr;
//
//            if (last) {
//                //sniffDone();
//            }
//        });
//    }
//
//    function getDocCookies(comps) {
//
//        for (var i = 0, len = comps.length; i < len; i += 1) {
//            getCookies(comps[i], i === len - 1);
//        }
//    }
//
//


    function connectCallback(port, event) {
        var type = event['type'], data = event['data'] ;

        if('init' == type){
            sniffer.url = data.URL;
            sniffer.document = (new DOMParser).parseFromString(data.documentElement.outerHTML, "text/html");
            sniffer.performance = data.performance;
            port.postMessage({action: 'sniff'});
        }

        sniffer.emit( type , data);

    }


    controller.getWindowId = function(){
        // window ID append at index.html#123
       return parseInt(location.hash.slice(1), 10);
    };



    controller.run = function run() {

        var windowId = controller.getWindowId();

        chrome.tabs.getSelected(windowId, function (tab) {
            if (tab.status === 'complete') {

                var port = chrome.tabs.connect(tab.id, {name: "ladybug"});
                port.onMessage.addListener(connectCallback.bind(this, port));
                port.postMessage({action: 'init'});

            } else {
                console.log('page still loading, waiting...');
                setTimeout(run, 250);
            }
        });
    };


    return controller;



});
