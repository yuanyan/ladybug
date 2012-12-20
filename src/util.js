define("util",function(require){

    var config = require("config");

    return {

        isEmpty: function(value) {
            if (typeof value === "undefined") {
                return true;
            } else if (value === null) {
                return true;
            } else if (value === false) {
                return true;
            } else if(Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
                return true;
            } else {
                return false;
            }
        },

        isFunction : function(obj){
            return typeof obj === "function";
            //toString.call(obj)=="[object Function]"
        },

        isString: function(obj){
            //当obj通过 new String 封装类构造时   typeof obj === "object"
            return typeof obj === "string"||obj instanceof String;

            //toString.call(obj)==="[object String]"
        },

        toArray:  function(obj,opt_start,opt_end){
            //the null and ndefined return empty array
            if (obj === null || obj === undefined) return [];

            var len = obj.length;

            //convert other object, but the strings and functions also have 'length' property
            if (typeof len !== 'number' || this.isString(obj) || this.isFunction(obj)) {
                return [obj];
            }

            var start= opt_start || 0, end = opt_end || len;

            // ie 6/7/8 不支持用 slice 转换 NodeList(IE 9 支持), 降级到普通方法
            // In Internet Explorer it throws an error that it can't run Array.prototype.slice.call(nodes)
            // because a DOM NodeList is not a JavaScript object.
            if (obj.item && document.attachEvent) {
                var ret = [];
                for (var i = 0; i < len; ++i) {
                    ret[i] = obj[i];
                }
                return ret.slice(start , end);
            }

            // other array-like object
            return Array.prototype.slice.call(obj, start, end);

        },

        // https://github.com/documentcloud/underscore/blob/master/underscore.js
        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        range : function(start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;

            var len = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(len);

            while(idx < len) {
                range[idx++] = start;
                start += step;
            }

            return range;
        },
        // make array
        fill: function (howMany, value){
            var output = [];
            while(howMany--){
                output.push(value);
            }
            return output;
        },

        /**
         * merges two objects together, the properties of the second
         * overwrite the properties of the first
         *
         * @param {Object} a Object a
         * @param {Object} b Object b
         * @return {Object} A new object, result of the merge
         */
        merge: function (a, b) {
            var i, o = {};

            for (i in a) {
                if (a.hasOwnProperty(i)) {
                    o[i] = a[i];
                }
            }
            for (i in b) {
                if (b.hasOwnProperty(i)) {
                    o[i] = b[i];
                }
            }
            return o;

        },


        benchmark: function (method, times, scope) {

            var time = function (scope) {
                time.scope = time.scope || {};
                if (time.scope[scope]) {
                    var duration = (new Date()).getTime() - time.scope[scope];
                    time.scope[scope] = null;
                    return duration / 1000;
                } else {
                    time.scope[scope] = (new Date()).getTime();
                    return null;
                }
            };


            var i = times || 1000;
            time(scope || 'benchmark');
            while (i--) method();
            return time(scope || 'benchmark') / times;
        },


        /**
         * Dumps debug information in FB console, Error console or alert
         *
         * @param {Object} what Object to dump
         */
        dump: function () {
            var args;

            // skip when debbuging is disabled
            if (!config.debug) {
                return;
            }

            // get arguments and normalize single parameter
            args = Array.prototype.slice.apply(arguments);
            args = args && args.length === 1 ? args[0] : args;

            try {
                if (typeof Firebug !== 'undefined' && Firebug.Console && Firebug.Console.log) { // Firebug
                    Firebug.Console.log(args);
                } else if (typeof Components !== 'undefined' && Components.classes && Components.interfaces) { // Firefox
                    Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService).logStringMessage(JSON.stringify(args, null, 2));
                }
            } catch (e1) {
                try {
                    console.log(args);
                } catch (e2) {
                    // alert shouldn't be used due to its annoying modal behavior
                }
            }
        },

        /**
         * Filters an object/hash using a callback
         *
         * The callback function will be passed two params - a key and a value of each element
         * It should return TRUE is the element is to be kept, FALSE otherwise
         *
         * @param {Object} hash Object to be filtered
         * @param {Function} callback A callback function
         * @param {Boolean} rekey TRUE to return a new array, FALSE to return an object and keep the keys/properties
         */
        filter: function (hash, callback, rekey) {
            var i,
                result = rekey ? [] : {};

            for (i in hash) {
                if (hash.hasOwnProperty(i) && callback(i, hash[i])) {
                    result[rekey ? result.length : i] = hash[i];
                }
            }

            return result;
        },



        /**
         * Produces nicer sentences accounting for single/plural occurences.
         *
         * For example: "There are 3 scripts" vs "There is 1 script".
         * Currently supported tags to be replaced are:
         * %are%, %s% and %num%
         *
         *
         * @param {String} template A template with tags, like "There %are% %num% script%s%"
         * @param {Integer} num An integer value that replaces %num% and also deternmines how the other tags will be replaced
         * @return {String} The text after substitution
         */
        plural: function (template, number) {
            var i,
                res = template,
                repl = {
                    are: ['are', 'is'],
                    s: ['s', ''],
                    'do': ['do', 'does'],
                    num: [number, number]
                };


            for (i in repl) {
                if (repl.hasOwnProperty(i)) {
                    res = res.replace(new RegExp('%' + i + '%', 'gm'), (number === 1) ? repl[i][1] : repl[i][0]);
                }
            }

            return res;
        },



        /**
         * Returns the hostname (domain) for a given URL
         *
         * @param {String} url The absolute URL to get hostname from
         * @return {String} The hostname
         */
        getHostname: function (url) {
            var hostname = url.split('/')[2];

            return (hostname && hostname.split(':')[0]) || '';
        },

        /**
         * Returns an array of unique domain names, based on a given array of components
         *
         * @param {Array} comps An array of components (not a @see ComponentSet)
         * @param {Boolean} exclude_ips Whether to exclude IP addresses from the list of domains (for DNS check purposes)
         * @return {Array} An array of unique domian names
         */
        getUniqueDomains: function (comps, exclude_ips) {
            var i, len, parts,
                domains = {},
                retval = [];

            for (i = 0, len = comps.length; i < len; i += 1) {
                parts = comps[i].url.split('/');
                if (parts[2]) {
                    // add to hash, but remove port number first
                    domains[parts[2].split(':')[0]] = 1;
                }
            }

            for (i in domains) {
                if (domains.hasOwnProperty(i)) {
                    if (!exclude_ips) {
                        retval.push(i);
                    } else {
                        // exclude ips, identify them by the pattern "what.e.v.e.r.[number]"
                        parts = i.split('.');
                        if (isNaN(parseInt(parts[parts.length - 1], 10))) {
                            // the last part is "com" or something that is NaN
                            retval.push(i);
                        }
                    }
                }
            }

            return retval;
        },



        /**
         * Get internal component type from passed mime type.
         * @param {String} content_type mime type of the content.
         * @return yslow internal component type
         * @type String
         */
        getComponentType: function (content_type) {
            var c_type = 'unknown';

            if (content_type && typeof content_type === "string") {
                if (content_type === "text/html" || content_type === "text/plain") {
                    c_type = 'doc';
                } else if (content_type === "text/css") {
                    c_type = 'externalstyle';
                } else if (/javascript/.test(content_type)) {
                    c_type = 'externalscript';
                } else if (/flash/.test(content_type)) {
                    c_type = 'flash';
                } else if (/image/.test(content_type)) {
                    c_type = 'image';
                } else if (/font/.test(content_type)) {
                    c_type = 'font';
                }
            }

            return c_type;
        },

        /**
         * base64 encode the data. This works with data that fails win.atob.
         * @param {bytes} data data to be encoded.
         * @return bytes array of data base64 encoded.
         */
        base64Encode: function (data) {
            var i, a, b, c, new_data = '',
                padding = 0,
                arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'];

            for (i = 0; i < data.length; i += 3) {
                a = data.charCodeAt(i);
                if ((i + 1) < data.length) {
                    b = data.charCodeAt(i + 1);
                } else {
                    b = 0;
                    padding += 1;
                }
                if ((i + 2) < data.length) {
                    c = data.charCodeAt(i + 2);
                } else {
                    c = 0;
                    padding += 1;
                }

                new_data += arr[(a & 0xfc) >> 2];
                new_data += arr[((a & 0x03) << 4) | ((b & 0xf0) >> 4)];
                if (padding > 0) {
                    new_data += "=";
                } else {
                    new_data += arr[((b & 0x0f) << 2) | ((c & 0xc0) >> 6)];
                }
                if (padding > 1) {
                    new_data += "=";
                } else {
                    new_data += arr[(c & 0x3f)];
                }
            }

            return new_data;
        },

        /**
         * Creates x-browser XHR objects
         *
         * @return {XMLHTTPRequest} A new XHR object
         */
        getXHR: function () {
            var i = 0,
                xhr = null,
                ids = ['MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];


            if (typeof XMLHttpRequest === 'function') {
                return new XMLHttpRequest();
            }

            for (i = 0; i < ids.length; i += 1) {
                try {
                    xhr = new ActiveXObject(ids[i]);
                    break;
                } catch (e) {}

            }

            return xhr;
        },

        /**
         * Returns the computed style
         * @param {HTMLElement} el A node
         * @param {String} st Style identifier, e.g. "backgroundImage"
         * @param {Boolean} get_url Whether to return a url
         * @return {String|Boolean} The value of the computed style, FALSE if get_url is TRUE and the style is not a URL
         */
        getComputedStyle: function (el, st, get_url) {
            var style,
                res = '';

            if (el.currentStyle) {
                res = el.currentStyle[st];
            }

            if (el.ownerDocument && el.ownerDocument.defaultView && document.defaultView.getComputedStyle) {
                style = el.ownerDocument.defaultView.getComputedStyle(el, '');
                if (style) {
                    res = style[st];
                }
            }

            if (!get_url) {
                return res;
            }

            if (typeof res !== 'string' || res.indexOf('url(') !== 0) {
                return false;
            }

            res = res.replace(/url\(/, '');
            res = res.substr(0, res.lastIndexOf(')'));
            if (res.indexOf('"') === 0) {
                res = res.substr(1, res.length - 2);
            }

            return res;
        },

        /**
         * escape '<' and '>' in the passed html code.
         * @param {String} html code to be escaped.
         * @return escaped html code
         * @type String
         */
        escapeHtml: function (html) {
            return (html || '').toString()
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        },

        /**
         * escape quotes in the passed html code.
         * @param {String} str string to be escaped.
         * @param {String} which type of quote to be escaped. 'single' or 'double'
         * @return escaped string code
         * @type String
         */
        escapeQuotes: function (str, which) {
            if (which === 'single') {
                return str.replace(/\'/g, '\\\''); // '
            }
            if (which === 'double') {
                return str.replace(/\"/g, '\\\"'); // "
            }
            return str.replace(/\'/g, '\\\'').replace(/\"/g, '\\\"'); // ' and "
        },

        /**
         * Math mod method.
         * @param {Number} divisee
         * @param {Number} base
         * @return mod result
         * @type Number
         */
        mod: function (divisee, base) {
            return Math.round(divisee - (Math.floor(divisee / base) * base));
        },

        /**
         * Abbreviate the passed url to not exceed maxchars.
         * (Just display the hostname and first few chars after the last slash.
         * @param {String} url originial url
         * @param {Number} maxchars max. number of characters in the result string.
         * @return abbreviated url
         * @type String
         */
        briefUrl: function (url, maxchars) {
            var iDoubleSlash, iQMark, iFirstSlash, iLastSlash;

            maxchars = maxchars || 100; // default 100 characters
            if (url === undefined) {
                return '';
            }

            // We assume it's a full URL.
            iDoubleSlash = url.indexOf("//");
            if (-1 !== iDoubleSlash) {

                // remove query string
                iQMark = url.indexOf("?");
                if (-1 !== iQMark) {
                    url = url.substring(0, iQMark) + "?...";
                }

                if (url.length > maxchars) {
                    iFirstSlash = url.indexOf("/", iDoubleSlash + 2);
                    iLastSlash = url.lastIndexOf("/");
                    if (-1 !== iFirstSlash && -1 !== iLastSlash && iFirstSlash !== iLastSlash) {
                        url = url.substring(0, iFirstSlash + 1) + "..." + url.substring(iLastSlash);
                    } else {
                        url = url.substring(0, maxchars + 1) + "...";
                    }
                }
            }

            return url;
        },



        /**
         * Convert a number of bytes into a readable KB size string.
         * @param {Number} size
         * @return readable KB size string
         * @type String
         */
        kbSize: function (size) {
            var remainder = size % (size > 100 ? 100 : 10);
            size -= remainder;
            return parseFloat(size / 1000) + (0 === (size % 1000) ? ".0" : "") + "K";
        },

        /**
         * @final
         */
        prettyTypes: {
            "image": "Image",
            "doc": "HTML/Text",
            "cssimage": "CSS Image",
            "externalstyle": "Stylesheet File",
            "externalscript": "JavaScript File",
            "flash": "Flash Object",
            "iframe": "IFrame",
            "xhr": "XMLHttpRequest",
            "redirect": "Redirect",
            "favicon": "Favicon",
            "unknown": "Unknown"
        },

        /*
         *  Convert a type (eg, "cssimage") to a prettier name (eg, "CSS Images").
         * @param {String} sType component type
         * @return display name of component type
         * @type String
         */
        prettyType:function (sType) {
            return this.prettyTypes[sType];
        },

        getGrade:function (score) {
            var letter = 'F';

            if (!parseInt(score, 10) && score !== 0) {
                return score;
            }
            if (score === -1) {
                return 'N/A';
            }

            if (score >= 90) {
                letter = 'A';
            } else if (score >= 80) {
                letter = 'B';
            } else if (score >= 70) {
                letter = 'C';
            } else if (score >= 60) {
                letter = 'D';
            } else if (score >= 50) {
                letter = 'E';
            } else if (score >= 40) {
                letter = 'G';
            }

            return letter;
        },

        /**
         * Make absolute url.
         * @param url
         * @param base href
         * @return absolute url built with base href.
         */
        makeAbsoluteUrl: function (url, baseHref) {
            var hostIndex, path, lpath, protocol;

            if (typeof url === 'string' && baseHref) {
                hostIndex = baseHref.indexOf('://');
                protocol = baseHref.slice(0, 4);
                if (url.indexOf('://') < 0 && (protocol === 'http' ||
                    protocol === 'file')) {
                    // This is a relative url
                    if (url.slice(0, 1) === '/') {
                        // absolute path
                        path = baseHref.indexOf('/', hostIndex + 3);
                        if (path > -1) {
                            url = baseHref.slice(0, path) + url;
                        } else {
                            url = baseHref + url;
                        }
                    } else {
                        // relative path
                        lpath = baseHref.lastIndexOf('/');
                        if (lpath > hostIndex + 3) {
                            url = baseHref.slice(0, lpath + 1) + url;
                        } else {
                            url = baseHref + '/' + url;
                        }
                    }
                }
            }

            return url;
        },


        /**
         * identifies injected elements (js, css, iframe, flash, image)
         * @param doc the document to create/manipulate dom elements
         * @param comps the component set components
         * @param body the root (raw) document body (html)
         * @return the same components with injected info
         */
        setInjected: function (doc, comps, body) {
            var i, len, els, el, src, comp, found, div,
                nodes = {};

            if (!body) {
                return comps;
            }

            // har uses a temp div already, reuse it
            if (typeof doc.createElement === 'function') {
                div = doc.createElement('div');
                div.innerHTML = body;
            } else {
                div = doc;
            }

            // js
            els = div.getElementsByTagName('script');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.src || el.getAttribute('src');
                if (src) {
                    nodes[src] = {
                        defer: el.defer || el.getAttribute('defer'),
                        async: el.async || el.getAttribute('async')
                    };
                }
            }

            // css
            els = div.getElementsByTagName('link');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.href || el.getAttribute('href');
                if (src && (el.rel === 'stylesheet' || el.type === 'text/css')) {
                    nodes[src] = 1;
                }
            }

            // iframe
            els = div.getElementsByTagName('iframe');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.src || el.getAttribute('src');
                if (src) {
                    nodes[src] = 1;
                }
            }

            // flash
            els = div.getElementsByTagName('embed');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.src || el.getAttribute('src');
                if (src) {
                    nodes[src] = 1;
                }
            }
            els = div.getElementsByTagName('param');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.value || el.getAttribute('value');
                if (src) {
                    nodes[src] = 1;
                }
            }

            // image
            els = div.getElementsByTagName('img');
            for (i = 0, len = els.length; i < len; i += 1) {
                el = els[i];
                src = el.src || el.getAttribute('src');
                if (src) {
                    nodes[src] = 1;
                }
            }

            // loop components and look it up on nodes
            // if not found then component was injected
            // for js, set defer and async attributes
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                if (comp.type === 'js' || comp.type === 'css' ||
                    comp.type === 'flash' || comp.type === 'flash' ||
                    comp.type === 'image') {
                    found = nodes[comp.url];
                    comp.injected = !found;
                    if (comp.type === 'js' && found) {
                        comp.defer = found.defer;
                        comp.async = found.async;
                    }
                }
            }

            return comps;
        },


        /**
         * Given CSS Lint results for a file, return output for this format.
         * @param results {Object} with error and warning messages
         * @param filename {String} relative file path
         * @param options {Object} (Optional) specifies special handling of output
         * @return {String} output for results
         */
        formatResults: function(results, filename, options) {
            var messages = results.messages,
                output = "";
            options = options || {};

            if (messages.length === 0) {
                return options.quiet ? "" : "\n\nNo errors in " + filename + ".";
            }

            output = "\n\nThere are " + messages.length  +  " problems in " + filename + ".";
            var pos = filename.lastIndexOf("/"),
                shortFilename = filename;

            if (pos === -1){
                pos = filename.lastIndexOf("\\");
            }
            if (pos > -1){
                shortFilename = filename.substring(pos+1);
            }

            messages.forEach(function (message, i) {
                output = output + "\n\n" + shortFilename;
                if (message.rollup) {
                    output += "\n" + (i+1) + ": " + message.type;
                    output += "\n" + message.message;
                } else {
                    output += "\n" + (i+1) + ": " + message.type + " at line " + message.line + ", col " + message.col;
                    output += "\n" + message.message;
                    output += "\n" + message.evidence;
                }
            });

            return output;
        },

        /**
         * Checks if a given piece of text (sctipt, stylesheet) is minified.
         *
         * The logic is: we strip consecutive spaces, tabs and new lines and
         * if this improves the size by more that 20%, this means there's room for improvement.
         *
         * @param {String} contents The text to be checked for minification
         * @return {Boolean} TRUE if minified, FALSE otherwise
         */
        isMinified: function (content) {
            var striplen,
                len = content.length;

            if (len === 0) { // blank is as minified as can be
                return true;
            }

            // TODO: enhance minifier logic by adding comment checking: \/\/[\w\d \t]*|\/\*[\s\S]*?\*\/
            // even better: add jsmin/cssmin
            striplen = content.replace(/\n| {2}|\t|\r/g, '').length; // poor man's minifier
            if (((len - striplen) / len) > 0.2) { // we saved 20%, so this component can get some mifinication done
                return false;
            }

            return true;
        }
    };

});