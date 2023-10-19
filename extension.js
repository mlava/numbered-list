var buttonTrigger = false;

export default {
    onload: ({ extensionAPI }) => {

        checkFirstRun();

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
            handler: (context) => () => {
                buttonTrigger = context.variables.buttonTrigger;
                numberedList(buttonTrigger);
            },
        };

        const args1 = {
            text: "REMOVENUMBEREDLIST",
            help: "Remove Numbered List",
            handler: (context) => () => {
                buttonTrigger = context.variables.buttonTrigger;
                removeNumberedList(buttonTrigger);
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

            if (sortedInfo[0].string != buttonString) {
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

            for (var i = 0; i < info[0][0].children.length; i++) {
                const regex = /^\d.{0,10}: /;
                var numberSection = info[0][0].children[i].order + 1 - orderCorr;
                var blockTextString = info[0][0].children[i].string.replace(regex, "");
                var headerString = "" + numberSection + ": " + blockTextString;
                await updateBlock(info[0][0].children[i].uid, headerString);
                if (info[0][0].children[i].hasOwnProperty('children')) {
                    await loop(info[0][0].children[i], numberSection);
                }
            }

            async function loop(blocks, headerString) {
                for (var j = 0; j < blocks.children.length; j++) {
                    const regex = /^\d.{0,10}: /;
                    var numberSubSection = blocks.children[j].order + 1;
                    var newHeader = headerString + "." + numberSubSection;
                    var blockTextSubString = blocks.children[j].string.replace(regex, "");
                    var headerSubString = newHeader + ": " + blockTextSubString;
                    await updateBlock(blocks.children[j].uid, headerSubString);
                    if (blocks.children[j].hasOwnProperty('children')) { 
                        await loop(blocks.children[j], newHeader);
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
            return;
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

            for (var z = 0; z < info[0][0].children.length; z++) {
                if (info[0][0].children[z].string == buttonString) {
                    info[0][0].children.splice(z, 1);
                    z--;
                }
            }
            await loop(info[0][0].children);

            async function loop(blocks) {
                for (var i = 0; i < blocks.length; i++) {
                    const regex = /^\d.{0,10}: /;
                    var blockTextString = blocks[i].string.replace(regex, "");
                    await updateBlock(blocks[i].uid, blockTextString);
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
            return;
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