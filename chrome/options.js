document.addEventListener('DOMContentLoaded', () => {

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILTIN_ENGINES = [
    { id:'duckduckgo',      name:'DuckDuckGo',         hostname:'duckduckgo.com',     queryUrl:'https://duckduckgo.com/?q={}' },
    { id:'ecosia',          name:'Ecosia',              hostname:'www.ecosia.org',     queryUrl:'https://www.ecosia.org/search?q={}' },
    { id:'brave',           name:'Brave',               hostname:'search.brave.com',   queryUrl:'https://search.brave.com/search?q={}' },
    { id:'gibiru',          name:'Gibiru',              hostname:'gibiru.com',         queryUrl:'https://gibiru.com/results.html?q={}' },
    { id:'metager-en',      name:'MetaGer (English)',   hostname:'metager.org',        queryUrl:'https://metager.org/meta/meta.ger3?eingabe={}' },
    { id:'metager-de',      name:'MetaGer (Deutsch)',   hostname:'metager.de',         queryUrl:'https://metager.de/meta/meta.ger3?eingabe={}' },
    { id:'you-com',         name:'You.com',             hostname:'you.com',            queryUrl:'https://you.com/search?q={}' },
    { id:'startpage',       name:'StartPage',           hostname:'startpage.com',      queryUrl:'https://www.startpage.com/sp/search?query={}' },
    { id:'yahoo-onesearch', name:'Yahoo OneSearch',     hostname:'www.onesearch.com',  queryUrl:'https://www.onesearch.com/yhs/search?p={}' },
    { id:'bing',            name:'Bing',                hostname:'www.bing.com',       queryUrl:'https://www.bing.com/search?q={}' },
    { id:'google',          name:'Google',              hostname:'www.google.com',     queryUrl:'https://www.google.com/search?q={}' },
    { id:'yandex-en',       name:'Yandex',              hostname:'yandex.com',         queryUrl:'https://yandex.com/search/?text={}' },
    { id:'yandex-ru',       name:'Яндекс',              hostname:'yandex.ru',          queryUrl:'https://yandex.ru/search/?text={}' },
    { id:'yahoo-us',        name:'Yahoo!',              hostname:'search.yahoo.com',   queryUrl:'https://search.yahoo.com/search?p={}' },
    { id:'yahoo-jp',        name:'Yahoo! JAPAN',        hostname:'search.yahoo.co.jp', queryUrl:'https://search.yahoo.co.jp/search?p={}' },
    { id:'goo',             name:'goo',                 hostname:'search.goo.ne.jp',   queryUrl:'https://search.goo.ne.jp/web.jsp?MT={}' },
    { id:'enwiki',          name:'Wikipedia (English)', hostname:'en.wikipedia.org',   queryUrl:'https://en.wikipedia.org/w/index.php?search={}' },
]

const ICON_MAP = {
    'duckduckgo':'duckduckgo.svg','ecosia':'ecosia.svg','brave':'brave.svg',
    'gibiru':'gibiru.png','metager-en':'metager.svg','metager-de':'metager.svg',
    'you-com':'you-com.webp','startpage':'startpage.svg','yahoo-onesearch':'yahoo-onesearch.png',
    'bing':'bing.svg','google':'google.svg','yandex-en':'yandex-en.svg','yandex-ru':'yandex-ru.svg',
    'yahoo-us':'yahoo-us.svg','yahoo-jp':'yahoo-jp.svg','goo':'goo.svg','enwiki':'wikipedia.svg',
}

const DEFAULT_STORAGE = {
    apiLevel: 2,
    enabledEngines: ['duckduckgo','ecosia','brave','yandex-en','bing','google'],
    customEngines: [],
    floatButton: { enabled: true, iconSize: 20 },
    engineUrlOverrides: {},
    extra: { ecosiaEliminateNotifications: false },
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const store = chrome.storage.sync || chrome.storage.local

function loadStorage() {
    return new Promise(resolve => {
        store.get(null, raw => {
            if (chrome.runtime.lastError) { resolve({...DEFAULT_STORAGE}); return }
            const data = (raw && typeof raw === 'object') ? raw : {}
            if (!data.enabledEngines || !data.enabledEngines.length) {
                store.set(DEFAULT_STORAGE)
                resolve({...DEFAULT_STORAGE})
                return
            }
            resolve({
                ...DEFAULT_STORAGE, ...data,
                customEngines: data.customEngines || [],
                floatButton: { ...DEFAULT_STORAGE.floatButton, ...(data.floatButton || {}) },
                extra: { ...DEFAULT_STORAGE.extra, ...(data.extra || {}) },
            })
        })
    })
}

function saveStorage(partial) {
    return new Promise(resolve => store.set(partial, resolve))
}

// ─── Engine helpers ───────────────────────────────────────────────────────────

function iconUrl(id) {
    const file = ICON_MAP[id]
    return file ? chrome.runtime.getURL('img/engines/' + file) : null
}

function getAllEngines(customs) {
    const overrides = window._urlOverrides || {}
    return [
        ...BUILTIN_ENGINES.map(e => ({
            ...e,
            iconUrl: iconUrl(e.id),
            isCustom: false,
            queryUrl: overrides[e.id] || e.queryUrl
        })),
        ...(customs || []).map(e => ({...e, iconUrl: null, isCustom: true})),
    ]
}

// ─── State ────────────────────────────────────────────────────────────────────

let selectedId = null
let enabledIds = []
let customEngines = []
let editingId = null  // id of engine currently being edited

const allEngines = () => getAllEngines(customEngines)
const engineById = id => allEngines().find(e => e.id === id)

// ─── Render ───────────────────────────────────────────────────────────────────

function makeIconImg(engine, size) {
    const img = document.createElement('img')
    img.alt = engine.name
    if (size) { img.width = size; img.height = size }
    img.src = engine.iconUrl || `https://www.google.com/s2/favicons?domain=${engine.hostname}&sz=32`
    img.onerror = () => { img.style.visibility = 'hidden' }
    return img
}

function renderLists() {
    const disEl = document.getElementById('list-disabled')
    const enEl  = document.getElementById('list-enabled')
    disEl.innerHTML = ''
    enEl.innerHTML  = ''
    const enabledSet = new Set(enabledIds)
    for (const eng of allEngines()) {
        if (!enabledSet.has(eng.id)) disEl.appendChild(makeLi(eng, false, null))
    }
    enabledIds.forEach((id, i) => {
        const eng = engineById(id)
        if (eng) enEl.appendChild(makeLi(eng, true, i + 1))
    })
    renderButtons()
    updatePreview(currentIconSize())
}

function makeLi(engine, isEnabled, orderNo) {
    const li = document.createElement('li')
    if (selectedId === engine.id) li.classList.add('selected')
    li.onclick = () => { selectedId = selectedId === engine.id ? null : engine.id; renderLists() }
    if (isEnabled && orderNo !== null) {
        const no = document.createElement('span')
        no.className = 'eng-no'
        no.textContent = orderNo
        li.appendChild(no)
    }
    const img = makeIconImg(engine, 18)
    img.className = 'eng-icon'
    li.appendChild(img)
    const name = document.createElement('span')
    name.className = 'eng-name'
    name.textContent = engine.name
    li.appendChild(name)
    if (engine.isCustom) {
        const badge = document.createElement('span')
        badge.className = 'custom-badge'
        badge.textContent = 'custom'
        li.appendChild(badge)
    }
    return li
}

function renderButtons() {
    ['btn-enable','btn-disable','btn-top','btn-up','btn-down','btn-bottom','btn-delete-custom','btn-edit-custom']
        .forEach(id => document.getElementById(id).disabled = true)
    if (!selectedId) return
    const isEnabled = enabledIds.includes(selectedId)
    const engine = engineById(selectedId)
    if (!engine) return
    // Edit is available for all engines
    document.getElementById('btn-edit-custom').disabled = false
    if (!isEnabled) {
        document.getElementById('btn-enable').disabled = false
        if (engine.isCustom) document.getElementById('btn-delete-custom').disabled = false
        return
    }
    document.getElementById('btn-disable').disabled = false
    const i = enabledIds.indexOf(selectedId)
    if (i > 0) { document.getElementById('btn-top').disabled = false; document.getElementById('btn-up').disabled = false }
    if (i < enabledIds.length - 1) { document.getElementById('btn-bottom').disabled = false; document.getElementById('btn-down').disabled = false }
    if (engine.isCustom) document.getElementById('btn-delete-custom').disabled = false
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function persist() { saveStorage({ enabledEngines: enabledIds, customEngines }) }

function actEnable() {
    if (!selectedId || enabledIds.includes(selectedId)) return
    enabledIds.push(selectedId); persist(); renderLists()
}
function actDisable() {
    const i = enabledIds.indexOf(selectedId)
    if (i === -1) return
    enabledIds.splice(i, 1); persist(); renderLists()
}
function actMove(dir) {
    const i = enabledIds.indexOf(selectedId)
    if (i === -1) return
    if (dir === 'top')         { enabledIds.splice(i,1); enabledIds.unshift(selectedId) }
    else if (dir === 'bottom') { enabledIds.splice(i,1); enabledIds.push(selectedId) }
    else if (dir === 'up'   && i > 0)                    { [enabledIds[i],enabledIds[i-1]] = [enabledIds[i-1],enabledIds[i]] }
    else if (dir === 'down' && i < enabledIds.length-1)  { [enabledIds[i],enabledIds[i+1]] = [enabledIds[i+1],enabledIds[i]] }
    persist(); renderLists()
}
function actDeleteCustom() {
    const eng = engineById(selectedId)
    if (!eng || !eng.isCustom) return
    if (!confirm(`Delete "${eng.name}"?`)) return
    customEngines = customEngines.filter(e => e.id !== selectedId)
    enabledIds = enabledIds.filter(id => id !== selectedId)
    selectedId = null
    persist(); renderLists()
}
function clearForm() {
    editingId = null
    document.getElementById('cf-name').value = ''
    document.getElementById('cf-hostname').value = ''
    document.getElementById('cf-url').value = ''
    document.getElementById('cf-name').disabled = false
    document.getElementById('cf-hostname').disabled = false
    document.getElementById('btn-add-custom').textContent = 'Add Engine'
    document.getElementById('btn-reset-default').style.display = 'none'
    document.getElementById('btn-cancel-edit').style.display = 'none'
}

function actEdit() {
    if (!selectedId) return
    const engine = engineById(selectedId)
    if (!engine) return
    editingId = selectedId
    document.getElementById('cf-name').value = engine.name
    document.getElementById('cf-hostname').value = engine.hostname
    document.getElementById('cf-url').value = engine.queryUrl
    document.getElementById('btn-add-custom').textContent = 'Save Changes'
    document.getElementById('btn-cancel-edit').style.display = 'inline-flex'
    if (!engine.isCustom) {
        document.getElementById('cf-name').disabled = true
        document.getElementById('cf-hostname').disabled = true
        document.getElementById('btn-reset-default').style.display = 'inline-flex'
    } else {
        document.getElementById('cf-name').disabled = false
        document.getElementById('cf-hostname').disabled = false
        document.getElementById('btn-reset-default').style.display = 'none'
    }
    document.getElementById('cf-url').focus()
}

function actResetDefaultUrl() {
    if (!editingId) return
    const builtin = BUILTIN_ENGINES.find(e => e.id === editingId)
    if (builtin) document.getElementById('cf-url').value = builtin.queryUrl
}

function actAddCustom() {
    const name     = document.getElementById('cf-name').value.trim()
    const hostname = document.getElementById('cf-hostname').value.trim().replace(/^https?:\/\//,'').replace(/\/$/,'')
    const url      = document.getElementById('cf-url').value.trim()
    const msg      = document.getElementById('cf-msg')

    if (!url.includes('{}')) { msg.className='form-msg err'; msg.textContent='URL must contain {}.'; return }
    try { new URL(url.replace('{}','test')) } catch(e) { msg.className='form-msg err'; msg.textContent='Invalid URL.'; return }

    if (editingId) {
        const engine = engineById(editingId)
        if (!engine) return
        if (engine.isCustom) {
            if (!name || !hostname) { msg.className='form-msg err'; msg.textContent='All fields required.'; return }
            if (allEngines().find(e => e.hostname === hostname && e.id !== editingId)) {
                msg.className='form-msg err'; msg.textContent='Hostname already exists.'; return
            }
            const idx = customEngines.findIndex(e => e.id === editingId)
            if (idx !== -1) customEngines[idx] = { ...customEngines[idx], name, hostname, queryUrl: url }
            persist()
        } else {
            window._urlOverrides = { ...(window._urlOverrides || {}), [editingId]: url }
            saveStorage({ engineUrlOverrides: window._urlOverrides })
        }
        renderLists(); clearForm()
        msg.className='form-msg ok'; msg.textContent='Saved.'
        setTimeout(() => { msg.textContent='' }, 2000)
        return
    }

    if (!name || !hostname || !url) { msg.className='form-msg err'; msg.textContent='All fields required.'; return }
    if (allEngines().find(e => e.hostname === hostname)) { msg.className='form-msg err'; msg.textContent='Hostname already exists.'; return }
    const id = 'custom_' + hostname.replace(/[^a-z0-9]/gi,'_').toLowerCase() + '_' + Date.now()
    customEngines.push({ id, name, hostname, queryUrl: url })
    enabledIds.push(id)
    persist(); renderLists(); clearForm()
    msg.className='form-msg ok'; msg.textContent=`"${name}" added.`
    setTimeout(() => { msg.textContent='' }, 3000)
}


// ─── Preview ──────────────────────────────────────────────────────────────────

function currentIconSize() { return parseInt(document.getElementById('icon-size').value) || 20 }

function updatePreview(size) {
    const bar = document.getElementById('preview-bar')
    bar.querySelectorAll('.preview-engine').forEach(x => x.remove())
    enabledIds.slice(0,10).map(id => engineById(id)).filter(Boolean).forEach((eng, i) => {
        const div = document.createElement('div')
        div.className = 'preview-engine' + (i === 0 ? ' active' : '')
        const img = makeIconImg(eng, size)
        const label = document.createElement('span')
        label.textContent = eng.name
        div.appendChild(img)
        div.appendChild(label)
        bar.appendChild(div)
    })
}

// ─── Permission banner ────────────────────────────────────────────────────────

function isOpera() {
    return navigator.userAgent.includes('OPR/')
}

function checkAndShowBanner() {
    const banner = document.getElementById('perm-banner')
    if (!isOpera()) {
        banner.classList.remove('visible')
        return
    }
    // On Opera: check storage flag written by content script
    const area = chrome.storage.sync || chrome.storage.local
    area.get('contentScriptPermissionGranted', d => {
        if (d && d.contentScriptPermissionGranted) {
            banner.classList.remove('visible')
        } else {
            banner.classList.add('visible')
        }
    })
}

document.getElementById('btn-grant-banner').addEventListener('click', () => {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` })
})

// Listen for storage changes — hide banner as soon as content script sets the flag
chrome.storage.onChanged.addListener((changes, area) => {
    if (changes.contentScriptPermissionGranted && changes.contentScriptPermissionGranted.newValue) {
        document.getElementById('perm-banner').classList.remove('visible')
    }
})

// ─── Tabs ─────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        document.getElementById(btn.getAttribute('data-tab')).classList.add('active')
    })
})

// ─── Wire up buttons ──────────────────────────────────────────────────────────

document.getElementById('btn-enable').onclick        = actEnable
document.getElementById('btn-disable').onclick       = actDisable
document.getElementById('btn-top').onclick           = () => actMove('top')
document.getElementById('btn-up').onclick            = () => actMove('up')
document.getElementById('btn-down').onclick          = () => actMove('down')
document.getElementById('btn-bottom').onclick        = () => actMove('bottom')
document.getElementById('btn-delete-custom').onclick = actDeleteCustom
document.getElementById('btn-edit-custom').onclick   = actEdit
document.getElementById('btn-add-custom').onclick    = actAddCustom
document.getElementById('btn-reset-default').onclick = actResetDefaultUrl
document.getElementById('btn-cancel-edit').onclick   = clearForm

document.getElementById('float-enabled').addEventListener('change', e => {
    saveStorage({ floatButton: { enabled: e.target.checked, iconSize: currentIconSize() } })
})
document.getElementById('ecosia-notif').addEventListener('change', e => {
    saveStorage({ extra: { ecosiaEliminateNotifications: e.target.checked } })
})

const slider   = document.getElementById('icon-size')
const valLabel = document.getElementById('icon-size-val')
slider.addEventListener('input', e => {
    valLabel.textContent = e.target.value
    updatePreview(parseInt(e.target.value))
})
slider.addEventListener('change', e => {
    saveStorage({ floatButton: { enabled: document.getElementById('float-enabled').checked, iconSize: parseInt(e.target.value) } })
})

document.getElementById('btn-reset-engines').onclick = async () => {
    if (!confirm('Reset engine list to defaults?')) return
    await saveStorage({ enabledEngines: DEFAULT_STORAGE.enabledEngines, customEngines: [] })
    await init()
}
document.getElementById('btn-reset-ui').onclick = async () => {
    if (!confirm('Reset UI settings to defaults?')) return
    await saveStorage({ floatButton: DEFAULT_STORAGE.floatButton })
    await init()
}
document.getElementById('btn-reset-extra').onclick = async () => {
    if (!confirm('Reset Extra settings to defaults?')) return
    await saveStorage({ extra: DEFAULT_STORAGE.extra })
    await init()
}

;['cf-name','cf-hostname','cf-url'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') actAddCustom() })
})

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
    const data = await loadStorage()
    enabledIds    = [...(data.enabledEngines || DEFAULT_STORAGE.enabledEngines)]
    customEngines = [...(data.customEngines  || [])]
    window._urlOverrides = data.engineUrlOverrides || {}
    const iconSize = data.floatButton?.iconSize ?? 20
    document.getElementById('float-enabled').checked = data.floatButton?.enabled ?? true
    document.getElementById('ecosia-notif').checked  = data.extra?.ecosiaEliminateNotifications ?? false
    slider.value         = iconSize
    valLabel.textContent = iconSize
    renderLists()
    checkAndShowBanner()
}

init()

}) // end DOMContentLoaded
