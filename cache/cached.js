/* automatically cached file */


/* FILE:   super.js   */
Loader.loaded("{library}/cached/super.js");
console.warn("cached/super.js loaded from cache");


/* FILE:   sub.js   */
Loader.loaded("{library}/cached/sub.js");
console.warn("cached/sub.js loaded from cache");


/* load the cached stylesheet */
Loader.loadStylesheet("{cached}/cached.css");