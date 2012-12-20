define('reporter',function(require, exports, module){
    var Handlebars = require('../vendor/handlebars/handlebars');
    var util = require('util');
    var EventEmitter = require("events").EventEmitter;
    var reporter = new EventEmitter();



    function computeRuleScore(results){
        var rules = results["rules"];

        rules.forEach(function(rule){
            var score = 100,
                ruleResults = rule["results"],
                weight = parseInt(rule["weight"], 10);

            for(var i= 0, l= ruleResults.length; i<l; i++){

                if(!ruleResults[i]["file"]["href"]){
                    ruleResults[i]["file"]["href"] = results['url'];
                }

                score -= (ruleResults[i]["result"].length * weight);
            }

            if(score<0) score = 0;
            rule["score"] = score;

        });

        return results;

    }

    function computeTotalScore(results){

        var rules = results["rules"];
        var total=0, totalWeight=0;
        rules.forEach(function(rule){
            var score = parseInt(rule["score"], 10),
                weight = parseInt(rule["weight"], 10);

            rule['grade'] = util.getGrade(score);

            total += weight * score;
            totalWeight += weight;
        });


        results["score"] =  (total / totalWeight).toFixed(0);
        results["grade"] =  util.getGrade(results["score"]);

        return results;
    }

    function filterEmptyResult(results){

        if(results['rules']){

            results['rules'].forEach(function(rule){

                if(rule['results']){
                    var results=[];
                    rule['results'].forEach(function(file){
                        if(!util.isEmpty(file['result'])){
                            results.push(file);
                        }
                    });

                    rule['results'] = results;


                }

            });

        }

    }

//    var results = {
//        "grade": "A",
//        "score" : 98,
//        "url" : "www.example.com",
//        "rules":[
//            {"id":"rule1","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule2","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule3","rule":"","grade":"A","results":[],"tip":""},
//            {"id":"rule4","rule":"","grade":"A","results":[],"tip":""}
//        ]
//    };
    function reportResults(results){

        // report results
        var gradeHeaderTemplate = $("#grade-header-template").html();
        var gradeSidebarTemplate = $("#grade-sidebar-template").html();
        var gradeContentTemplate = $("#grade-content-template").html();

        var output1 = Handlebars.compile(gradeHeaderTemplate)(results);
        var output2 = Handlebars.compile(gradeSidebarTemplate)(results);
        var output3 = Handlebars.compile(gradeContentTemplate)(results);

        $("#grade-header").html(output1);
        $("#grade-sidebar").html(output2);
        $("#grade-content").html(output3);



    }


    reporter.report = function (results){

        computeRuleScore(results);
        computeTotalScore(results);

        console.log("before filter results:",results);
        filterEmptyResult(results);

        console.log("report results:", results);
        reportResults(results);

        reporter.emit('end');

    };


    return reporter;


});