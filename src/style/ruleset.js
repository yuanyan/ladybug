define(function (require) {

    return {
        avoidAtImportRule: function () {
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            parser.addListener("import", function(event){
                var res = {
                    col: event.col,
                    line: event.line,
                    text: "@import url('" + event.uri + "')"
                };

                result.push(res);
            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid @Import',
                    'file': that.comp,
                    'result': result,
                    'weight': 6,
                    'tip': 'Using @import in a style element will impact rendering performance. Use the &lt;link&gt; tag instead. '
                });

            });



        },

        avoidBoxShadowRule: function () {
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];


            parser.addListener("property", function(event){

                var name = event.property.text,
                    value = event.value;

                if (name.toLowerCase().indexOf('webkit-box-shadow') != '-1'){

                    // TODO
                    var res = {
                        col: event.col,
                        line: event.line,
                        text: name + ":" + value
                    };

                    result.push(res);
                    //console.log(event);
                }

            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Box-shadow Propery',
                    'file': that.comp,
                    'result': result,
                    'weight': 1,
                    'tip': 'Using the box-shadow property can introduce serious scroll & resize lag in the browser. Consider replacing with border-image or reducing the number of elements with shadows'
                });

            });


        },


        avoidUniversalSelector: function(){
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            parser.addListener("startrule", function(event){
                var selectors = event.selectors,
                    selector,
                    part,
                    i;

                for (i=0; i < selectors.length; i++){
                    selector = selectors[i];

                    part = selector.parts[selector.parts.length-1];
                    if (part.elementName == "*"){
                        // reporter.report(rule.desc, part.line, part.col, rule);

                        var res = {
                            col: event.col,
                            line: event.line,
                            text: selector.text
                        };

                        result.push(res);

                    }
                }
            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Universal Selector',
                    'file': that.comp,
                    'result': result,
                    'weight': 2,
                    'tip': 'The universal selector (`*`) matches all elements,' +
                        'it causes performance issues when used as the key part (far-right) of a selector'
                });

            });



        },


        avoidUnqualifiedAttributeSelector: function(){
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            parser.addListener("startrule", function(event){

                var selectors = event.selectors,
                    selector,
                    part,
                    modifier,
                    i, j, k;

                for (i=0; i < selectors.length; i++){
                    selector = selectors[i];

                    part = selector.parts[selector.parts.length-1];
                    if (part.type == parser.SELECTOR_PART_TYPE){
                        for (k=0; k < part.modifiers.length; k++){
                            modifier = part.modifiers[k];
                            if (modifier.type == "attribute" && (!part.elementName || part.elementName == "*")){
                                //reporter.report(rule.desc, part.line, part.col, rule);
                                var res = {
                                    col: event.col,
                                    line: event.line,
                                    text: selector.text
                                };

                                result.push(res);
                            }
                        }
                    }

                }
            });


            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Unqualified Attribute Selector',
                    'file': that.comp,
                    'result': result,
                    'weight': 3,
                    'tip': 'Unqualified attribute selectors, such as [type=text], match all elements first and then check their attributes. ' +
                        'This means unqualified attribute selectors have the same performance characteristics as the universal selector (*). '
                });

            });
        },

        avoidComplexAttributeSelector: function(){
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            parser.addListener("startrule", function(event){
                var selectors = event.selectors,
                    selector,
                    part,
                    modifier,
                    i, j, k;

                for (i=0; i < selectors.length; i++){
                    selector = selectors[i];
                    for (j=0; j < selector.parts.length; j++){
                        part = selector.parts[j];
                        if (part.type == parser.SELECTOR_PART_TYPE){
                            for (k=0; k < part.modifiers.length; k++){
                                modifier = part.modifiers[k];
                                if (modifier.type == "attribute"){
                                    if (/([\~\|\^\$\*]=)/.test(modifier)){
                                        //reporter.report("Attribute selectors with " + RegExp.$1 + " are slow!", modifier.line, modifier.col, rule);

                                        var res = {
                                            col: event.col,
                                            line: event.line,
                                            text: selector.text
                                        };

                                        result.push(res);
                                    }
                                }

                            }
                        }
                    }
                }
            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Complex Attribute Selector',
                    'file': that.comp,
                    'result': result,
                    'weight': 2,
                    'tip': 'Complex attribute selectors that allow you to perform regular expression matches on attribute values, ' +
                        'but as regular expression matching like *=, |=, ^=, $=, or ~= is slower than simple class-based matching.'
                });

            });
        },


        avoidWebfontRule:function () {
            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            parser.addListener("startfontface", function(event){
                // TODO
                var res = {
                    col: event.col,
                    line: event.line,
                    text: "@font-face"
                };

                result.push(res);
            });


            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Web Font',
                    'file': that.comp,
                    'result': result,
                    'weight': 4,
                    'tip': "Using web fonts comes with performance implications as font files can be quite large and some browsers block rendering while downloading them."
                });

            });

        },



        /**
         * Counts the number of expression in a given piece of stylesheet.
         *
         * Expressions are identified by the presence of the literal string "expression(".
         * There could be false positives in commented out styles.
         *
         * @param {String} content Text to inspect for the presence of expressions
         * @return {Integer} The number of expressions in the text
         */
        avoidCSSExpression:function () {

            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];


            parser.addListener("property", function(event){

                var name = event.property.text,
                    value = event.value.text;

                if (value.toLowerCase().indexOf("expression(") != '-1'){

                    var res = {
                        col: event.col,
                        line: event.line,
                        text: name + ":" + value
                    };

                    result.push(res);

                }

            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid CSS Expression',
                    'file': that.comp,
                    'result': result,
                    'weight': 6,
                    'tip': 'CSS expressions are supported in Internet Explorer, ' +
                        'the problem with expressions is that they are evaluated more frequently than most people expect. ' +
                        'Not only are they evaluated when the page is rendered and resized, ' +
                        'but also when the page is scrolled and even when the user moves the mouse over the page.'
                });

            });

        },

        /**
         * Counts the number of AlphaImageLoader filter in a given piece of stylesheet.
         *
         * AlphaImageLoader filters are identified by the presence of the literal string "filter:" and
         * "AlphaImageLoader" .
         * There could be false positives in commented out styles.
         *
         * @param {String} content Text to inspect for the presence of filters
         * @return {Hash} 'filter type' => count. For Example, {'_filter' : count }
         */
        avoidAlphaImageLoaderFilter:function () {

            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];


            parser.addListener("property", function(event){

                var name = event.property.text,
                    value = event.value.text;

                // filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/workshop/graphics/earglobe.gif', sizingMethod='scale');
                if ( name.toLowerCase().indexOf('filter') !== -1  && value.indexOf("AlphaImageLoader") !== -1){
                    // TODO

                    var res = {
                        col: event.col,
                        line: event.line,
                        text: name + ":" + value
                    };

                    result.push(res);
                }

            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid AlphaImageLoader Filter',
                    'file': that.comp,
                    'result': result,
                    'weight': 6,
                    'tip': 'The IE-proprietary AlphaImageLoader filter aims to fix a problem with semi-transparent true color PNGs in IE versions < 7. ' +
                        'The problem with this filter is that it blocks rendering and freezes the browser while the image is being downloaded. ' +
                        'It also increases memory consumption and is applied per element, not per image, so the problem is multiplied.' +
                        'The best approach is to avoid AlphaImageLoader completely and use gracefully degrading PNG8 instead, ' +
                        'which are fine in IE. If you absolutely need AlphaImageLoader, use the underscore hack _filter as to not penalize your IE7+ users.'
                });

            });


        },

        avoidManyBackgroundImages: function(){

            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];


            parser.addListener("property", function(event){

                var name = event.property.text.toLowerCase(),
                    value = event.value.text;

                // except background‐image: url("data:image/png;base64,iVBORw0KG...");
                if ( (name == 'background' || name == "background-image") && value.indexOf("url(") !== -1 && value.indexOf("data:image/") === -1 ){
                    // TODO

                    var res = {
                        col: event.col,
                        line: event.line,
                        text: name + ":" + value
                    };

                    result.push(res);

                }

            });

            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Many Background Images',
                    'file': that.comp,
                    'result': result,
                    'weight': 2,
                    'tip': 'Try to combining images in a sprite.'
                });

            });

        },


        avoidUnusedSelectorsRule:function () {

            var parserEmitter = this.parserEmitter,
                parser = this.parser,
                that = this,
                result = [];

            function find(selector) {

                //try/catch is used because querySelectorAll throws errors when syntactically invalid selectors are passed through. Useful for detection purposes.
                try {
                    //returns true if selector found on page, false if not
                    if ($(selector).length > 0) {
                        return true;
                    }
                } catch (err) {
                    return 'broken_selector';
                }

                //detect if the selector includes a pseudo-class, i.e. :active, :focus
                var parse = selector.match(/\:+[\w-]+/gi);
                if (parse !== null && parse.hasOwnProperty('length') && parse.length > 0) {
                    return 'pseudo_class';
                } else {
                    return false;
                }

            }

            parser.addListener("startrule", function(event){
                var selectors = event.selectors,
                    selector,
                    part,
                    modifier,
                    i, j, k;

                for (i=0; i < selectors.length; i++){
                    selector = selectors[i];
                    // TODO
                    if(!find(selector.text)){

                        var res = {
                            col: event.col,
                            line: event.line,
                            text: selector.text
                        };

                        result.push(res);
                    }

                }
            });


            parser.addListener("endstylesheet", function(){

                parserEmitter.emit('result',{
                    'rule': 'Avoid Unused Selectors',
                    'file': that.comp,
                    'result': result,
                    'weight': 1,
                    'tip': 'Remove unused selectors.'
                });

            });

        }

    };


});