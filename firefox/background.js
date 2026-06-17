// background.js — Firefox MV2

let STORAGE = {}

async function loadStorage() {
    STORAGE = await storageGet()
}
loadStorage()

_getArea().onChanged.addListener((changes) => {
    if (changes.enabledEngines) STORAGE.enabledEngines = changes.enabledEngines.newValue
    if (changes.customEngines) STORAGE.customEngines = changes.customEngines.newValue
    if (changes.floatButton) STORAGE.floatButton = changes.floatButton.newValue
})

function getEnabledEngines() {
    const all = getAllEngines(STORAGE.customEngines || [])
    return (STORAGE.enabledEngines || DEFAULT_STORAGE.enabledEngines)
        .map(id => all.find(e => e.id === id))
        .filter(Boolean)
}

async function getKeywordForTab(tabId, engine, currentUrl) {
    if (!engine.queryNeedContentScript) {
        return parseUrlToGetQuery(engine, currentUrl)
    }
    try {
        const res = await _br.tabs.sendMessage(tabId, { type: 'getQueryString' })
        return res && res.data ? res.data : ''
    } catch(e) {
        return parseUrlToGetQuery(engine, currentUrl)
    }
}

async function goToNextEngine(tab) {
    if (!tab.id || !tab.url) return
    const engines = getEnabledEngines()
    if (!engines.length) return
    const all = getAllEngines(STORAGE.customEngines || [])
    if (!isUrlSupported(tab.url, all)) return
    const currentEngine = getEngineOfUrl(tab.url, all)
    if (!currentEngine) return
    let curIdx = engines.findIndex(e => e.id === currentEngine.id)
    if (curIdx === -1) curIdx = 0
    const keyword = await getKeywordForTab(tab.id, engines[curIdx], tab.url)
    const nextEngine = engines[(curIdx + 1) % engines.length]
    _br.tabs.update(tab.id, { url: nextEngine.queryUrl.replace('{}', encodeURIComponent(keyword)) })
}

// pageAction click (Firefox)
if (_br.browserAction) {
    _br.browserAction.onClicked.addListener(tab => goToNextEngine(tab))
}

// Show/hide pageAction on URL change
_br.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) return
    const storage = await storageGet()
    const all = getAllEngines(storage.customEngines || [])
    if (_br.browserAction) {
        if (isUrlSupported(changeInfo.url, all)) {
            _br.browserAction.show(tabId)
        } else {
            _br.browserAction.hide(tabId)
        }
    }
})

// Message listener for content script
_br.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getEnabledEngines') {
        loadStorage().then(() => {
            sendResponse({ type: 'getEnabledEngines', data: getEnabledEngines() })
        })
        return true
    }
})

// Onboarding on first install
_br.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        _br.runtime.openOptionsPage()
    }
})
