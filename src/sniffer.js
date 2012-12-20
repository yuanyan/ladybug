/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

define("sniffer",function (require) {

    var util = require("util");
    var EventEmitter = require("events").EventEmitter;
    var sniffer = new EventEmitter();


    /**
     * @final
     */
    var types = ['html', 'inlinescript', 'externalscript','inlinestyle', 'externalstyle','iframe', 'flash', 'cssimage', 'image',
        'favicon', 'xhr', 'redirect', 'font'];

    var NODETYPE = {
        ELEMENT:1,
        DOCUMENT:9
    };

    /*
     * http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSRule
     */
    var CSSRULE = {
        IMPORT_RULE:3,
        FONT_FACE_RULE:5
    };


    /**
     * @private
     * Finds all frames/iframes recursively
     * @param {DOMElement} node object
     * @return an array of documents in the passed DOM node.
     * @type Array
     */
    function findDocuments(node) {
        var frames, doc, docUrl, type, i, len, el, frameDocs, parentDoc,
            allDocs = {};

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':1,
            'message':'Sniff Documents'
        });

        if (!node) {
            return null;
        }

        type = 'html';
        if (node.nodeType === NODETYPE.DOCUMENT) {
            // Document node
            doc = node;
            docUrl = node.URL;
        } else if (node.nodeType === NODETYPE.ELEMENT &&
            node.nodeName.toLowerCase() === 'frame') {
            // Frame node
            doc = node.contentDocument;
            docUrl = node.src;
        } else if (node.nodeType === NODETYPE.ELEMENT &&
            node.nodeName.toLowerCase() === 'iframe') {
            doc = node.contentDocument;
            docUrl = node.src;
            type = 'iframe';
            try {
                parentDoc = node.contentWindow;
                parentDoc = parentDoc && parentDoc.parent;
                parentDoc = parentDoc && parentDoc.document;
                parentDoc = parentDoc || node.ownerDocument;
                if (parentDoc && parentDoc.URL === docUrl) {
                    // check attribute
                    docUrl = !node.getAttribute('src') ? '' : 'about:blank';
                }
            } catch (err) {
                util.dump(err);
            }
        } else {
            return allDocs;
        }
        allDocs[docUrl] = {
            'document':doc,
            'type':type
        };

        try {
            frames = doc.getElementsByTagName('iframe');
            for (i = 0, len = frames.length; i < len; i += 1) {
                el = frames[i];
                if (el.src) {
                    frameDocs = findDocuments(el);
                    if (frameDocs) {
                        allDocs = util.merge(allDocs, frameDocs);
                    }
                }
            }

            frames = doc.getElementsByTagName('frame');
            for (i = 0, len = frames.length; i < len; i += 1) {
                el = frames[i];
                frameDocs = findDocuments(el);
                if (frameDocs) {
                    allDocs = util.merge(allDocs, frameDocs);
                }
            }
        } catch (e) {
            util.dump(e);
        }

        return allDocs;
    }

    /**
     * @private
     * Find all components in the passed node.
     * @param {DOMElement} node DOM object
     * @param {String} doc_location document.location
     * @param {String} baseHref href
     * @return array of object (array[] = {'type': object.type, 'href': object.href } )
     * @type Array
     */
    function findComponentsInNode(node, baseHref, type) {
        var comps = [];

        try {
            comps = findStyleSheets(node, baseHref);
        } catch (e1) {
            util.dump(e1);
        }
        try {
            comps = comps.concat(findScripts(node));
        } catch (e2) {
            util.dump(e2);
        }
        try {
            comps = comps.concat(findFlash(node));
        } catch (e3) {
            util.dump(e3);
        }
        try {
            comps = comps.concat(findCssImages(node));
        } catch (e4) {
            util.dump(e4);
        }
        try {
            comps = comps.concat(findImages(node));
        } catch (e5) {
            util.dump(e5);
        }
        try {
            if (type === 'html') {
                comps = comps.concat(findFavicon(node, baseHref));
            }
        } catch (e6) {
            util.dump(e6);
        }

        return comps;
    }


    /**
     * @private
     * Find all stylesheets in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @param {String} doc_location document.location
     * @param {String} base_href base href
     * @return array of object (array[] = {'type' : 'css', 'href': object.href})
     * @type Array
     */
    function findStyleSheets(node, baseHref) {
        var styles, style, i, len,
            head = node.getElementsByTagName('head')[0],
            body = node.getElementsByTagName('body')[0],
            comps = [],

            loop = function (node, tag, container) {
                var els= node.getElementsByTagName(tag),
                    i, len, el, href, cssUrl;

                for (i = 0, len = els.length; i < len; i += 1) {
                    el = els[i];
                    href = el.href || el.getAttribute('href');
                    if ('link'===tag && href && (el.rel === 'stylesheet' ||
                        el.type === 'text/css')) {
                        comps.push({
                            type:'externalstyle',
                            href:href === node.URL ? '' : href,
                            containerNode:container
                        });
                        cssUrl = util.makeAbsoluteUrl(href, baseHref);
                        comps = comps.concat(findImportedStyleSheets(el.sheet, cssUrl));
                    }else if('style'===tag) {

                        comps.push({
                            type:'inlinestyle',
                            content: el.innerHTML,
                            containerNode:container
                        });
                        comps = comps.concat(findImportedStyleSheets(el.sheet, baseHref));
                    }
                }
            };

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':2,
            'message':'Sniff StyleSheets'
        });

        if (head || body) {
            if (head) {
                loop(head, 'link', 'head');
                loop(head, 'style', 'head');
            }
            if (body) {
                loop(body, 'link', 'body');
                loop(body, 'style', 'body');
            }
        } else {
            loop(node, 'link', 'html');
            loop(node, 'style', 'html');
        }


        return comps;
    }

    /**
     * @private
     * Given a css rule, if it's an "@import" rule then add the style sheet
     * component. Also, do a recursive check to see if this imported stylesheet
     * itself contains an imported stylesheet. (FF only)
     * @param {DOMElement} stylesheet DOM stylesheet object
     * @return array of object
     * @type Array
     */
    function findImportedStyleSheets(styleSheet, parentUrl) {
        var i, rules, rule, cssUrl, ff, len,
            reFile = /url\s*\(["']*([^\)]+)["']*\)/i,
            comps = [];

        try {
            if (!(rules = styleSheet.cssRules)) {
                return comps;
            }
            for (i = 0, len = rules.length; i < len; i += 1) {
                rule = rules[i];
                if (rule.type === CSSRULE.IMPORT_RULE && rule.styleSheet && rule.href) {
                    // It is an imported stylesheet!
                    comps.push({
                        type:'externalstyle',
                        href:rule.href,
                        base:parentUrl
                    });
                    // Recursively check if this stylesheet itself imports any other stylesheets.
                    cssUrl = util.makeAbsoluteUrl(rule.href, parentUrl);
                    comps = comps.concat(findImportedStyleSheets(rule.styleSheet, cssUrl));
                } else if (rule.type === CSSRULE.FONT_FACE_RULE) {
                    if (rule.style && typeof rule.style.getPropertyValue === 'function') {
                        ff = rule.style.getPropertyValue('src');
                        ff = reFile.exec(ff);
                        if (ff) {
                            ff = ff[1];
                            comps.push({
                                type:'font',
                                href:ff,
                                base:parentUrl
                            });
                        }
                    }
                } else {
                    break;
                }
            }
        } catch (e) {
            util.dump(e);
        }

        return comps;
    }

    /**
     * @private
     * Find all scripts in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'js', 'href': object.href})
     * @type Array
     */
    function findScripts(node) {
        var comps = [],
            head = node.getElementsByTagName('head')[0],
            body = node.getElementsByTagName('body')[0],

            loop = function (scripts, container) {
                var i, len, script, type, src;

                for (i = 0, len = scripts.length; i < len; i += 1) {
                    script = scripts[i];
                    type = script.type;
                    if (type &&
                        type.toLowerCase().indexOf('javascript') < 0) {
                        continue;
                    }
                    src = script.src || script.getAttribute('src');
                    if (src) {
                        comps.push({
                            type:'externalscript',
                            href:src === node.URL ? '' : src,
                            containerNode:container
                        });
                    }else{
                        comps.push({
                            type:'inlinescript',
                            content: script.innerHTML,
                            containerNode:container
                        });
                    }
                }
            };

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':3,
            'message':'Sniff JavaScripts'
        });

        if (head || body) {
            if (head) {
                loop(head.getElementsByTagName('script'), 'head');
            }
            if (body) {
                loop(body.getElementsByTagName('script'), 'body');
            }
        } else {
            loop(node.getElementsByTagName('script'), 'html');
        }

        return comps;
    }

    /**
     * @private
     * Find all flash in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] =  {'type' : 'flash', 'href': object.href } )
     * @type Array
     */
    function findFlash(node) {
        var i, el, els, len,
            comps = [];

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':4,
            'message':'Sniff Flash'
        });

        els = node.getElementsByTagName('embed');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            if (el.src) {
                comps.push({
                    type:'flash',
                    href:el.src
                });
            }
        }

        els = node.getElementsByTagName('object');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            if (el.data && el.type === 'application/x-shockwave-flash') {
                comps.push({
                    type:'flash',
                    href:el.data
                });
            }
        }

        return comps;
    }

    /**
     * @private
     * Find all css images in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type' : 'cssimage', 'href': object.href } )
     * @type Array
     */
    function findCssImages(node) {
        var i, j, el, els, prop, url, len,
            comps = [],
            hash = {},
            props = ['backgroundImage', 'listStyleImage', 'content', 'cursor'],
            lenJ = props.length;

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':5,
            'message':'Sniff CSS Images'
        });

        els = node.getElementsByTagName('*');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            for (j = 0; j < lenJ; j += 1) {
                prop = props[j];
                url = util.getComputedStyle(el, prop, true);
                if (url && !hash[url]) {
                    comps.push({
                        type:'cssimage',
                        href:url
                    });
                    hash[url] = 1;
                }
            }
        }

        return comps;
    }

    /**
     * @private
     * Find all images in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'image', 'href': object.href} )
     * @type Array
     */
    function findImages(node) {
        var i, img, imgs, src, len,
            comps = [],
            hash = {};

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':6,
            'message':'Sniff Images'
        });

        imgs = node.getElementsByTagName('img');
        for (i = 0, len = imgs.length; i < len; i += 1) {
            img = imgs[i];
            src = img.src;
            if (src && !hash[src]) {
                comps.push({
                    type:'image',
                    href:src,
                    obj:{
                        width:img.width,
                        height:img.height
                    }
                });
                hash[src] = 1;
            }
        }

        return comps;
    }

    /**
     * @private
     * Find favicon link.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'favicon', 'href': object.href} )
     * @type Array
     */
    function findFavicon(node, baseHref) {
        var i, len, link, links, rel,
            comps = [];

        sniffer.emit('progress', {
            'total_step':7,
            'current_step':7,
            'message':'Sniff favicon'
        });

        links = node.getElementsByTagName('link');
        for (i = 0, len = links.length; i < len; i += 1) {
            link = links[i];
            rel = (link.rel || '').toLowerCase();
            if (link.href && (rel === 'icon' ||
                rel === 'shortcut icon')) {
                comps.push({
                    type:'favicon',
                    href:link.href
                });
            }
        }

        // add default /favicon.ico if none informed
        if (!comps.length) {
            comps.push({
                type:'favicon',
                href:util.makeAbsoluteUrl('/favicon.ico', baseHref)
            });
        }

        return comps;
    }

    /**
     * @private
     * Get base href of document.  If <base> element is not found, use doc.location.
     * @param {Document} doc Document object
     * @return base href
     * @type String
     */
    function getBaseHref(doc) {
        var base;

        try {
            base = doc.getElementsByTagName('base')[0];
            base = (base && base.href) || doc.URL;
        } catch (e) {
            util.dump(e);
        }

        return base;
    }

    /**
     * Start sniffing the document in passed window object.
     * The component may be requested asynchronously.
     *
     * @param {DOMElement} node object
     * @param {Number} onloadTimestamp onload timestamp
     * @return ComponentSet
     * @type YSLOW.ComponentSet
     */
    sniffer.sniff = function (node) {
        var url, docs, doc, doct, baseHref,
            comps = [];

        try {
            // Find all documents in the window.
            docs = findDocuments(node);

            for (url in docs) {
                if (docs.hasOwnProperty(url)) {
                    doc = docs[url];
                    if (doc) {
                        // add the document.
                        comps.push({
                            type:doc.type,
                            href:url
                        });

                        doct = doc.document;
                        if (doct && url) {
                            baseHref = getBaseHref(doct);
                            comps = comps.concat(findComponentsInNode(doct,
                                baseHref, doc.type));
                        }
                    }
                }
            }
        } catch (err) {

            sniffer.emit('error', {
                'message':err
            });
        }

        sniffer.emit('end',comps);

    };

    return sniffer;


});