const debug = require('debug')('scavenger:webdriver');
const nightmare = require('./nightmare');

module.exports = {
    load: load,
    end: end,
    waitForElement: waitForElement,
    getScreenshot: getScreenshot,
    getHTML: getHTML,
    setUserAgent: setUserAgent,
    isLoaded: isLoaded,
    goto: goto
};

function load(url, debugMode) {
    nightmare.init(debugMode);
}

function setUserAgent(useragent) {
    debug(`setting useragent: ${useragent}`);
    useragent = useragent || 'Scavenger - https://www.npmjs.com/package/scavenger';
    return nightmare.get().useragent(useragent);
}

function goto(url, waitMs) {
    debug(`goto: ${url}`);
    const driver = nightmare.get();
    return driver.goto(url)
    .wait(waitMs)
    .catch((err) => {
        debug(err);
        end();
        if (!(err instanceof Error) && err.details) {
            return Promise.reject(new Error(`${err.message}: ${err.details}`));
        }
        return Promise.reject(err);
    });
}

function end() {
    return nightmare.end();
}

async function waitForElement(selector) {
    if (!selector) {
        return false;
    }
    try {
        const test = await nightmare.get().evaluate((_selector, done) => {
            let interval = setInterval(() => {
                let element = document.querySelector(_selector);
                if (!element) {
                    return;
                }

                if (element.innerHTML.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        done(null, element.innerHTML);
                    });
                }
            }, 50);
        }, selector);
    } catch (e) {
        end();
        debug(e);
        return false;
    }
}

async function getScreenshot(width, driverFn) {
    debug('getScreenshot');
    let driver = nightmare.get();
    try {
        if (driverFn) {
            evalDriverFn(driverFn, driver)();
        }

        let dimensions = await driver.evaluate(getPageDimensions);
        width = width ? Number(width) : dimensions.width;
        await driver
            .viewport(width, dimensions.height)
            .wait(1000);
        await driver.evaluate(hideScrollbar);
        return await driver.screenshot();
    } catch (e) {
        end();
        debug(e);
        return Promise.reject(e);
    }
}

async function getHTML(driverFn) {
    debug('getHTML');
    let driver = nightmare.get();
    try {
        if (driverFn) {
            evalDriverFn(driverFn, driver)();
        }
        return await driver.evaluate(() => {
            var node = document.doctype;
            if (!node) {
                return document.documentElement.innerHTML;
            }
            var doctype = "<!DOCTYPE "
                + node.name
                + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                + (!node.publicId && node.systemId ? ' SYSTEM' : '')
                + (node.systemId ? ' "' + node.systemId + '"' : '')
                + '>';
            return `${doctype}\n${document.documentElement.innerHTML}`;
        });
    } catch (e) {
        end();
        debug(e);
        return Promise.reject(e);
    }
}

function isLoaded() {
    return nightmare.isLoaded();
}

function hideScrollbar(done) {
    if (document.readyState === "complete") {
        run();
        done();
    } else {
        document.addEventListener("DOMContentLoaded", function(event) {
            run();
            done();
        });
    }

    function run() {
        let sheet = (function () {
            var style = document.createElement("style");
            style.appendChild(document.createTextNode(""));
            document.head.appendChild(style);
            return style.sheet;
        })();
        sheet.insertRule('::-webkit-scrollbar { width: 0 !important; display: none; }', 0);
    }
}

function getPageDimensions() {
    let body = document.querySelector('body');
    return {
        height: body.scrollHeight,
        width: body.scrollWidth
    };
}

function evalFn(fnString) {
    return eval(`(${fnString})`);
}

function evalDriverFn(fn, driver) {
    debug('evalDriverFn');
    if (typeof fn === 'string') {
        fn = evalFn(fn);
    }
    return fn.bind(driver);

    // TODO find a way to extract a subset of driver methods like the following
    // without breaking nightmare context:
    // return fn.bind({
    //     wait: driver.wait,
    //     insert: driver.insert,
    //     type: driver.type,
    //     click: driver.click,
    //     select: driver.select,
    //     check: driver.check,
    //     uncheck: driver.uncheck,
    //     mousedown: driver.mousedown,
    //     mouseup: driver.mouseup,
    //     mouseover: driver.mouseover,
    //     evaluate: driver.evaluate,
    //     _queue: driver._queue
    // });
}
