define(function(require, exports) {

    var reHeader = /^([^:]+):\s*([\s\S]+)$/;

   function Headers(rawHeaders){

        var h, i, m, len;

         if (typeof rawHeaders === 'string') {
            h = rawHeaders.split('\n');
            for (i = 0, len = h.length; i < len; i++) {
                m = reHeader.exec(h[i]);
                if (m) {
                    this[m[1]] = m[2];
                }
            }
        }
    };

    Headers.prototype = {

        /**
         *  Return true if this object has a last-modified date significantly in the past.
         */
        hasOldModifiedDate: function () {
            var now = Number(new Date()),
                modified_date = this['Last-Modified'];

            if (typeof modified_date !== 'undefined') {
                // at least 1 day in the past
                return ((now - Number(new Date(modified_date))) > (24 * 60 * 60 * 1000));
            }

            return false;
        },

        /**
         * Return true if this object has a far future Expires.
         * @todo: make the "far" interval configurable
         * @param expires Date object
         * @return true if this object has a far future Expires.
         */
        hasFarFutureExpiresOrMaxAge: function () {
            var expires_in_seconds,
                now = Number(new Date()),
                minSeconds = YSLOW.util.Preference.getPref('minFutureExpiresSeconds', 2 * 24 * 60 * 60),
                minMilliSeconds = minSeconds * 1000;

            if (typeof this.expires === 'object') {
                expires_in_seconds = Number(this.expires);
                if ((expires_in_seconds - now) > minMilliSeconds) {
                    return true;
                }
            }

            return false;
        },

        getEtag: function () {
            var headers = this,
                etag = headers.Etag || headers.ETag;

            return etag || '';
        },

        getMaxAge: function () {
            var index, maxage, expires,
                cache_control = this['Cache-Control'];

            if (cache_control) {
                index = cache_control.indexOf('max-age');
                if (index > -1) {
                    maxage = parseInt(cache_control.substring(index + 8), 10);
                    if (maxage > 0) {
                        expires = this.maxAgeToDate(maxage);
                    }
                }
            }

            return expires;
        },

        /**
         * Return total size of Set-Cookie headers of this component.
         * @return total size of Set-Cookie headers of this component.
         * @type Number
         */
        getSetCookieSize : function () {
            // only return total size of cookie received.
            var aCookies, k,
                size = 0;

            if (this && this['Set-Cookie']) {
                aCookies = this['Set-Cookie'].split('\n');
                if (aCookies.length > 0) {
                    for (k = 0; k < aCookies.length; k += 1) {
                        size += aCookies[k].length;
                    }
                }
            }

            return size;
        },

        /**
         * Return total size of Cookie HTTP Request headers of this component.
         * @return total size of Cookie headers Request of this component.
         * @type Number
         */
        getReceivedCookieSize : function () {
            // only return total size of cookie sent.
            var aCookies, k,
                size = 0;

            if (this.cookie && this.cookie.length > 0) {
                aCookies = this.cookie.split('\n');
                if (aCookies.length > 0) {
                    for (k = 0; k < aCookies.length; k += 1) {
                        size += aCookies[k].length;
                    }
                }
            }

            return size;
        },
        /**
         * Inspects the ETag.
         *
         * Returns FALSE (bad ETag) only if the server is Apache or IIS and the ETag format
         * matches the default ETag format for the server. Anything else, including blank etag
         * returns TRUE (good ETag).
         * Default IIS: Filetimestamp:ChangeNumber
         * Default Apache: inode-size-timestamp
         *
         * @param {String} etag ETag response header
         * @return {Boolean} TRUE if ETag is good, FALSE otherwise
         */
        isETagGood: function (etag) {
            var reIIS = /^[0-9a-f]+:[0-9a-f]+$/,
                reApache = /^[0-9a-f]+\-[0-9a-f]+\-[0-9a-f]+$/;

            if (!etag) {
                return true; // no etag is ok etag
            }

            etag = etag.replace(/^["']|["'][\s\S]*$/g, ''); // strip " and '
            return !(reApache.test(etag) || reIIS.test(etag));
        },

        expires_month: {
            Jan: 1,
            Feb: 2,
            Mar: 3,
            Apr: 4,
            May: 5,
            Jun: 6,
            Jul: 7,
            Aug: 8,
            Sep: 9,
            Oct: 10,
            Nov: 11,
            Dec: 12
        },


        /**
         * Make a pretty string out of an Expires object.
         *
         * @todo Remove or replace by a general-purpose date formatting method
         *
         * @param {String} s_expires Datetime string
         * @return {String} Prity date
         */
        prettyExpiresDate: function (expires) {
            var month;

            if (Object.prototype.toString.call(expires) === '[object Date]' && expires.toString() !== 'Invalid Date' && !isNaN(expires)) {
                month = expires.getMonth() + 1;
                return expires.getFullYear() + "/" + month + "/" + expires.getDate();
            } else if (!expires) {
                return 'no expires';
            }
            return 'invalid date object';
        },

        /**
         * Converts cache-control: max-age=? into a JavaScript date
         *
         * @param {Integer} seconds Number of seconds in the cache-control header
         * @return {Date} A date object coresponding to the expiry date
         */
        maxAgeToDate: function (seconds) {
            var d = new Date();

            d = d.getTime() + parseInt(seconds, 10) * 1000;
            return new Date(d);
        }
    };


    return {
        "Headers": Headers
    };

});
