define('style/style',function(require){

    var ruleset = require("style/ruleset");
    var parserlib = require("../../vendor/css-parser-lib/parserlib");

    function Style(comp, parserEmitter){
        this.content = comp["content"]||"";
        this.type = comp["type"];
        this.comp = comp;
        // css token stream
        this.tokenStream = new parserlib.css.TokenStream(this.content);
        // css parser
        this.parser = new parserlib.css.Parser({
            starHack: true,
            ieFilters: true
        });

        this.parserEmitter = parserEmitter;

        this.parse();
    }

    Style.prototype = {

        parse: function(){
            var that = this;
            Style.rules.forEach(function(rule){
                rule.call(that);
            });
            // parse
            try {
                this.parser.parse(that.content);
            } catch (ex){
                console.log("Parse error: " + ex.message, "error");
            }

            return this;

        }
    };

    Style.rules = [];

    Style.registRules = function(ruleset){

        for(var key in ruleset){

            if(ruleset.hasOwnProperty(key))
                Style.rules.push(ruleset[key]);
        }
    };


    Style.registRules(ruleset);


    return {
        Style : Style
    };

});