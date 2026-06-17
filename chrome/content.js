// content.js — injected into search engine pages


// ─── Query extraction ─────────────────────────────────────────────────────────

function smartGetQueryString() {
    const url = document.location.href
    if (url.includes('startpage.com')) {
        const el = document.querySelector('#q')
        if (el) return el.value
    }
    if (url.includes('onesearch.com')) {
        const el = document.querySelector('#yschsp')
        if (el) return el.value
    }
    const params = new URLSearchParams(new URL(url).search)
    for (const key of ['q', 'p', 'text', 'query', 'search', 'eingabe', 'MT']) {
        const val = params.get(key)
        if (val) return val
    }
    return ''
}

// Reply to background's query request
_br.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getQueryString') {
        sendResponse({ type: 'getQueryString', data: smartGetQueryString() })
        return true
    }
})

// ─── Float bar ────────────────────────────────────────────────────────────────

function removeFloatBar() {
    document.querySelectorAll('.es-elem').forEach(x => x.remove())
}

function makeIcon(engine) {
    const img = document.createElement('img')
    img.className = 'es-icon'
    img.alt = engine.name
    img.src = engine.iconUrl
        || `https://www.google.com/s2/favicons?domain=${engine.hostname}&sz=32`
    img.onerror = () => { img.style.visibility = 'hidden' }
    return img
}

async function setupFloatBar(iconSize) {
    iconSize = iconSize || 20
    removeFloatBar()

    let engines = []
    try {
        const res = await new Promise(resolve =>
            _br.runtime.sendMessage({ type: 'getEnabledEngines' }, resolve)
        )
        if (res && res.data) engines = res.data
    } catch(e) { return }
    if (!engines.length) return

    const query = smartGetQueryString()

    const style = document.createElement('style')
    style.className = 'es-elem'
    style.textContent = `
    #es-bar {
        --es-icon-size:${iconSize}px;
        --bg:#fff; --bg-act:#e8e8e8; --bd:#ccc; --ind:#4a90d9;
        display:flex; position:fixed; z-index:2147483647;
        bottom:0; left:0; right:0;
        background:var(--bg); border-top:1px solid var(--bd);
        box-shadow:0 -2px 8px rgba(0,0,0,.1);
        font-family:system-ui,sans-serif;
    }
    #es-bar .es-scroll {
        display:flex; overflow-x:auto; flex:1; scrollbar-width:none;
    }
    #es-bar .es-scroll::-webkit-scrollbar { display:none }
    #es-bar a.es-link {
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; padding:4px 12px; text-decoration:none;
        color:#333; white-space:nowrap; min-width:56px; gap:2px;
        border-bottom:3px solid transparent; box-sizing:border-box;
    }
    #es-bar a.es-link:hover { background:var(--bg-act) }
    #es-bar a.es-link.active { background:var(--bg-act); border-bottom-color:var(--ind) }
    #es-bar .es-icon { width:var(--es-icon-size,20px); height:var(--es-icon-size,20px); object-fit:contain }
    #es-bar .es-label { font-size:9px; color:#666; max-width:60px; overflow:hidden; text-overflow:ellipsis }
    #es-bar .es-close {
        display:flex; align-items:center; justify-content:center;
        width:40px; min-width:40px; cursor:pointer; border:none;
        background:none; color:#999; font-size:18px; padding:0;
    }
    #es-bar .es-close:hover { color:#333; background:var(--bg-act) }
    body { padding-bottom:calc(var(--es-icon-size,20px) + 20px) !important }
    @media(prefers-color-scheme:dark){
        #es-bar { --bg:#1a1a1a; --bg-act:#2e2e2e; --bd:#444; --ind:#6aabff }
        #es-bar a.es-link { color:#ddd }
        #es-bar .es-label { color:#aaa }
        #es-bar .es-close { color:#888 }
        #es-bar .es-close:hover { color:#ddd }
    }`

    const bar = document.createElement('div')
    bar.id = 'es-bar'
    bar.className = 'es-elem'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'es-close'
    closeBtn.title = 'Close'
    closeBtn.textContent = '✕'
    closeBtn.onclick = removeFloatBar
    bar.appendChild(closeBtn)

    const scroll = document.createElement('div')
    scroll.className = 'es-scroll'

    for (const eng of engines) {
        const href = query
            ? eng.queryUrl.replace('{}', encodeURIComponent(query))
            : `https://${eng.hostname}`
        const a = document.createElement('a')
        a.href = href
        a.className = 'es-link'
        a.target = '_self'
        const curHost = document.location.hostname
        if (curHost.includes(eng.hostname) || eng.hostname.includes(curHost)) {
            a.classList.add('active')
        }
        a.appendChild(makeIcon(eng))
        const label = document.createElement('span')
        label.className = 'es-label'
        label.title = eng.name
        label.textContent = eng.name
        a.appendChild(label)
        scroll.appendChild(a)
    }

    bar.appendChild(scroll)
    document.head.appendChild(style)
    document.body.appendChild(bar)
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function 
init() {
    _getArea().get(['floatButton', 'extra'], (data) => {
        const floatEnabled = !data || !data.floatButton || data.floatButton.enabled !== false
        if (!floatEnabled) return

        if (data && data.extra && data.extra.ecosiaEliminateNotifications
            && document.location.hostname.includes('ecosia.org')) {
            const s = document.createElement('style')
            s.className = 'es-elem'
            s.textContent = `.main-header .banner,.js-notifications-banner,.banner.cookie-notice,.modal.privacy-modal{display:none!important}`
            document.head && document.head.appendChild(s)
        }

        const iconSize = (data && data.floatButton && data.floatButton.iconSize) || 20
        const run = () => setupFloatBar(iconSize)
        if (document.body) { run() } else { document.addEventListener('DOMContentLoaded', run) }
    })
}

// _getArea must be available (loaded via common.js before content.js)

// Mark that content script has run (permission is granted)
_getArea().set({ contentScriptPermissionGranted: true })

init()
