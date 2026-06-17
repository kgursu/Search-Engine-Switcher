const btn  = document.getElementById('btn-open-ext')
const stat = document.getElementById('status')
const isOpera = navigator.userAgent.includes('OPR/')

async function checkPermission() {
    return new Promise(resolve => {
        chrome.permissions.contains({ origins: ['*://duckduckgo.com/*', '*://www.google.com/*'] }, resolve)
    })
}

function showGranted() {
    btn.textContent = '✓ Access already granted'
    btn.classList.add('success')
    btn.disabled = true
    stat.textContent = "You're all set! You can close this page."
    stat.className = 'status ok'
}

async function init() {
    if (!isOpera) {
        // Non-Opera browsers: skip permission step, just show pin instruction
        document.getElementById('step-permission').style.display = 'none'
        return
    }
    const granted = await checkPermission()
    if (granted) showGranted()
}

btn.addEventListener('click', () => {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` })
    stat.textContent = 'Extensions page opened. Enable "Allow access to search page results" then come back.'
})

// Poll for permission (Opera only)
let pollCount = 0
const poll = setInterval(async () => {
    if (!isOpera) { clearInterval(poll); return }
    if (await checkPermission()) { showGranted(); clearInterval(poll) }
    if (++pollCount > 60) clearInterval(poll)
}, 1000)

init()
