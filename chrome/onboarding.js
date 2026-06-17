const btn  = document.getElementById('btn-open-ext')
const stat = document.getElementById('status')

async function checkPermission() {
    return new Promise(resolve => {
        chrome.storage.sync.get('contentScriptPermissionGranted', d => {
            resolve(!!(d && d.contentScriptPermissionGranted))
        })
    })
}

async function init() {
    const granted = await checkPermission()
    if (granted) showGranted()
}

function showGranted() {
    btn.textContent = '✓ Access already granted'
    btn.classList.add('success')
    btn.disabled = true
    stat.textContent = "You're all set! You can close this page."
    stat.className = 'status ok'
}

btn.addEventListener('click', () => {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` })
    stat.textContent = 'Extensions page opened. Enable "Allow access to search page results" then visit any search page.'
})

// Poll for permission flag
let pollCount = 0
const poll = setInterval(async () => {
    if (await checkPermission()) { showGranted(); clearInterval(poll) }
    if (++pollCount > 60) clearInterval(poll)
}, 1000)

init()
