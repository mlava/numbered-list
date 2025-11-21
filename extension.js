var buttonTrigger = false;
var ignoreStyleEl = null;
var ignoreTokenStyleInterval;

function removeIgnoreTokenStyle() {
    if (ignoreStyleEl && ignoreStyleEl.parentNode) {
        ignoreStyleEl.parentNode.removeChild(ignoreStyleEl);
    }
    ignoreStyleEl = null;
}

export default {
    onload: ({ extensionAPI }) => {

        checkFirstRun();

        const NUMBER_PREFIX = /^(\d+(?:\.\d+)*)\s*:\s+/;
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const getNumberSeparator = () => extensionAPI.settings.get("numberSeparator") || ": ";
        const getIgnoreToken = () => extensionAPI.settings.get("ignoreToken") || "#nonumber";
        const getRestartAtHeading = () => false; // temporarily disabled
        const getIgnoreAppliesToChildren = () => {
            const val = extensionAPI.settings.get("ignoreAppliesToChildren");
            return val === undefined ? true : !!val;
        };
        const getHideIgnoreTokenTags = () => !!extensionAPI.settings.get("hideIgnoreTokenTags");
        const getNumberPrefixRegex = () => {
            const separator = getNumberSeparator() || ": ";
            const escapedSeparator = escapeRegExp(separator);
            return new RegExp(`^(\\d+(?:\\.\\d+)*)\\s*${escapedSeparator}\\s*`);
        };
        const shouldIgnoreBlock = (string) => {
            const ignoreToken = getIgnoreToken();
            return !!ignoreToken && string?.includes(ignoreToken);
        };

        extensionAPI.settings.panel.create({
            tabTitle: "Numbered List",
            settings: [
                {
                    id: "numberSeparator",
                    name: "Number Separator",
                    description: "String between the numeric prefix and the block text. E.g. \": \", \") \", \" - \".",
                    action: { type: "input", placeholder: ": " },
                },
                {
                    id: "ignoreToken",
                    name: "Ignore Token",
                    description: "Blocks containing this #tag will not be numbered.",
                    action: { type: "input", placeholder: "nonumber" },
                },
                /* // new feature, commented out for now
                {
                    id: "restartAtHeading",
                    name: "Restart at Heading",
                    description: "Restart numbering at each heading (H1/H2/H3).",
                    action: { type: "switch" },
                },
                */
                {
                    id: "hideIgnoreTokenTags",
                    name: "Hide Ignore Token tags",
                    description: "Hide page-ref tags that match the ignore token (#nonumber by default).",
                    action: { type: "switch" },
                },
                {
                    id: "ignoreAppliesToChildren",
                    name: "Ignore descendants",
                    description: "When on, blocks with the ignore token are skipped along with their children. When off, only the tagged block is skipped.",
                    action: { type: "switch" },
                },
            ],
        });

        const getIgnoreTokenTag = () => {
            const token = getIgnoreToken();
            if (!token) return "";
            const trimmed = token.trim();
            if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
                return trimmed.slice(2, -2).trim();
            }
            if (trimmed.startsWith("#")) {
                return trimmed.slice(1).trim();
            }
            return trimmed;
        };

        const applyIgnoreTokenStyle = () => {
            const hide = getHideIgnoreTokenTags();
            const tagValue = getIgnoreTokenTag();
            if (!hide || !tagValue) {
                removeIgnoreTokenStyle();
                return;
            }
            const css = `span.rm-page-ref.rm-page-ref--tag[data-tag="${tagValue}"] { display: none !important; }`;
            if (!ignoreStyleEl) {
                ignoreStyleEl = document.createElement("style");
                ignoreStyleEl.id = "numbered-list-ignore-token-style";
                document.head.appendChild(ignoreStyleEl);
            }
            ignoreStyleEl.textContent = css;
        };

        applyIgnoreTokenStyle();
        let lastIgnoreToken = getIgnoreToken();
        let lastHideIgnoreTokenTags = getHideIgnoreTokenTags();
        ignoreTokenStyleInterval = setInterval(() => {
            const currentIgnoreToken = getIgnoreToken();
            const currentHide = getHideIgnoreTokenTags();
            if (currentIgnoreToken !== lastIgnoreToken || currentHide !== lastHideIgnoreTokenTags) {
                lastIgnoreToken = currentIgnoreToken;
                lastHideIgnoreTokenTags = currentHide;
                applyIgnoreTokenStyle();
            }
        }, 2000);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Convert to Numbered List",
            callback: () => numberedList()
        });

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Remove Numbered List",
            callback: () => removeNumberedList()
        });

        const args = {
            text: "REFRESHNUMBEREDLIST",
            help: "Refresh Numbered List",
            handler: (context) => async () => {
                buttonTrigger = context.variables.buttonTrigger;
                await numberedList(buttonTrigger);
                return "";
            },
        };

        const args1 = {
            text: "REMOVENUMBEREDLIST",
            help: "Remove Numbered List",
            handler: (context) => async () => {
                buttonTrigger = context.variables.buttonTrigger;
                await removeNumberedList(buttonTrigger);
                return "";
            },
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
            window.roamjs.extension.smartblocks.registerCommand(args1);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1)
            );
        }

        async function numberedList(buttonTrigger) {
            var startBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

            let q = `[:find (pull ?page
                [:node/title :block/string :block/uid :block/heading :block/props 
                 :entity/attrs :block/open :block/text-align :children/view-type
                 :block/order {:block/children ...} {:block/parents ...}
                ])
             :where [?page :block/uid "${startBlock}"]  ]`;
            var info = await window.roamAlphaAPI.q(q);

            var buttonString = "{{Refresh Numbering:SmartBlock:Refresh Numbered List:buttonTrigger=true,RemoveButton=false}} {{Remove Numbering:SmartBlock:Remove Numbered List:buttonTrigger=true,RemoveButton=false}}";
            var sortedInfo = await sortObjectsByOrder(info[0][0].children);
            var orderCorr = 0;
            const separator = getNumberSeparator();
            const restartAtHeading = getRestartAtHeading();
            const numberPrefixRegex = getNumberPrefixRegex();
            const ignoreDescendants = getIgnoreAppliesToChildren();

            if (sortedInfo.length === 0 || sortedInfo[0].string != buttonString) {
                if (info[0][0].parents) {
                    await window.roamAlphaAPI.createBlock({
                        "location": { "parent-uid": info[0][0].parents[0].uid, "order": -1 },
                        "block": { "string": buttonString }
                    });
                } else {
                    await window.roamAlphaAPI.createBlock({
                        "location": { "parent-uid": info[0][0].uid, "order": -1 },
                        "block": { "string": buttonString }
                    });
                }
            } else {
                orderCorr = 1;
            }

            for (var z = 0; z < info[0][0].children.length; z++) {
                if (info[0][0].children[z].string == buttonString) {
                    info[0][0].children.splice(z, 1);
                    z--;
                }
            }

            var topLevelBlocks = await sortObjectsByOrder(info[0][0].children);

            if (restartAtHeading) {
                let itemIndex = 0;
                for (var i = 0; i < topLevelBlocks.length; i++) {
                    const block = topLevelBlocks[i];
                    if (block.string === buttonString) {
                        continue;
                    }
                    const numberSection = itemIndex + 1;
                    if (shouldIgnoreBlock(block.string)) {
                        if (!ignoreDescendants && block.hasOwnProperty('children')) {
                            await numberNestedBlocks(block.children, String(numberSection), separator, numberPrefixRegex);
                        }
                        continue;
                    }
                    if (block.heading > 0) {
                        const cleanedHeading = block.string.replace(numberPrefixRegex, "");
                        if (cleanedHeading !== block.string) {
                            await updateBlock(block.uid, cleanedHeading);
                        }
                        itemIndex = 0;
                        if (block.hasOwnProperty('children')) {
                            await numberNestedBlocks(block.children, "", separator, numberPrefixRegex);
                        }
                        continue;
                    }
                    itemIndex = itemIndex + 1;
                    await applyNumbering(block, String(numberSection), separator, numberPrefixRegex);
                }
            } else {
                for (var i = 0; i < topLevelBlocks.length; i++) {
                    const block = topLevelBlocks[i];
                    if (block.string === buttonString) {
                        continue;
                    }
                    var numberSection = block.order + 1 - orderCorr;
                    if (shouldIgnoreBlock(block.string)) {
                        if (!ignoreDescendants && block.hasOwnProperty('children')) {
                            await numberNestedBlocks(block.children, String(numberSection), separator, numberPrefixRegex);
                        }
                        continue;
                    }
                    await applyNumbering(block, String(numberSection), separator, numberPrefixRegex);
                }
            }

            async function applyNumbering(block, numberSection, separator, prefixRegex) {
                const blockTextString = block.string.replace(prefixRegex, "");
                var headerString = "" + numberSection + separator + blockTextString;
                await updateBlock(block.uid, headerString);
                if (block.hasOwnProperty('children')) {
                    await numberNestedBlocks(block.children, numberSection, separator, prefixRegex);
                }
            }

            async function numberNestedBlocks(blocks, headerString, separator, prefixRegex) {
                var sortedBlocks = await sortObjectsByOrder(blocks);
                for (var j = 0; j < sortedBlocks.length; j++) {
                    const child = sortedBlocks[j];
                    var numberSubSection = child.order + 1;
                    var newHeader = headerString ? headerString + "." + numberSubSection : "" + numberSubSection;
                    if (shouldIgnoreBlock(child.string)) {
                        if (!ignoreDescendants && child.hasOwnProperty('children')) {
                            await numberNestedBlocks(child.children, newHeader, separator, prefixRegex);
                        }
                        continue;
                    }
                    var blockTextSubString = child.string.replace(prefixRegex, "");
                    var headerSubString = newHeader + separator + blockTextSubString;
                    await updateBlock(child.uid, headerSubString);
                    if (child.hasOwnProperty('children')) { 
                        await numberNestedBlocks(child.children, newHeader, separator, prefixRegex);
                    }
                }
            }
            buttonTrigger = false;
            var results = await window.roamAlphaAPI.q(q);
            for (var m = 0; m < results[0][0].children.length; m++) {
                if (results[0][0].children[m].string == buttonString) {
                    for (var n = 0; n < results[0][0].children[m].children?.length; n++) {
                        window.roamAlphaAPI.deleteBlock({
                            "block": { "uid": results[0][0].children[m].children[n].uid }
                        })
                    }
                }
            }
            return "";
        };

        async function removeNumberedList(buttonTrigger) {
            var startBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

            let q = `[:find (pull ?page
                [:node/title :block/string :block/uid :block/heading :block/props 
                 :entity/attrs :block/open :block/text-align :children/view-type
                 :block/order {:block/children ...} {:block/parents ...}
                ])
             :where [?page :block/uid "${startBlock}"]  ]`;
            var info = await window.roamAlphaAPI.q(q);

            var buttonString = "{{Refresh Numbering:SmartBlock:Refresh Numbered List:buttonTrigger=true,RemoveButton=false}} {{Remove Numbering:SmartBlock:Remove Numbered List:buttonTrigger=true,RemoveButton=false}}";
            const numberPrefixRegex = getNumberPrefixRegex();

            for (var z = 0; z < info[0][0].children.length; z++) {
                if (info[0][0].children[z].string == buttonString) {
                    info[0][0].children.splice(z, 1);
                    z--;
                }
            }
            await loop(info[0][0].children);

            async function loop(blocks) {
                for (var i = 0; i < blocks.length; i++) {
                    var blockTextString = blocks[i].string.replace(numberPrefixRegex, "");
                    if (blockTextString !== blocks[i].string) {
                        await updateBlock(blocks[i].uid, blockTextString);
                    }
                    if (blocks[i].hasOwnProperty('children')) {
                        await loop(blocks[i].children)
                    }
                }
            }

            buttonTrigger = false;
            var results = await window.roamAlphaAPI.q(q);
            for (var m = 0; m < results[0][0].children.length; m++) {
                if (results[0][0].children[m].string == buttonString) {
                    for (var n = 0; n < results[0][0].children[m].children?.length; n++) {
                        window.roamAlphaAPI.deleteBlock({
                            "block": { "uid": results[0][0].children[m].children[n].uid }
                        })
                    }
                }
            }
            return "";
        };
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Convert to Numbered List'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Remove Numbered List'
        });
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("REFRESHNUMBEREDLIST");
            window.roamjs.extension.smartblocks.unregisterCommand("REMOVENUMBEREDLIST");
        };
        if (typeof removeIgnoreTokenStyle === "function") {
            removeIgnoreTokenStyle();
        }
        if (typeof ignoreTokenStyleInterval !== "undefined") {
            clearInterval(ignoreTokenStyleInterval);
        }
    }
}

async function checkFirstRun() {
    var page = await window.roamAlphaAPI.q(`[:find (pull ?page [:block/string :block/uid {:block/children ...}]) :where [?page :node/title "Numbered List Extension"]  ]`);
    if (page.length == 0) { // no page created, so create one
        let newUid = roamAlphaAPI.util.generateUID();
        await window.roamAlphaAPI.createPage({ page: { title: "Numbered List Extension", uid: newUid } });
        let string1 = "Thank you for installing the Numbered List extension for Roam Research. This page has been automatically generated to allow creation of a SmartBlock to allow you to refresh your numbered lists after you move things around and re-order them.";
        await createBlock(string1, newUid, 0);
        let string2 = "Below the horizontal line are the Refresh Numbered List and Remove Numbered List SmartBlocks. Please don't change them unless you know what you are doing!";
        await createBlock(string2, newUid, 1);
        let string3 = "---";
        await createBlock(string3, newUid, 2);
        let string4 = "#SmartBlock Refresh Numbered List";
        let subUID = await createBlock(string4, newUid, 3);
        let string5 = "<%REFRESHNUMBEREDLIST%>";
        await createBlock(string5, subUID, 1);
        let string6 = "#SmartBlock Remove Numbered List";
        let subUID1 = await createBlock(string6, newUid, 4);
        let string7 = "<%REMOVENUMBEREDLIST%>";
        await createBlock(string7, subUID1, 1);
        await window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid: newUid } });
    } else {
        let blocks = page[0][0].children;
        var remove = undefined;
        if (blocks.length > 0) {
            for (var i = 0; i < blocks.length; i++) {
                if (blocks[i].string == "#SmartBlock Remove Numbered List") {
                    remove = blocks[i].uid;
                }
            }
        }
        if (remove == undefined) {
            let string6 = "#SmartBlock Remove Numbered List";
            let subUID1 = await createBlock(string6, page[0][0].uid, 4);
            let string7 = "<%REMOVENUMBEREDLIST%>";
            await createBlock(string7, subUID1, 1);
        }
    }
}

async function createBlock(string, uid, order) {
    let newUid = roamAlphaAPI.util.generateUID();
    await window.roamAlphaAPI.createBlock(
        {
            location: { "parent-uid": uid, order: order },
            block: { string: string.toString(), uid: newUid }
        });
    return newUid;
}

async function updateBlock(blockUID, string) {
    await window.roamAlphaAPI.updateBlock(
        { block: { uid: blockUID, string: string.toString(), open: true } });
}

async function sortObjectsByOrder(o) {
    return o.sort(function (a, b) {
        return a.order - b.order;
    });
}
