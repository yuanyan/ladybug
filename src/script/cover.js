define(function(require, exports, module){

    var injector = require('./injector');
    var vm = require('./vm');
    var EventEmitter = require('../events').EventEmitter;

    module.exports = function (source) {
        var c = new Cover();
        if (source) c.include(source);

        var coverageData = {};

        c.on('node', function (node) {
            if (!coverageData[node.id]) {
                coverageData[node.id] = { times : 0, node : node };
            }
            coverageData[node.id].times++;
        });

        c.run();

        return coverageData;
    };

    function Cover () {
        this.sources = [];
        this.nodes = [];

        this.names = {
            call : injector.generateName(6),
            expr : injector.generateName(6),
            stat : injector.generateName(6)
        };
    }

    Cover.prototype = new EventEmitter;

    Cover.prototype.include = function (src) {
        this.sources.push(src);
        this.source = null;
        return this;
    };

    Cover.prototype.compile = function () {
        var src = this.sources.join('\n');
        var nodes = this.nodes;
        var names = this.names;

        return injector(src, function (node) {
            var i = nodes.length;

            if (node.name === 'call') {
                nodes.push(node);
                node.wrap(names.call + '(' + i + ')(%s)');
            }
            else if (node.name === 'stat' || node.name === 'throw'
                || node.name === 'var') {
                nodes.push(node);
                node.wrap('{' + names.stat + '(' + i + ');%s}');
                //node.wrap(names.stat + '(' + i + ');%s');
            }
            else if (node.name === 'binary') {
                nodes.push(node);
                node.wrap(names.expr + '(' + i + ')(%s)');
            }
            else if (node.name === 'unary-postfix' || node.name === 'unary-prefix') {
                nodes.push(node);
                node.wrap(names.expr + '(' + i + ')(%s)');
            }

            if (i !== nodes.length) {
                node.id = i;
            }
        });
    };

    Cover.prototype.assign = function (context) {
        if (!context) context = {};

        var self = this;
        var stack = [];

        context[self.names.call] = function (i) {
            var node = self.nodes[i];
            stack.unshift(node);
            self.emit('node', node, stack);

            return function (expr) {
                stack.shift();
                return expr;
            };
        };

        context[self.names.expr] = function (i) {
            var node = self.nodes[i];
            self.emit('node', node, stack);

            return function (expr) {
                return expr;
            };
        };

        context[self.names.stat] = function (i) {
            var node = self.nodes[i];
            self.emit('node', node, stack);
        };

        return context;
    };

    Cover.prototype.run = function (context) {
        var src = this.compile();
        vm.runInNewContext(src, this.assign(context));

//        this.assign(window);
//        var pre= document.createElement('script');
//        pre.innerHTML = src;
//        document.body.appendChild(pre);

        return this;
    };

});