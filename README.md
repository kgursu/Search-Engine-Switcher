# Switch Search Engine

A browser extension to switch between search engines in one click. Add, edit, and reorder engines to match your preferences.

![Icon](chrome/img/icon128.png)

## Features

- Switch between search engines instantly from a float bar at the bottom of search result pages
- Toolbar button cycles to the next enabled engine
- Enable, disable, and reorder engines from the settings page
- Add, edit, or remove custom and built-in engines
- Adjustable icon size with live preview
- Works on Chrome, Opera, Edge, and Firefox (desktop + Android)

## Supported engines (built-in)

DuckDuckGo, Ecosia, Brave, Gibiru, MetaGer (EN/DE), You.com, StartPage, Yahoo OneSearch, Bing, Google, Yandex (EN/RU), Yahoo!, Yahoo! JAPAN, goo, Wikipedia (English)

## Installation

### Chrome / Opera / Edge

1. Download or clone this repository
2. Go to `chrome://extensions` (or `opera://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `chrome/` folder
5. On the extensions page, enable **"Allow access to search page results"**

The extension opens a setup page on first install to guide you through this.

### Firefox (Desktop) / Firefox for Android

Install from [addons.mozilla.org](https://addons.mozilla.org) once the extension is published there.

### Keyboard shortcut

| Browser | Shortcut |
|---|---|
| Chrome / Opera / Edge | Configurable via `chrome://extensions/shortcuts` |
| Firefox | `Ctrl+Alt+S` |

## Managing search engines

**Add a custom engine:**
1. Open the extension settings → **Search Engines** tab
2. Fill in the form at the bottom: name, hostname, and search URL with `{}` as the query placeholder (e.g. `https://kagi.com/search?q={}`)
3. Click **Add Engine** — it will be enabled automatically

**Edit an engine:**
1. Select any engine from either list
2. Click **Edit**
3. For built-in engines, only the search URL can be changed. Click **Reset to Default URL** to restore the original.
4. For custom engines, all fields are editable
5. Click **Save Changes**

## Project structure

```
chrome/     Chrome / Opera / Edge (Manifest V3)
firefox/    Firefox desktop + Android (Manifest V2)
```

## Based on

This project is a fork of [kuanyui/EngineSwitcher](https://github.com/kuanyui/EngineSwitcher).

Changes from the original:
- Ported to Chrome/Opera/Edge (Manifest V3)
- Added custom engine support with add, edit, and URL override for built-in engines
- New settings UI with tabs and live preview
- Adjustable float bar icon size
- Onboarding page for first-time setup
- New icon
- Renamed to Switch Search Engine

## License

[WTFPL 2.0](LICENSE)
