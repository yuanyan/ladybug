define('html/html',function(require){
    var ruleset = require("html/ruleset");

    function HTML(comp, parserEmitter, document){
        this.content = comp["content"];
        this.type = comp["type"];
        this.comp = comp;
        this.document = document;
        this.parserEmitter = parserEmitter;
        this.parse();
    }


    HTML.prototype = {

        parse: function(){
            var that = this;
            HTML.rules.forEach(function(rule){
                rule.call(that);
            });

            return this;

        }
    };

    HTML.rules = [];
    HTML.registRules = function(ruleset){

        for(var key in ruleset){

            if(ruleset.hasOwnProperty(key))
                HTML.rules.push(ruleset[key]);
        }

    };

    HTML.registRules(ruleset);

    return {
        HTML : HTML
    };
});
