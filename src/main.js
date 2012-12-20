define(function(require, exports, module){
    var config = require("config");
    var sniffer = require("sniffer");
    var crawler = require("crawler");
    var parser = require("parser");
    var reporter = require("reporter");
    var statistics = require("statistics");
    var controller = require("chrome/controller");
    var util = require("util");

    // exports to events module
    require("events").setEmitter("sniffer", sniffer);
    require("events").setEmitter("crawler",crawler);
    require("events").setEmitter("parser",parser);
    require("events").setEmitter("reporter",reporter);

    //    {
    //        'total_step':7,
    //        'current_step':1,
    //        'message':'Finding documents'
    //    }
    sniffer.on("progress", function(msgObj){
        var progress = msgObj.current_step / msgObj.total_step * 100 + "%";
        $("#grade-progress-sniffer > div").css("width",progress);
        $("#grade-progress-sniffer-status").text(msgObj.message);
    });

    crawler.on("progress", function(msgObj){

        var progress = msgObj.current_step / msgObj.total_step * 100 + "%";
        $("#grade-progress-crawler > div").css("width",progress);
        $("#grade-progress-crawler-status").text(msgObj.message);
    });

    parser.on("progress", function(msgObj){
        var progress = msgObj.current_step / msgObj.total_step * 100 + "%";
        $("#grade-progress-parser > div").css("width",progress);
        $("#grade-progress-parser-status").text(msgObj.message);
    });

    statistics.on('progress', function(msgObj){
        var progress = msgObj.current_step / msgObj.total_step * 100 + "%";
        $("#stat-progress-chart > div").css("width",progress);
        $("#grade-progress-chart-status").text(msgObj.message);
    });

    //    {
    //        'message':err
    //    }
    sniffer.on("error", function(msgObj){
        console.log(msgObj);
    });

    sniffer.on('end',function(comps){
        console.log("sniffer end: ",  comps);
        crawler.crawl(comps);
    });

    reporter.on('end', function(){
        $("#grade-progress").toggleClass("hide");
        $("#grade-result").toggleClass("hide");
        $('#grade-sidebar a:first').tab('show');
    });

    statistics.on('end', function(){
        $("#stat-progress").toggleClass("hide");
        $("#stat-result").toggleClass("hide");
    });

    crawler.on("end", function(comps){
        console.log("crawler end: ", comps);
        // start parse
        parser.parse(comps, sniffer.document);
        // start statistic
        statistics.stat(comps, sniffer.document);

    });

    parser.on("end", function(rules){

        var results = {
            "rules": rules,
            "url": sniffer.url
        };

        reporter.report(results);


    });


    $("#run").click(function(){

        $("#tab-grade").tab('show');
        controller.run();

    });


});