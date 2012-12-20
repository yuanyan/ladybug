define('statistics', function (require, exports, module) {

    var util = require('util');
    var Mustache = require('../vendor/mustache/mustache');
    var sniffer = require('sniffer');
    var Headers = require('headers').Headers;
    var EventEmitter = require("events").EventEmitter;
    var statistics = new EventEmitter();

    function htmlNodeStat() {

        var nodecount = 0, comments = 0, whitespace = 0, textnodes = 0, textnodeLength = 0;

        function findWhitespaceTextNodes(element) {
            // Safety check
            if (element.childNodes && element.childNodes.length > 0)
                for (var i = 0; i < element.childNodes.length; i++)
                    findWhitespaceTextNodes(element.childNodes[i]);
            nodecount++;

            if (element.nodeType == 8) // comments
                comments++;
            if (element.nodeType == 3 && /^\s+$/.test(element.nodeValue)) {
                // if(_console) console.warn('Whitespace-only text node', element);
                whitespace++;
            }
            if (element.nodeType == 3 && "script style".indexOf(element.parentNode.tagName.toLowerCase()) == -1) {
                textnodes++;
                textnodeLength += element.nodeValue.length;
            }
        }

        findWhitespaceTextNodes(document);


        if (whitespace)
            console.log(((whitespace / nodecount) * 100).toFixed(1) + '% of nodes are whitespace-only text nodes.', 'Reducing the amount of whitespace, like line breaks and tab stops, can help improve the loading and DOM API performance of the page.');
        if (comments)
            console.log('There are ' + comments + ' HTML comments.', 'Removing the comments can help improve the loading and DOM API performance of the page.');

        var contentPercent = textnodeLength / document.body.innerHTML.length * 100;

        console.log(nodecount, 'nodes'); // 1500,3000
        console.log(textnodes, 'text nodes');  // 750, 1500
        console.log((textnodeLength / 1024).toFixed(1) + 'k', 'text node size'); // 80000, 500000
        console.log(contentPercent.toFixed(2) + '%', 'content percentage'); // 25, 50
    }

    //font, frame, frameset, noframes, blink, marquee, nobr, applet, basefont, center,
    // dir, isindex, listing, plaintext, s, tt, u, i, b, strike, xmp
    function deprecatedNodeStat() {
        var DEPRECATED = ("font center strike u dir applet acronym bgsound isindex layer ilayer nolayer listing marquee nobr " +
            "noembed plaintext spacer xml xmp").split(' ');

        var nodes = $('*'), i = nodes.length, deprecated = 0, deprecatedTags = {};

        while (i--) {
            var tag = nodes[i].tagName.toLowerCase();
            if (DEPRECATED.indexOf(tag) > -1) {
                console.warn('Deprecated node', nodes[i]);
                if (!deprecatedTags[tag]) deprecatedTags[tag] = true;
                deprecated++;
            }
        }

        if (deprecated) {
            var tags = [];
            for (tag in deprecatedTags) tags.push(tag.toUpperCase());
            console.log('There are ' + deprecated + ' nodes which use a deprecated tag name (' + tags.join(', ') + ').', 'Try updating this content to HTML5.');
        }
    }

    /**
     * Count all DOM elements from a node
     * @param node the root node to count all DOM elements from
     * @return number of DOM elements found on given node
     */
    function countDOMElements(node) {
        return (node && node.getElementsByTagName('*').length) || 0;
    }


    function flashStat() {
        var nodes = [],
            obj = document.querySelectorAll('embed'),
            i = obj.length;

        if (i) {
            while (i--) {
                if ((obj[i].type || '').toLowerCase() == 'application/x-shockwave-flash') nodes.push(obj[i]);
            }
        }

        obj = $('object');
        i = obj.length;
        if (i) {
            while (i--) {
                if ((obj[i].classid || '').toLowerCase() == 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' || (obj[i].type || '').toLowerCase() == 'application/x-shockwave-flash') nodes.push(obj[i]);
            }
        }

        if (nodes.length == 1) {
            console.log('Consider alternatives to using Flash.', 'There is 1 Flash object embedded. Replacing this with browser-native implementations (SVG, VML, Canvas) could lead to better loading times, especially if the Flash plugin is loaded first.');
        } else if (nodes.length) {
            console.log('Consider alternatives to using Flash.', 'There are ' + nodes.length + ' Flash objects embedded. Replacing these with browser-native implementations (SVG, VML, Canvas) could lead to better loading times, especially if the Flash plugin is loaded first.');
        }
    }

    function responseCodeStat(comps) {
        var counterArr = util.fill(6, 0);
        comps.forEach(function (comp) {
            if (comp['status'] != null) {
                var index = comp['status'].toString().charAt(0);
                counterArr[index] += 1;
            }
        });

//        var data = [
//            {code:"2xx", nums:counterArr['2']},
//            {code:"3xx", nums:counterArr['3']},
//            {code:"4xx", nums:counterArr['4']},
//            {code:"5xx", nums:counterArr['5']}
//        ];

        var data = {
            "2xx":counterArr['2'],
            "3xx":counterArr['3'],
            "4xx":counterArr['4'],
            "5xx":counterArr['5']
        };

        var statCodeTemplate = $("#stat-code-template").html();
        var output1 = Mustache.render(statCodeTemplate, data);
        $("#stat-code").html(output1);

    }


    function performanceTimingStat() {

        var timing = sniffer.performance.timing;

        var d = [
//            { name: "onUnload", value: timing.unloadEventEnd - timing.unloadEventStart,description: "The time taken to execute the unload event handler of the previous navigation." },
//            { name: "Redirect", value: timing.redirectEnd - timing.redirectStart, description: "The time taken to redirect to the current navigation." },
            { name:"AppCache", value:timing.domainLookupStart - timing.fetchStart, description:"The time taken to resolve the DNS of the root document." },
            { name:"DNS", value:timing.domainLookupEnd - timing.domainLookupStart, description:"The time taken to resolve the DNS of the root document." },
            { name:"TCP", value:timing.connectEnd - timing.connectStart, description:"The time taken to make the first TCP connection." },
            { name:"Request", value:timing.responseStart - timing.requestStart, description:"The time taken to make the request for the root document." },
            { name:"Response", value:timing.responseEnd - timing.responseStart, description:"The time taken to receieve the response body of the root document." },
            { name:"DomReady", value:timing.domContentLoadedEventStart - timing.domLoading, description:"The time taken to dom raady." },
            { name:"Load", value:timing.loadEventStart - timing.domContentLoadedEventStart, description:"The time taken to page complete loaded." }
//            { name: "DOM loading", value: timing.domInteractive - timing.domLoading, description: "The time taken from when the onreadystate change transitions from domLoading to domInteractive." },
//            { name: "DOM interactive", value: timing.domContentLoadedEventEnd - timing.domInteractive, description: "The time taken from when the onreadystate change transitions from domInteractive to domContentLoaded." },
//            { name: "DomContentLoaded", value: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart, description: "The time taken to execute the domContentloaded handler." },
//            { name: "DOM complete", value: timing.domComplete - timing.domLoading, description: "The time taken from when the onreadystate change transitions from domLoading to domComplete." },
//            { name: "onLoad", value: timing.loadEventEnd - timing.loadEventStart, description: "The time taken to begin and complete the onload event for the root document" },
//            { name: "Fetch", value: timing.responseEnd - timing.fetchStart, description: "The time taken from fetchStart to loadEnd, this is the time taken to fetch and load the root document."}


        ];

        var offset = (timing.domContentLoadedEventStart - timing.fetchStart) / 50;
        performceTImingChart(d, offset);

        //data[0]['value'] =  m.navigation = (timing.loadEventEnd - timing.navigationStart);

    }

    function performceTImingChart(d, offset) {
        var data = [];
        offset = offset || 0;

        d.forEach(function (item) {
            var v = item['value'];
            if (v > -1) {
                item['data'] = [ v + offset]; // + offset avoid when item is 0 that do not dispay in chart
                data.push(item);
            }

        });

        // reverse data that can display data in right order
        data.reverse();

        return new Highcharts.Chart({
            chart:{
                renderTo:'stat-1',
                backgroundColor:"#F5F5F5",
                borderColor:"#EEEEEE",
                type:'bar',
                width:780,
                height:170,
                marginTop:40
            },
            credits:{
                enabled:false
            },

            legend:{
                reversed:true
            },
            title:{
                text:''
            },
            yAxis:{
                min:0,
                title:{
                    text:'ms'
                }
            },
            tooltip:{
                formatter:function () {
                    return '' +
                        this.series.name + ': ' + (this.y - offset).toFixed(0) + 'ms';
                }
            },
            plotOptions:{
                series:{
                    stacking:'normal'
                }
            },
            series:data
        });
    }


    function getCompContentLenght(comp) {
        var length = 0;
        if (comp["responseHeaders"] && comp["responseHeaders"]["Content-Length"] != null) {
            length = parseInt(comp["responseHeaders"]["Content-Length"]);
        } else if (comp['content']) {
            length = comp['content'].length;
        }

        return length;
    }

    function sizePerTypeStat(comps) {

        var counter = {}, len, t, c , totalLength = 0;

        comps.forEach(function (comp) {

            len = getCompContentLenght(comp);
            totalLength += len;
            t = comp['type'];
            c = counter[ t ];

            c == null ? counter[ t ] = len : counter[ t ] += len;

        });


        var data = [];

        Object.keys(counter).forEach(function (k) {

            data.push([k, counter[k]]);

        });

        console.log("sizePerTypeStat: ", data);

        return data;

    }



    function getCompHostName(comp) {

        var hostname = '';
        if (comp['href']) {

            var parser = document.createElement('a');
            parser.href = comp['href'];
            hostname = parser.hostname;
            //        parser.protocol; // => "http:"
            //        parser.hostname; // => "example.com"
            //        parser.port;     // => "3000"
            //        parser.pathname; // => "/pathname/"
            //        parser.search;   // => "?search=test"
            //        parser.hash;     // => "#hash"
            //        parser.host;     // => "example.com:3000"
        }

        return hostname;

    }

    function sizePerDomainStat(comps) {
        var counter = {}, hostname, c;

        comps.forEach(function (comp) {

            hostname = getCompHostName(comp);

            if (hostname) {
                c = counter[ hostname ];
                c == null ? counter[ hostname ] = [comp] : counter[ hostname ].push(comp);
            }

        });


        // sort the conter data
        var counterArr = [];
        Object.keys(counter).forEach(function (k) {
            counterArr.push([counter[k].length, k]);
        });
        // reverse array
        counterArr.sort(function(a, b){
            return a[0] < b[0];
        });

        var data = {categories:[],data:[]};

        counterArr.forEach(function (item) {
            data.data.push(item[0]);
            data.categories.push(item[1]);
        });

        console.log("sizePerDomainStat: ",data);
        return data;

    }

    function typeDomainChart(data) {

        return  new Highcharts.Chart({
            chart: {
                renderTo: 'stat-2',
                type: 'column',
                backgroundColor:"#F5F5F5",
                borderColor:"#EEEEEE",
                width:780,
                height:340
            },
            credits:{
                enabled:false
            },
            title: {
                text: ''
            },
            xAxis: {
                categories :data['domain']['categories'],
                labels: {
                   // rotation: -45,
                    //align: 'right',
                    enabled:false,
                    style: {
                        fontSize: '10px'
//                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Requests'
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {

                formatter: function() {
                    var s;
                    if (this.point.name) { // the pie chart
                        s = ''+ this.point.name +': '+ this.y/1000 +' k';
                    } else {
                        s = '<b>'+ this.x +'</b>: '+ this.y +' requests'
                    }
                    return s;
                }

            },
            labels: {
                items: [{
                    html: 'Per Type Size',
                    style: {
                        left: '580px',
                        top: '5px',
                        color: 'black'
                    }
                }]
            },
            series: [{
                type:'pie',
                center: [620, 95],
                size: 120,
                showInLegend: false,
                dataLabels: {
                    enabled: false
                },
                data: data['type']
            },{
                name: 'Requests',
                data: data['domain']['data'],
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        return this.y;
                    },
                    style: {
                        font: 'normal 13px Verdana, sans-serif'
                    }
                }
            }]
        });
    }

    // Requests per Content Type

    function parseRawHeaders(comps) {
        comps.forEach(function (comp) {
            if (comp['rawHeaders']) {
                comp['responseHeaders'] = new Headers(comp['rawHeaders']);
            }
        });

        return comps;
    }

    function filterInlineComps(comps) {
        var c = [];
        comps.forEach(function (comp) {
            if (comp['type'] && comp['type'].indexOf('inline') === -1)
                c.push(comp);
        });

        return c;
    }

    statistics.stat = function (comps, document) {
        comps = filterInlineComps(comps);
        parseRawHeaders(comps);

        responseCodeStat(comps, document);
        performanceTimingStat();

        var typeData = sizePerTypeStat(comps, document);
        var domainData = sizePerDomainStat(comps, document);

        var data={
            'type':typeData,
            'domain':domainData
        };

        typeDomainChart(data);

        statistics.emit("end");

    };


    return statistics;


});