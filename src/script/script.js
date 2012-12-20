define('script/script',function(require){
    var ruleset = require("script/ruleset");

    function Script(comp, parserEmitter){

        this.content = comp["content"]||"";
        this.type = comp["type"];
        this.comp = comp;
        this.parserEmitter = parserEmitter;
        this.parse();

    }

    Script.prototype = {


        parse: function(){
            var that = this;
            Script.rules.forEach(function(rule){
                rule.call(that, that.content, that.type);
            });

            return this;

        }
    };

    Script.rules = [];

    Script.registRules =  function(ruleset){

        for(var key in ruleset){

            if(ruleset.hasOwnProperty(key))
                Script.rules.push(ruleset[key]);
        }

    };

    Script.registRules(ruleset);

    return {
      Script : Script
    };
});
