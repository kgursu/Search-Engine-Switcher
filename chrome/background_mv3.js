// background_mv3.js — self-contained service worker for Chrome MV3
// (common.js + background.js merged to avoid importScripts path issues)

const _browser = chrome

const BUILTIN_ENGINES = [
    { id: 'duckduckgo', name: 'DuckDuckGo', hostname: 'duckduckgo.com', queryKey: 'q', queryUrl: 'https://duckduckgo.com/?q={}', queryNeedContentScript: false },
    { id: 'ecosia', name: 'Ecosia', hostname: 'www.ecosia.org', queryKey: 'q', queryUrl: 'https://www.ecosia.org/search?q={}', queryNeedContentScript: false },
    { id: 'brave', name: 'Brave', hostname: 'search.brave.com', queryKey: 'q', queryUrl: 'https://search.brave.com/search?q={}', queryNeedContentScript: false },
    { id: 'gibiru', name: 'Gibiru', hostname: 'gibiru.com', queryKey: 'q', queryUrl: 'https://gibiru.com/results.html?q={}', queryNeedContentScript: false },
    { id: 'metager-en', name: 'MetaGer (English)', hostname: 'metager.org', queryKey: 'eingabe', queryUrl: 'https://metager.org/meta/meta.ger3?eingabe={}', queryNeedContentScript: false },
    { id: 'metager-de', name: 'MetaGer (Deutsch)', hostname: 'metager.de', queryKey: 'eingabe', queryUrl: 'https://metager.de/meta/meta.ger3?eingabe={}', queryNeedContentScript: false },
    { id: 'you-com', name: 'You.com', hostname: 'you.com', queryKey: 'q', queryUrl: 'https://you.com/search?q={}', queryNeedContentScript: false },
    { id: 'startpage', name: 'StartPage', hostname: 'startpage.com', queryKey: 'query', queryUrl: 'https://www.startpage.com/sp/search?query={}', queryNeedContentScript: true },
    { id: 'yahoo-onesearch', name: 'Yahoo OneSearch', hostname: 'www.onesearch.com', queryKey: 'p', queryUrl: 'https://www.onesearch.com/yhs/search?p={}', queryNeedContentScript: true },
    { id: 'bing', name: 'Bing', hostname: 'www.bing.com', queryKey: 'q', queryUrl: 'https://www.bing.com/search?q={}', queryNeedContentScript: false },
    { id: 'google', name: 'Google', hostname: 'www.google.com', queryKey: 'q', queryUrl: 'https://www.google.com/search?q={}', queryNeedContentScript: false },
    { id: 'yandex-en', name: 'Yandex', hostname: 'yandex.com', queryKey: 'text', queryUrl: 'https://yandex.com/search/?text={}', queryNeedContentScript: false },
    { id: 'yandex-ru', name: 'Яндекс', hostname: 'yandex.ru', queryKey: 'text', queryUrl: 'https://yandex.ru/search/?text={}', queryNeedContentScript: false },
    { id: 'yahoo-us', name: 'Yahoo!', hostname: 'search.yahoo.com', queryKey: 'p', queryUrl: 'https://search.yahoo.com/search?p={}', queryNeedContentScript: false },
    { id: 'yahoo-jp', name: 'Yahoo! JAPAN', hostname: 'search.yahoo.co.jp', queryKey: 'p', queryUrl: 'https://search.yahoo.co.jp/search?p={}', queryNeedContentScript: false },
    { id: 'goo', name: 'goo', hostname: 'search.goo.ne.jp', queryKey: 'MT', queryUrl: 'https://search.goo.ne.jp/web.jsp?MT={}&IE=UTF-8&OE=UTF-8', queryNeedContentScript: false },
    { id: 'enwiki', name: 'Wikipedia (English)', hostname: 'en.wikipedia.org', queryKey: 'search', queryUrl: 'https://en.wikipedia.org/w/index.php?search={}&title=Special:Search&fulltext=1&ns0=1', queryNeedContentScript: false },
]

const ICON_MAP = {
    'duckduckgo': 'duckduckgo.svg', 'ecosia': 'ecosia.svg', 'brave': 'brave.svg',
    'gibiru': 'gibiru.png', 'metager-en': 'metager.svg', 'metager-de': 'metager.svg',
    'you-com': 'you-com.webp', 'startpage': 'startpage.svg', 'yahoo-onesearch': 'yahoo-onesearch.png',
    'bing': 'bing.svg', 'google': 'google.svg', 'yandex-en': 'yandex-en.svg',
    'yandex-ru': 'yandex-ru.svg', 'yahoo-us': 'yahoo-us.svg', 'yahoo-jp': 'yahoo-jp.svg',
    'goo': 'goo.svg', 'enwiki': 'wikipedia.svg',
}

function getBuiltinIconUrl(id) {
    const file = ICON_MAP[id]
    return file ? chrome.runtime.getURL('img/engines/' + file) : null
}

function getAllEngines(customEngines) {
    const builtins = BUILTIN_ENGINES.map(e => ({ ...e, iconUrl: getBuiltinIconUrl(e.id), isCustom: false }))
    const customs = (customEngines || []).map(e => ({ ...e, iconUrl: null, queryNeedContentScript: false, isCustom: true }))
    return [...builtins, ...customs]
}

function parseUrlToGetQuery(engine, url) {
    try { return new URL(url).searchParams.get(engine.queryKey) || '' } catch(e) { return '' }
}

function isUrlSupported(url, allEngines) {
    try { const h = new URL(url).hostname; return allEngines.some(e => h.includes(e.hostname)) } catch(e) { return false }
}

function getEngineOfUrl(url, allEngines) {
    try { const h = new URL(url).hostname; return allEngines.find(e => h.includes(e.hostname)) } catch(e) { return undefined }
}

async function storageGet() {
    return new Promise(resolve => chrome.storage.sync.get(null, resolve))
}

async function getEnabledEngines() {
    const data = await storageGet()
    const all = getAllEngines(data.customEngines || [])
    return (data.enabledEngines || ['duckduckgo','ecosia','brave','yandex-en','bing','google'])
        .map(id => all.find(e => e.id === id))
        .filter(Boolean)
}

async function goToNextEngine(tab) {
    if (!tab.id || !tab.url) return
    const engines = await getEnabledEngines()
    if (!engines.length) return
    const data = await storageGet()
    const all = getAllEngines(data.customEngines || [])
    if (!isUrlSupported(tab.url, all)) return
    const currentEngine = getEngineOfUrl(tab.url, all)
    if (!currentEngine) return
    let curIdx = engines.findIndex(e => e.id === currentEngine.id)
    if (curIdx === -1) curIdx = 0
    let keyword = ''
    if (engines[curIdx].queryNeedContentScript) {
        try {
            const res = await chrome.tabs.sendMessage(tab.id, { type: 'getQueryString' })
            keyword = res && res.data ? res.data : parseUrlToGetQuery(engines[curIdx], tab.url)
        } catch(e) { keyword = parseUrlToGetQuery(engines[curIdx], tab.url) }
    } else {
        keyword = parseUrlToGetQuery(engines[curIdx], tab.url)
    }
    const nextEngine = engines[(curIdx + 1) % engines.length]
    chrome.tabs.update(tab.id, { url: nextEngine.queryUrl.replace('{}', encodeURIComponent(keyword)) })
}

chrome.action.onClicked.addListener(tab => goToNextEngine(tab))

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getEnabledEngines') {
        getEnabledEngines().then(engines => sendResponse({ type: 'getEnabledEngines', data: engines }))
        return true
    }
})

// ─── Onboarding: open setup page on first install ─────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') })
    }
})
