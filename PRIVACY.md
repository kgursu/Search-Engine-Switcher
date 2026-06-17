# Privacy Policy — Switch Search Engine

**Last updated: June 2026**

Switch Search Engine does not collect, store, transmit, or share any personal data.

## What the extension does

- Reads the search query from the current search results page to redirect it to another engine
- Saves your preferences (enabled engines, their order, UI settings) locally in your browser using the browser's built-in storage API

## What data is stored

Your preferences are stored exclusively in your browser's local/sync storage (`chrome.storage` or `browser.storage`). This data never leaves your device unless you use your browser's built-in sync feature, in which case it is handled entirely by your browser vendor (Google or Mozilla).

## What data is not collected

- No personal information
- No browsing history
- No search queries
- No usage statistics or analytics
- No data is sent to any server

## Permissions

- **tabs**: Used to read the current tab's URL and redirect it to the selected search engine.
- **storage**: Used to save your settings locally in the browser.
- **Host permissions** (search engine domains): Used to inject the engine switcher bar on search result pages and read the current search query from the page.

## Third parties

No data is shared with any third party. The extension does not use any external services, analytics tools, or remote code.

## Contact

If you have questions, open an issue at [github.com/kgursu/Search-Engine-Switcher](https://github.com/kgursu/Search-Engine-Switcher).
