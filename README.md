# Switch Search Engine

A browser extension to switch between search engines in one click. Supports custom engines you define yourself.

![Icon](chrome/img/icon128.png)

## Features

- Switch between search engines instantly from a float bar at the bottom of search result pages
- Toolbar button cycles to the next enabled engine
- Enable, disable, and reorder engines from the settings page
- Add custom engines with any URL template using `{}` as the query placeholder
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

## Adding a custom engine

1. Open the extension settings
2. Go to the **Search Engines** tab
3. Fill in the **Add Custom Engine** form:
   - **Name**: display name (e.g. `Kagi`)
   - **Hostname**: domain without protocol (e.g. `kagi.com`)
   - **Search URL**: full URL with `{}` where the query goes (e.g. `https://kagi.com/search?q={}`)
4. Click **Add Engine** — it will be enabled automatically

## Project structure

```
chrome/     Chrome / Opera / Edge (Manifest V3)
firefox/    Firefox desktop + Android (Manifest V2)
```

## Based on

This project is a fork of [kuanyui/EngineSwitcher](https://github.com/kuanyui/EngineSwitcher).

Changes from the original:
- Ported to Chrome/Opera/Edge (Manifest V3)
- Added custom engine support
- New settings UI with tabs and live preview
- Adjustable float bar icon size
- Onboarding page for first-time setup
- New icon
- Renamed to Switch Search Engine

## License

[WTFPL 2.0](LICENSE)
