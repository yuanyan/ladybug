define('html5ruleset',function(){

    return {

        useHtml5DoctypeRule: function () {

            var parserEmitter = this.parserEmitter,
                file = this.comp,
                result = [],
                weight = 2;

            // via https://gist.github.com/773044
            function getDocType() {
                var node = document.firstChild;
                while (node) {
                    var nodeType = node.nodeType;
                    if (nodeType === 10) {
                        // doctype
                        var doctype = '<!DOCTYPE ' + (document.documentElement.tagName || 'html').toLowerCase();
                        if (node.publicId) {
                            doctype += ' PUBLIC "' + node.publicId + '"';
                        }
                        if (node.systemId) {
                            doctype += ' "' + node.systemId + '"';
                        }
                        return doctype + '>';
                    }
                    if (nodeType === 8 && ("" + node.nodeValue).toLowerCase().indexOf("doctype") === 0) {
                        // IE represents DocType as comment
                        return '<!' + node.nodeValue + '>';
                    }
                    node = node.nextSibling;
                }
                return "empty";
            }

            var dt = getDocType() ;
            if (getDocType().toLowerCase() !== '<!doctype html>') {

                var res = {
                    text: 'Current doctype declaration is '+ dt
                };

                result.push(res);

            }

            parserEmitter.emit('result', {
                'rule':'Use HTML5 Doctype',
                'file':file,
                'result':result,
                'weight':weight,
                'tip':'Using HTML5 doctyle declaration(<!DOCTYPE html>) saves some bytes and increases parsing speed.'
            });

        }


    };

});