# Ladybug

![screenshot](https://raw.github.com/yuanyan/ladybug/master/img/screenshot1.jpg)

# Rules

## CSS Rules
 * Avoid using @import
 * Avoid using `*=`, `|=`, `^=`, `$=`, or `~=` attribute selectors
 * Avoid using unqualified attribute selectors
 * Avoid using universal selectors
 * Avoid using CSS Expressions http://developer.yahoo.com/blogs/ydn/posts/2007/07/high_performanc_6/
 * Avoid using IE AlphaImageLoader Filter
 * Remove unused CSS rule
 * Preload web fonts http://www.artzstudio.com/2012/02/web-font-performance-weighing-fontface-options-and-alternatives/
 * Avoid using too many background images
 * Avoid using box-shadow property http://stackoverflow.com/questions/4789853/css3-box-shadow-causes-scroll-lag-slow-performance-on-safari-5-0-2

## HTML Rules
 * Minimize the Number of iframes
 * Specifying a width and height for all images allows for faster rendering by eliminating the need for unnecessary reflows and repaints.
 * Avoid Depth Nesting Node
 * Avoid empty href and src
 * Stylesheets should be linked at the top of the page inside the <head>, after the <title> in order to provide a smooth rendering
 * JavaScript should be linked at the bottom of the page
 * Avoid Inline Script and Style cross http://www.stevesouders.com/blog/2009/05/06/positioning-inline-scripts/
 * Avoid embedded and inline styles/JavaScript because it forces the browser to make a context switch between the HTML and CSS/JavaScript parsers. 
 * Inline Small JavaScript, External Large JavaScript
 * Inline Small Stylesheets, External Large Stylesheets
 * Avoid Deprecated elements
 * Reduce Document Size
 * Reduce Document Complexity
 * Avoid Flash, replacing with browser-native implementations (JS, SVG, VML, Canvas)
 * Use icon fonts replace icon images
 * Use HTML 5 Doctype
 * Use HTML 5 Encoding, and put into the top of head tag
 * <del>Defines an offline manifest http://appcachefacts.info/</del>


## Javascript Rules
 * Use Smart Event Handlers http://developer.yahoo.com/performance/rules.html#events
 * Avoid bind onscroll event
 * Cache the result of query selector
 * Avoid IO-blocking operation in UI thread, like cookie, localStorage, File Readers， XMLHttpRequest, Web Socket should perform in Web Worker http://hacks.mozilla.org/2012/03/there-is-no-simple-solution-for-local-storage/
 * Speeding up JavaScript: Working with the DOM https://developers.google.com/speed/articles/javascript-dom
 * Do you really need jQuery? create your own mini-library


## Other Rules
 * Specifying a character set in the HTTP response headers of your HTML documents allows the browser to begin parsing HTML and executing scripts immediately. <https://developers.google.com/speed/docs/best-practices/rendering?hl=zh-CN#SpecifyCharsetEarly>
 * Reduce Document Cookie Size
 * Serve resources from a consistent URL https://developers.google.com/speed/docs/best-practices/payload?hl=en#duplicate_resources
 * Less DNS lookups – fetch components from not more than 2-4 domains
 * Avoid large sprite images, stylesheets, script, loading bytes in parallel can be faster  http://blog.getify.com/obsessions-http-request-reduction/



# Ref
 * [Best Practices for Speeding Up Your Web Site](http://developer.yahoo.com/performance/rules.html)
 * [Book of Speed](http://www.bookofspeed.com/)
 * [Web Performance Best Practices](http://code.google.com/intl/zh-CN/speed/page-speed/docs/rules_intro.html)
 * [Google Page Speed](http://code.google.com/p/page-speed/wiki)

