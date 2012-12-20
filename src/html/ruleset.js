define('html/ruleset',function (require) {
    var util = require('util');

    return {

        avoidInlineScriptRule: function() {

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 2;

            var nodes = util.toArray(document.body.querySelectorAll('script'));
            nodes.forEach(function(node){

                // find inline script
                if( !(node.src || node.getAttribute('src')) && node.innerHTML.trim().length > 0){

                    (function findNext(current){
                        var next = current.nextElementSibling; // TODO: current find the next node only in the same parentNode
                        if(next){

                            if( next.getAttribute('src') || next.getAttribute('href') ){ // img link sript ..

                                var res = {
                                    text:node.outerHTML
                                };

                                result.push(res);

                            }else{
                                findNext(next);
                            }

                        }
                    })(node);
                }

            });
            // http://www.stevesouders.com/blog/2009/05/06/positioning-inline-scripts/
            parserEmitter.emit('result', {
                'rule':'Avoid Inline Script',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Inline scripts block downloads and rendering, just like external scripts. Any resources below an inline script do not get downloaded until the inline script finishes executing. Nothing in the page is rendered until the inline script is done executing. When you click Reload, notice that the page is white for five seconds.'
            });

        },

        avoidAttributeInlineStyleRule:function () {

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 2;

            var nodeArray = util.toArray(document.querySelectorAll('*')), styleNodes = 0, styleBytes = 0;

            nodeArray.forEach(function (node) {
                if(node.style.cssText.length > 0){

                    var res = {
                        text:node.outerHTML
                    };

                    result.push(res);
                }
            });

            parserEmitter.emit('result', {
                'rule':'Avoid Attribute Inline Style',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Reduce the number of tags that use the style attribute, replacing it with external CSS definitions.'
            });


        },

        avoidAttributeInlineJavascriptRule: function () {

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 2;


            var eventArray = ['mouseover', 'mouseout', 'mousedown', 'mouseup', 'click', 'dblclick', 'mousemove', 'load', 'unload','error', 'beforeunload', 'focus', 'blur', 'touchstart', 'touchend', 'touchmove'];
            var nodeArray = util.toArray(document.querySelectorAll('*')), attribute;

            nodeArray.forEach(function (node) {

                if(node.href && node.href.trim && node.href.trim().toLowerCase().indexOf("javascript:") == 0){

                    var res = {
                        text: node.outerHTML
                    };

                    result.push(res);

                }else{

                    eventArray.forEach(function(event){
                        attribute = node.getAttribute('on' + event);

                        if (attribute) {

                            var res = {
                                text:node.outerHTML
                            };

                            result.push(res);

                        }

                    });
                }



            });

            parserEmitter.emit('result', {
                'rule':'Avoid Attribute Inline Javascript',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Removing the inline JavaScript, or updating the attributes will improve the loading speed of the page.'
            });


    },

        avoidEmptyNodeRule:function () {  // empty node or href ,src

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 1;

            var nodeArray = util.toArray(document.querySelectorAll('*'));

            nodeArray.forEach(function (node) {
                var tag = node.tagName.toLowerCase();
                if (node.childNodes.length == 0 && !(tag == 'link' || tag == 'br' || tag == 'script' || tag == 'meta' || tag == 'img' ||
                    tag == 'a' || tag == 'input' || tag == 'hr' || tag == 'param' || tag == 'iframe' ||
                    tag == 'area' || tag == 'base') && !((node.id || '') == '_firebugConsole')) {

                    var res = {
                        text:node.outerHTML
                    };

                    result.push(res);

                }
            });


            parserEmitter.emit('result', {
                'rule':'Avoid Empty Node Content',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Remove empty node.'
            });

        },

        avoidEmptyHrefRule:function () {  // empty node or href ,src

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 5;

            var nodeArray = util.toArray(document.querySelectorAll('*'));

            nodeArray.forEach(function (node) {
                var tag = node.tagName.toLowerCase();

                if (tag == 'html') {
                    attribute = node.getAttribute('manifest');
                    if (attribute && attribute.value.trim() === '') {
                        var res = {
                            text:'Empty manifest attribute: ' + node.outerHTML
                        };

                        result.push(res);
                    }
                }
                else if (tag == 'link' && /stylesheet|icon|shortcut|prefetch/.test(node.rel) && node.getAttribute('href').trim() === '') {

                    var res = {
                        text:'Empty href attribute: ' + node.outerHTML
                    };

                    result.push(res);
                }
                else if (tag == 'video' || tag == 'audio' || tag == 'iframe' || tag == 'input' || tag == 'embed' || tag == 'img') {
                    var attribute = node.getAttribute('src');
                    if (attribute && attribute.trim() === '') {

                        var res = {
                            text:'Empty src attribute: ' + node.outerHTML
                        };

                        result.push(res);
                    }
                }
            });


            parserEmitter.emit('result', {
                'rule':'Avoid Empty href&src',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Empty herf or src attribut maybe do a request.'
            });

        },
        avoidIframeNodeRule:function () {

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 3;

            var nodeArray = util.toArray(document.querySelectorAll('iframe'));

            nodeArray.forEach(function (node) {
                var res = {
                    text:node.outerHTML
                };

                result.push(res);
            });


            parserEmitter.emit('result', {
                'rule':'Avoid Iframe Node',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Reducing iframe nodes.'
            });
        },


        avoidDepthNestingNodeRule:function () {
            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 8,
                depth = 8; //the max depth value

            function parentNodes(node) {
                var counter = 0;
                if (node.parentNode)
                    while (node = node.parentNode) {
                        counter++
                    }
                return counter;
            }

            var nodes = document.querySelectorAll('*'), i = nodes.length, averageDepth = 0;
            while (i--) {
                averageDepth += parentNodes(nodes[i]);
//                if (average > 15) {
//                    nodes[i].style.cssText += ';border:1px dashed #f00';
//                }
            }

            averageDepth = averageDepth / nodes.length;

            //
            weight = parseInt(averageDepth / depth * weight);

            var res = {
                text:'Average Nesting depth is ' + (averageDepth).toFixed(3) + '.'
            };

            result.push(res);

            parserEmitter.emit('result', {
                'rule':'Avoid Depth Nesting Node',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Reducing nesting depth might increase performance.'
            });
        },

        avoidLargeDocumentSizeRule:function () {
            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 5;

            var domsize = document.body.innerHTML.length;

            weight = parseInt(domsize / (100 * 1024) * weight);

            var res = {
                text:'DOM size is ' + (domsize / 1024).toFixed(3) + 'k.'
            };

            result.push(res);

            parserEmitter.emit('result', {
                'rule':'Avoid Large Document Size',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Performance might improve if you reduce the amount of HTML.'
            });
        },

        avoidComplexityDocumentRule:function () {

            var parserEmitter = this.parserEmitter,
                document = this.document,
                file = this.comp,
                result = [],
                weight = 8;

            var bodycount = util.benchmark(function () {
                document.body.appendChild(document.createTextNode(' '));
                var x = document.body.innerHTML;
            }, 10);


            weight = parseInt(bodycount / 0.1 * weight);

            var res = {
                text:'Average DOM serialization speed is ' + bodycount.toFixed(3) + 's.'
            };

            result.push(res);

            parserEmitter.emit('result', {
                'rule':'Avoid Complexity Document Structure',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Keep the simply of the Document structure.'
            });

        }
    };


});