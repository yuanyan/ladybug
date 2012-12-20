define('parser',function(require) {

    var parseTypes = require("config").parseTypes;
    var EventEmitter = require("events").EventEmitter;
    var parser = new EventEmitter();

    var Style = require("style/style").Style;
    var Script = require("script/script").Script;
    var HTML = require("html/html").HTML;

//    var comps,
//        finishCount,
//        parseCount;

    //    comp.type = doc.type,
    //    comp.href = comp.url
    //    comp.status = xhr.status;
    //    comp.content = xhr.responseText;
    //    comp.rawHeaders = xhr.getAllResponseHeaders() || '';

    function getParseComps(comps){
        var parseComps = [];

        comps.forEach(function(comp){
            if(parseTypes.indexOf(comp["type"]) !== -1 ){
                parseComps.push(comp);
            }
        });

        return parseComps;
    }

    function parse(comp, document){

        var type =  comp["type"];

        if(type.indexOf("script") !== -1){
            new Script(comp, parser, document);
        }else if(type.indexOf("style") !== -1){
            new Style(comp, parser, document);
        }else if(type === "html"){
            new HTML(comp, parser, document);
        }

    }

//    var results = {
//        "rules":[
//            {"id":"rule1","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule2","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule3","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule4","rule":"","grade":"A","results":[],"tip":""}
//        ]
//    };
    var rulesIndex= {};
    var rules= [];
    var ruleId = 0;

    parser.on("result", function(res){
        var rule = res["rule"];

        if(rulesIndex[rule] != undefined){ // hava existed

            var index = rulesIndex[rule];

            rules[index]["results"].push({
                "file": res["file"],
                "result": res["result"]
            });

        }else{ // first
            res["id"] = "rule" + ruleId;
            rulesIndex[rule] = ruleId;

            rules[ruleId] ={
                "id": res["id"],
                "rule": res["rule"],
                "tip": res["tip"],
                "weight": res["weight"],
                "results": [{
                    "file": res["file"],
                    "result": res["result"]
                }]
            };

            ruleId++;
        }

        //console.log("parser result: ", res);
    });


    parser.parse = function(comps, document){


        var parseComps = getParseComps(comps);


        var total_step = parseComps.length;

        parseComps.forEach(function(comp, current_step){

            parse(comp, document);

            parser.emit("progress",{
                'total_step': total_step,
                'current_step': current_step+1,
                'message':  "Parse "+ (comp.href ? comp.href : comp.type)
            });

        });

        parser.emit("end", rules );

    };

    return parser;

});
