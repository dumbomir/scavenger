# Scavenger

Command line tool / Node.js package for scraping/taking screenshots of dynamic and static webpages using [Nightmare](http://www.nightmarejs.org/).

# Features

0. Can extract data from html and convert it to JSON (only in programmatic use).
0. Supports dynamic (Angularjs, etc) and static web pages.
0. Can be piped to other programs.
0. Can be used from command line or programmatically
0. Runs on any linux based os. (Probably on windows and mac too, but it hasn't been tested yet)

# Install

As a global package:
```shell
$ npm install -g scavenger
```
As a local package:
```shell
$ npm install scavenger
```

# Programmatic usage

```javascript
const scavenger = require('scavenger');
```

Minimalistic usage:

```javascript
scavenger.scrape("https://reddit.com")
.then((html) => {})
```


## API
**.scrape(url, options, mapFn)**

`url` can be either a `String` or an `Array`, in which case scavenger will scrape every given url in sequence.

The result can be a `String` or an `Array` depending on `url` and `mapFn`.

`mapFn` is a function which is executed for every `url` and takes as argument the html of the scraped page. Can be passed as second argument if no options are passed. See `.extract` and `.createExtractor` for more info.

```javascript
scavenger.scrape(url)
.then((html) => {
    console.log(html);
    // '<body>....</body>'
});

// Or
scavenger.scrape(url, {    
    selector: '#id', // ID of a DOMElement to wait before scraping
    minify: false, // If true, minify the html
    driverFn: function(){}, // A function that is evaluated in Nightmarejs context to interact with the page,
    useragent: 'Scavenger - https://www.npmjs.com/package/scavenger', // By default,
    nightmareOptions: {} // This options go directly to the Nightmarejs constructor
})
.then((html) => {});


// Multiple urls with mapFn (get length of html for each scraped page)
scavenger.scrape(urls, {/*options*/}, html => html.length)
.then((htmlLengths) => {
    console.log(htmlLengths);
    // [10040, 22351, ...]
});

```
---------------------
**.screenshot(url, options)**

Returns an object of buffers of the screenshot.


```javascript
scavenger.screenshot(url)
.then((buffers) => {
    console.log(buffers);
    // {
    //     "full": <Buffer>
    // }
});

// Or

scavenger.screenshot(url, {    
    selector: '#id', // ID of a DOMElement to wait before scraping
    format: 'png', // Default: png. Available: jpeg, png.
    crop: [{
        width: 1280,
        height: 680
    }, ...],
    width: 1280, // Viewport width in pixels. By default it adapts to the page width. Height is always 100% of the page.
    useragent: 'Scavenger - https://www.npmjs.com/package/scavenger', // By default
    nightmareOptions: {} // This options go directly to the Nightmarejs constructor
})
.then((buffers) => {
    console.log(buffers);
    // {
    //     "full": <Buffer>,
    //     "1280X680": <Buffer>
    // }
});
```

--------------------------
**.ss(url, options, mapFn)**

Combines `.scrape` and `.screenshot`. If `mapFn` is passed, it will be executed on html only.

```javascript
scavenger.ss(url, {    
    selector: '#id',
    minify: false,
    driverFn: function(){},
    nightmareOptions: {},
    format: 'png',
    crop: [{
        width: 1280,
        height: 680
    }, ...],
    width: 1280
})
.then((result) => {
    console.log(result);
    // {
    //    html: '',
    //    buffers: {
    //        "full": <Buffer>,
    //        "1280X680": <Buffer>
    //    }
    // }
});
```


--------------------------
**.extract(html, options)**

See also the [examples](examples/extract.md).

Extracts text from given html and returns it in json format. Supports tables or any element.

Generic HTML elements:

```javascript
const authors = scavenger.extract(html, {
    scope: '.class', // Any css selector
    fields: { // Fields are found within the scope element if given
        author: 'h3.author', // Any css selector
        url: {
            selector: 'a.link',
            attribute: 'href' // Gets the href attribute value for the element found at selector
        },
        any: '',
        ...
    },
    groupBy: 'author' // a field name to group results by
});

// Or passing just the fields
scavenger.extract(html, {    
    author: 'h3.author',
    url: {
        selector: 'a.link',
        attribute: 'href'
    },
    any: '',
    ...    
});

```

--------------------------

**.createExtractor(options, fn)**

See also the [examples](examples/extract.md).

Helper method. Returns an extract function which can be passed to `.scrape` as `mapFn`.

If no `fn` is passed, `.extract` will be used by default.

```javascript
const extract = scavenger.createExtractor({
    scope: 'section',
    fields: {
        title: 'h1.fly-title',
        headline: 'article h2.headline',
        rubric: 'article p.rubric'
    }
});

return scavenger.scrape('http://www.economist.com', extract);
```

-------------------------

**.paginateUrl(options, fn)**

Helper method. Returns an array of urls with the correct query for pagination.

```javascript
const urls = scavenger.paginateUrl({
    baseUrl: 'https://www.google.com/search?',
    params: {
        q: 'scavenger scraper',
        start: 0
    },
    paginationParam: 'start',
    limit: 30,
    step: 10
});

// [
//     'https://www.google.com/search?q=scavenger%20scraper&start=0',    
//     'https://www.google.com/search?q=scavenger%20scraper&start=10'
// ]

scavenger.scrape(urls);
```

-------------------------



# Command line usage

### Help
```shell
$ scavenger -h
```

### Screenshot
Save image to a png file:
```shell
$ scavenger screenshot -u https://reddit.com
$ # Creates a file called https_reddit_com.png
```
Pipe image to ImageMagick display and show it:
```shell
$ scavenger screenshot -u https://reddit.com | display
```

### Scrape
Pipe html to less:
```shell
$ scavenger scrape -u https://reddit.com | less
```
Save html to a file:
```shell
$ scavenger screenshot -u https://reddit.com > reddit.html
```
Or
```shell
$ scavenger screenshot -u https://reddit.com
$ # Creates a file called https_reddit_com.html
```

### Scrape + Screenshot
```shell
$ scavenger ss -u https://reddit.com
```


# License

MIT
