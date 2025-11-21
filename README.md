This extension allows you to apply hierarchical numbering to blocks on a Roam Research page.

This might be useful if you're writing a book and you need numbered headings for each section.

**New:**
- Configurable number separators
  - default `: `
  - examples: `: `, `) `, ` - `
- Ignore Token: blocks containing this text are skipped when numbering (default `#nonumber`).
  - Ignore descendants (toggle): on = skip the tagged block and its children; off = skip only the tagged block.
  - Hide Ignore Token tags: when enabled, tags matching the ignore token are hidden via injected CSS. Updates automatically when you change the token or toggle the setting.
- Prefix safety: numbering and removal only touch prefixes that match hierarchical patterns like `1:`, `1.2:`, `1.2.3:` using the configured separator.

*Previously:*
- There is a new button now implemented, that will allow you to remove any numbering and return your page to it's original state.
- Indent to any level you like (previous limit was 6)

This gif shows it in action:

![numbered-list](https://user-images.githubusercontent.com/6857790/185312125-8ab8e2f5-6c3c-4e73-8713-c492ea847c83.gif)

If you also have the SmartBlocks extension installed (and you should, it's awesome!), this extension will create a Refresh Numbered List SmartBlock on a Numbered List Extension page. When you use the Command Palette to create a numbered list, a Refresh button will be inserted before your page content. This will allow you to refresh the numbering if you move sections around.

If you don't have the SmartBlocks extension, there won't be a Refresh or Remove button generated. You would need to refresh or remove numbering by using the Command Palette.

This extension will work for blocks indented to any level.
