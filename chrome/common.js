// common.js — Engine definitions + storage helpers
// Chrome/Opera: only `chrome` exists. Firefox: `browser` exists (Promise-based).
// We normalize everything to callback-style chrome API so it works in both.

const _br = (typeof browser !== 'undefined') ? browser : chrome

// ─── Engine definitions ───────────────────────────────────────────────────────

const BUILTIN_ENGINES = [
    { id: 'duckduckgo',      name: 'DuckDuckGo',          hostname: 'duckduckgo.com',       queryKey: 'q',       queryUrl: 'https://duckduckgo.com/?q={}',                                                         queryNeedContentScript: false },
    { id: 'ecosia',          name: 'Ecosia',               hostname: 'www.ecosia.org',       queryKey: 'q',       queryUrl: 'https://www.ecosia.org/search?q={}',                                                   queryNeedContentScript: false },
    { id: 'brave',           name: 'Brave',                hostname: 'search.brave.com',     queryKey: 'q',       queryUrl: 'https://search.brave.com/search?q={}',                                                 queryNeedContentScript: false },
    { id: 'gibiru',          name: 'Gibiru',               hostname: 'gibiru.com',           queryKey: 'q',       queryUrl: 'https://gibiru.com/results.html?q={}',                                                 queryNeedContentScript: false },
    { id: 'metager-en',      name: 'MetaGer (English)',    hostname: 'metager.org',          queryKey: 'eingabe', queryUrl: 'https://metager.org/meta/meta.ger3?eingabe={}',                                        queryNeedContentScript: false },
    { id: 'metager-de',      name: 'MetaGer (Deutsch)',    hostname: 'metager.de',           queryKey: 'eingabe', queryUrl: 'https://metager.de/meta/meta.ger3?eingabe={}',                                         queryNeedContentScript: false },
    { id: 'you-com',         name: 'You.com',              hostname: 'you.com',              queryKey: 'q',       queryUrl: 'https://you.com/search?q={}',                                                          queryNeedContentScript: false },
    { id: 'startpage',       name: 'StartPage',            hostname: 'startpage.com',        queryKey: 'query',   queryUrl: 'https://www.startpage.com/sp/search?query={}',                                         queryNeedContentScript: true  },
    { id: 'yahoo-onesearch', name: 'Yahoo OneSearch',      hostname: 'www.onesearch.com',    queryKey: 'p',       queryUrl: 'https://www.onesearch.com/yhs/search?p={}',                                            queryNeedContentScript: true  },
    { id: 'bing',            name: 'Bing',                 hostname: 'www.bing.com',         queryKey: 'q',       queryUrl: 'https://www.bing.com/search?q={}',                                                     queryNeedContentScript: false },
    { id: 'google',          name: 'Google',               hostname: 'www.google.com',       queryKey: 'q',       queryUrl: 'https://www.google.com/search?q={}',                                                   queryNeedContentScript: false },
    { id: 'yandex-en',       name: 'Yandex',               hostname: 'yandex.com',           queryKey: 'text',    queryUrl: 'https://yandex.com/search/?text={}',                                                   queryNeedContentScript: false },
    { id: 'yandex-ru',       name: 'Яндекс',               hostname: 'yandex.ru',            queryKey: 'text',    queryUrl: 'https://yandex.ru/search/?text={}',                                                    queryNeedContentScript: false },
    { id: 'yahoo-us',        name: 'Yahoo!',               hostname: 'search.yahoo.com',     queryKey: 'p',       queryUrl: 'https://search.yahoo.com/search?p={}',                                                 queryNeedContentScript: false },
    { id: 'yahoo-jp',        name: 'Yahoo! JAPAN',         hostname: 'search.yahoo.co.jp',   queryKey: 'p',       queryUrl: 'https://search.yahoo.co.jp/search?p={}',                                               queryNeedContentScript: false },
    { id: 'goo',             name: 'goo',                  hostname: 'search.goo.ne.jp',     queryKey: 'MT',      queryUrl: 'https://search.goo.ne.jp/web.jsp?MT={}&IE=UTF-8&OE=UTF-8',                             queryNeedContentScript: false },
    { id: 'enwiki',          name: 'Wikipedia (English)',   hostname: 'en.wikipedia.org',     queryKey: 'search',  queryUrl: 'https://en.wikipedia.org/w/index.php?search={}&title=Special:Search&fulltext=1&ns0=1', queryNeedContentScript: false },
]

const ICON_MAP = {
    'duckduckgo': 'duckduckgo.svg', 'ecosia': 'ecosia.svg', 'brave': 'brave.svg',
    'gibiru': 'gibiru.png', 'metager-en': 'metager.svg', 'metager-de': 'metager.svg',
    'you-com': 'you-com.webp', 'startpage': 'startpage.svg',
    'yahoo-onesearch': 'yahoo-onesearch.png', 'bing': 'bing.svg', 'google': 'google.svg',
    'yandex-en': 'yandex-en.svg', 'yandex-ru': 'yandex-ru.svg',
    'yahoo-us': 'yahoo-us.svg', 'yahoo-jp': 'yahoo-jp.svg',
    'goo': 'goo.svg', 'enwiki': 'wikipedia.svg',
}

function getBuiltinIconUrl(id) {
    const file = ICON_MAP[id]
    if (!file) return null
    return _br.runtime.getURL('img/engines/' + file)
}

function getAllEngines(customEngines) {
    const builtins = BUILTIN_ENGINES.map(e => ({
        ...e, iconUrl: getBuiltinIconUrl(e.id), isCustom: false
    }))
    const customs = (customEngines || []).map(e => ({
        ...e, iconUrl: null, queryNeedContentScript: false, isCustom: true
    }))
    return [...builtins, ...customs]
}

function parseUrlToGetQuery(engine, url) {
    try { return new URL(url).searchParams.get(engine.queryKey) || '' } catch(e) { return '' }
}

function isUrlSupported(url, allEngines) {
    try { const h = new URL(url).hostname; return allEngines.some(e => h.includes(e.hostname)) }
    catch(e) { return false }
}

function getEngineOfUrl(url, allEngines) {
    try { const h = new URL(url).hostname; return allEngines.find(e => h.includes(e.hostname)) }
    catch(e) { return undefined }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const DEFAULT_STORAGE = {
    apiLevel: 2,
    enabledEngines: ['duckduckgo', 'ecosia', 'brave', 'yandex-en', 'bing', 'google'],
    customEngines: [],
    floatButton: { enabled: true, iconSize: 20 },
    extra: { ecosiaEliminateNotifications: false },
}

// Always use chrome.storage.sync; fall back to local if unavailable.
function _getArea() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        return chrome.storage.sync || chrome.storage.local
    }
    if (typeof browser !== 'undefined' && browser.storage) {
        return browser.storage.sync || browser.storage.local
    }
    throw new Error('No storage API found')
}

function storageGet() {
    return new Promise((resolve) => {
        _getArea().get(null, (raw) => {
            // raw may be empty object {} on first run
            const data = (raw && typeof raw === 'object') ? raw : {}
            if (!data.enabledEngines) {
                // First run: write defaults then return them
                _getArea().set(DEFAULT_STORAGE, () => {})
                resolve({ ...DEFAULT_STORAGE })
                return
            }
            resolve({
                ...DEFAULT_STORAGE,
                ...data,
                customEngines: data.customEngines || [],
                floatButton:   data.floatButton   || DEFAULT_STORAGE.floatButton,
                extra:         data.extra         || DEFAULT_STORAGE.extra,
            })
        })
    })
}

function storageSet(partial) {
    return new Promise((resolve) => {
        _getArea().set(partial, () => resolve())
    })
}
