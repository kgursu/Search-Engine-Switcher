// options.js — Firefox (self-contained, no common.js dependency)

const _br = (typeof browser !== 'undefined') ? browser : chrome
const store = _br.storage.sync || _br.storage.local

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
    extra: { ecosiaEliminateNotifications: false },
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function loadStorage() {
    return store.get(null).then(function(raw) {
        var data = (raw && typeof raw === 'object') ? raw : {}
        if (!data.enabledEngines || !data.enabledEngines.length) {
            store.set(DEFAULT_STORAGE)
            return Object.assign({}, DEFAULT_STORAGE)
        }
        return Object.assign({}, DEFAULT_STORAGE, data, {
            customEngines: data.customEngines || [],
            floatButton: Object.assign({}, DEFAULT_STORAGE.floatButton, data.floatButton || {}),
            extra: Object.assign({}, DEFAULT_STORAGE.extra, data.extra || {}),
        })
    }).catch(function() {
        return Object.assign({}, DEFAULT_STORAGE)
    })
}

function saveStorage(partial) {
    return store.set(partial)
}

// ─── Engine helpers ───────────────────────────────────────────────────────────

function iconUrl(id) {
    var file = ICON_MAP[id]
    return file ? _br.runtime.getURL('img/engines/' + file) : null
}

function getAllEngines(customs) {
    var builtins = BUILTIN_ENGINES.map(function(e) {
        return Object.assign({}, e, { iconUrl: iconUrl(e.id), isCustom: false })
    })
    var custom = (customs || []).map(function(e) {
        return Object.assign({}, e, { iconUrl: null, isCustom: true })
    })
    return builtins.concat(custom)
}

// ─── State ────────────────────────────────────────────────────────────────────

var selectedId = null
var enabledIds = []
var customEngines = []

function allEngines() { return getAllEngines(customEngines) }
function engineById(id) {
    var all = allEngines()
    for (var i = 0; i < all.length; i++) { if (all[i].id === id) return all[i] }
    return null
}

// ─── Render ───────────────────────────────────────────────────────────────────

function makeIconImg(engine, size) {
    var img = document.createElement('img')
    img.alt = engine.name
    if (size) { img.width = size; img.height = size }
    img.src = engine.iconUrl || ('https://www.google.com/s2/favicons?domain=' + engine.hostname + '&sz=32')
    img.onerror = function() { img.style.visibility = 'hidden' }
    return img
}

function renderLists() {
    var disEl = document.getElementById('list-disabled')
    var enEl  = document.getElementById('list-enabled')
    disEl.innerHTML = ''
    enEl.innerHTML  = ''
    var enabledSet = {}
    enabledIds.forEach(function(id) { enabledSet[id] = true })
    allEngines().forEach(function(eng) {
        if (!enabledSet[eng.id]) disEl.appendChild(makeLi(eng, false, null))
    })
    enabledIds.forEach(function(id, i) {
        var eng = engineById(id)
        if (eng) enEl.appendChild(makeLi(eng, true, i + 1))
    })
    renderButtons()
    updatePreview(currentIconSize())
}

function makeLi(engine, isEnabled, orderNo) {
    var li = document.createElement('li')
    if (selectedId === engine.id) li.classList.add('selected')
    li.onclick = function() {
        selectedId = selectedId === engine.id ? null : engine.id
        renderLists()
    }
    if (isEnabled && orderNo !== null) {
        var no = document.createElement('span')
        no.className = 'eng-no'
        no.textContent = orderNo
        li.appendChild(no)
    }
    var img = makeIconImg(engine, 18)
    img.className = 'eng-icon'
    li.appendChild(img)
    var name = document.createElement('span')
    name.className = 'eng-name'
    name.textContent = engine.name
    li.appendChild(name)
    if (engine.isCustom) {
        var badge = document.createElement('span')
        badge.className = 'custom-badge'
        badge.textContent = 'custom'
        li.appendChild(badge)
    }
    return li
}

function renderButtons() {
    var ids = ['btn-enable','btn-disable','btn-top','btn-up','btn-down','btn-bottom','btn-delete-custom']
    ids.forEach(function(id) { document.getElementById(id).disabled = true })
    if (!selectedId) return
    var isEnabled = enabledIds.indexOf(selectedId) !== -1
    var engine = engineById(selectedId)
    if (!engine) return
    if (!isEnabled) {
        document.getElementById('btn-enable').disabled = false
        if (engine.isCustom) document.getElementById('btn-delete-custom').disabled = false
        return
    }
    document.getElementById('btn-disable').disabled = false
    var i = enabledIds.indexOf(selectedId)
    if (i > 0) {
        document.getElementById('btn-top').disabled = false
        document.getElementById('btn-up').disabled = false
    }
    if (i < enabledIds.length - 1) {
        document.getElementById('btn-bottom').disabled = false
        document.getElementById('btn-down').disabled = false
    }
    if (engine.isCustom) document.getElementById('btn-delete-custom').disabled = false
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function persist() { saveStorage({ enabledEngines: enabledIds, customEngines: customEngines }) }

function actEnable() {
    if (!selectedId || enabledIds.indexOf(selectedId) !== -1) return
    enabledIds.push(selectedId); persist(); renderLists()
}
function actDisable() {
    var i = enabledIds.indexOf(selectedId)
    if (i === -1) return
    enabledIds.splice(i, 1); persist(); renderLists()
}
function actMove(dir) {
    var i = enabledIds.indexOf(selectedId)
    if (i === -1) return
    var tmp
    if (dir === 'top')         { enabledIds.splice(i,1); enabledIds.unshift(selectedId) }
    else if (dir === 'bottom') { enabledIds.splice(i,1); enabledIds.push(selectedId) }
    else if (dir === 'up' && i > 0) {
        tmp = enabledIds[i]; enabledIds[i] = enabledIds[i-1]; enabledIds[i-1] = tmp
    }
    else if (dir === 'down' && i < enabledIds.length - 1) {
        tmp = enabledIds[i]; enabledIds[i] = enabledIds[i+1]; enabledIds[i+1] = tmp
    }
    persist(); renderLists()
}
function actDeleteCustom() {
    var eng = engineById(selectedId)
    if (!eng || !eng.isCustom) return
    if (!confirm('Delete "' + eng.name + '"?')) return
    customEngines = customEngines.filter(function(e) { return e.id !== selectedId })
    enabledIds = enabledIds.filter(function(id) { return id !== selectedId })
    selectedId = null
    persist(); renderLists()
}
function actAddCustom() {
    var name     = document.getElementById('cf-name').value.trim()
    var hostname = document.getElementById('cf-hostname').value.trim().replace(/^https?:\/\//,'').replace(/\/$/,'')
    var url      = document.getElementById('cf-url').value.trim()
    var msg      = document.getElementById('cf-msg')
    if (!name || !hostname || !url) { msg.className='form-msg err'; msg.textContent='All fields required.'; return }
    if (url.indexOf('{}') === -1) { msg.className='form-msg err'; msg.textContent='URL must contain {}.'; return }
    try { new URL(url.replace('{}','test')) } catch(e) { msg.className='form-msg err'; msg.textContent='Invalid URL.'; return }
    if (allEngines().some(function(e) { return e.hostname === hostname })) {
        msg.className='form-msg err'; msg.textContent='Hostname already exists.'; return
    }
    var id = 'custom_' + hostname.replace(/[^a-z0-9]/gi,'_').toLowerCase() + '_' + Date.now()
    customEngines.push({ id: id, name: name, hostname: hostname, queryUrl: url })
    enabledIds.push(id)
    persist(); renderLists()
    document.getElementById('cf-name').value = ''
    document.getElementById('cf-hostname').value = ''
    document.getElementById('cf-url').value = ''
    msg.className='form-msg ok'; msg.textContent='"' + name + '" added.'
    setTimeout(function() { msg.textContent='' }, 3000)
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function currentIconSize() { return parseInt(document.getElementById('icon-size').value) || 20 }

function updatePreview(size) {
    var bar = document.getElementById('preview-bar')
    bar.querySelectorAll('.preview-engine').forEach(function(x) { x.remove() })
    enabledIds.slice(0,10).forEach(function(id, i) {
        var eng = engineById(id)
        if (!eng) return
        var div = document.createElement('div')
        div.className = 'preview-engine' + (i === 0 ? ' active' : '')
        var img = makeIconImg(eng, size)
        var label = document.createElement('span')
        label.textContent = eng.name
        div.appendChild(img)
        div.appendChild(label)
        bar.appendChild(div)
    })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active') })
            document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active') })
            btn.classList.add('active')
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active')
        })
    })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
    loadStorage().then(function(data) {
        enabledIds    = (data.enabledEngines || DEFAULT_STORAGE.enabledEngines).slice()
        customEngines = (data.customEngines  || []).slice()
        var iconSize  = (data.floatButton && data.floatButton.iconSize) ? data.floatButton.iconSize : 20
        document.getElementById('float-enabled').checked = data.floatButton ? data.floatButton.enabled !== false : true
        document.getElementById('ecosia-notif').checked  = data.extra ? !!data.extra.ecosiaEliminateNotifications : false
        document.getElementById('icon-size').value       = iconSize
        document.getElementById('icon-size-val').textContent = iconSize
        renderLists()
        initTabs()
        bindEvents()
    })
}

function bindEvents() {
    document.getElementById('btn-enable').onclick        = actEnable
    document.getElementById('btn-disable').onclick       = actDisable
    document.getElementById('btn-top').onclick           = function() { actMove('top') }
    document.getElementById('btn-up').onclick            = function() { actMove('up') }
    document.getElementById('btn-down').onclick          = function() { actMove('down') }
    document.getElementById('btn-bottom').onclick        = function() { actMove('bottom') }
    document.getElementById('btn-delete-custom').onclick = actDeleteCustom
    document.getElementById('btn-add-custom').onclick    = actAddCustom

    document.getElementById('float-enabled').addEventListener('change', function(e) {
        saveStorage({ floatButton: { enabled: e.target.checked, iconSize: currentIconSize() } })
    })
    document.getElementById('ecosia-notif').addEventListener('change', function(e) {
        saveStorage({ extra: { ecosiaEliminateNotifications: e.target.checked } })
    })

    var slider   = document.getElementById('icon-size')
    var valLabel = document.getElementById('icon-size-val')
    slider.addEventListener('input', function(e) {
        valLabel.textContent = e.target.value
        updatePreview(parseInt(e.target.value))
    })
    slider.addEventListener('change', function(e) {
        saveStorage({ floatButton: { enabled: document.getElementById('float-enabled').checked, iconSize: parseInt(e.target.value) } })
    })

    document.getElementById('btn-reset-engines').onclick = function() {
        if (!confirm('Reset engine list to defaults?')) return
        saveStorage({ enabledEngines: DEFAULT_STORAGE.enabledEngines, customEngines: [] }).then(init)
    }
    document.getElementById('btn-reset-ui').onclick = function() {
        if (!confirm('Reset UI settings to defaults?')) return
        saveStorage({ floatButton: DEFAULT_STORAGE.floatButton }).then(init)
    }
    document.getElementById('btn-reset-extra').onclick = function() {
        if (!confirm('Reset Extra settings to defaults?')) return
        saveStorage({ extra: DEFAULT_STORAGE.extra }).then(init)
    }

    ;['cf-name','cf-hostname','cf-url'].forEach(function(id) {
        document.getElementById(id).addEventListener('keydown', function(e) {
            if (e.key === 'Enter') actAddCustom()
        })
    })
}

document.addEventListener('DOMContentLoaded', init)
