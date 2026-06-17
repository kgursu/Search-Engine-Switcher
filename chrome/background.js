// background.js

// Polyfill
const _browser = typeof browser !== 'undefined' ? browser : chrome

let STORAGE = { ...DEFAULT_STORAGE }

async function loadStorage() {
    STORAGE = await storageGet()
}
loadStorage()

getStorageArea().onChanged.addListener((changes) => {
    if (changes.enabledEngines) STORAGE.enabledEngines = changes.enabledEngines.newValue
    if (changes.customEngines) STORAGE.customEngines = changes.customEngines.newValue
    if (changes.floatButton) STORAGE.floatButton = changes.floatButton.newValue
})

function getEnabledEngines() {
    const all = getAllEngines(STORAGE.customEngines)
    return STORAGE.enabledEngines
        .map(id => all.find(e => e.id === id))
        .filter(Boolean)
}

async function getKeywordForTab(tabId, engine, currentUrl) {
    if (!engine.queryNeedContentScript) {
        return parseUrlToGetQuery(engine, currentUrl)
    }
    try {
        const res = await _browser.tabs.sendMessage(tabId, { type: 'getQueryString' })
        return res && res.data ? res.data : ''
    } catch(e) {
        return parseUrlToGetQuery(engine, currentUrl)
    }
}

async function goToNextEngine(tab) {
    if (!tab.id || !tab.url) return
    const engines = getEnabledEngines()
    if (!engines.length) return
    const all = getAllEngines(STORAGE.customEngines)
    if (!isUrlSupported(tab.url, all)) return

    const currentEngine = getEngineOfUrl(tab.url, all)
    if (!currentEngine) return

    let curIdx = engines.findIndex(e => e.id === currentEngine.id)
    if (curIdx === -1) curIdx = 0

    const keyword = await getKeywordForTab(tab.id, engines[curIdx], tab.url)
    const nextEngine = engines[(curIdx + 1) % engines.length]
    const url = nextEngine.queryUrl.replace('{}', encodeURIComponent(keyword))
    _browser.tabs.update(tab.id, { url })
}

// pageAction click
if (_browser.pageAction) {
    _browser.pageAction.onClicked.addListener((tab) => {
        goToNextEngine(tab)
    })
}

// action click (MV3 Chrome uses action, not pageAction)
if (_browser.action) {
    _browser.action.onClicked.addListener((tab) => {
        goToNextEngine(tab)
    })
}

// Show/hide pageAction when URL changes (Firefox)
if (_browser.tabs && _browser.tabs.onUpdated) {
    _browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
        if (!changeInfo.url) return
        const storage = await storageGet()
        const all = getAllEngines(storage.customEngines)
        if (_browser.pageAction) {
            if (isUrlSupported(changeInfo.url, all)) {
                _browser.pageAction.show(tabId)
            } else {
                _browser.pageAction.hide(tabId)
            }
        }
    })
}

// Message listener for content script
_browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getEnabledEngines') {
        loadStorage().then(() => {
            sendResponse({ type: 'getEnabledEngines', data: getEnabledEngines() })
        })
        return true // async
    }
})
