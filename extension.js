var buttonTrigger = false;

export default {
    onload: ({ extensionAPI }) => {
        var buttonUid;

        checkFirstRun();

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Convert to Numbered List",
            callback: () => numberedList()
        });

        const args = {
            text: "REFRESHNUMBEREDLIST",
            help: "Refresh Numbered List",
            handler: (context) => () => {
                buttonUid = context.targetUid;
                buttonTrigger = context.variables.buttonTrigger;
                numberedList(buttonTrigger, buttonUid);
            },
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args)
            );
        }

        async function numberedList(buttonTrigger, buttonUid) {
            var startBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

            let q = `[:find (pull ?page
                [:node/title :block/string :block/uid :block/heading :block/props 
                 :entity/attrs :block/open :block/text-align :children/view-type
                 :block/order {:block/children ...} {:block/parents ...}
                ])
             :where [?page :block/uid "${startBlock}"]  ]`;
            var info = await window.roamAlphaAPI.q(q);

            var buttonString = "{{Refresh:SmartBlock:Refresh Numbered List:buttonTrigger=true,RemoveButton=false}}";
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
                    for (var j = 0; j < info[0][0].children[i].children.length; j++) {
                        var numberSubSection = info[0][0].children[i].children[j].order + 1;
                        var blockTextSubString = info[0][0].children[i].children[j].string.replace(regex, "");
                        var headerSubString = "" + numberSection + "." + numberSubSection + ": " + blockTextSubString;
                        await updateBlock(info[0][0].children[i].children[j].uid, headerSubString);
                        if (info[0][0].children[i].children[j].hasOwnProperty('children')) {
                            for (var k = 0; k < info[0][0].children[i].children[j].children.length; k++) {
                                var numberSubSubSection = info[0][0].children[i].children[j].children[k].order + 1;
                                var blockTextSubSubString = info[0][0].children[i].children[j].children[k].string.replace(regex, "");
                                var headerSubSubString = "" + numberSection + "." + numberSubSection + "." + numberSubSubSection + ": " + blockTextSubSubString;
                                await updateBlock(info[0][0].children[i].children[j].children[k].uid, headerSubSubString);
                                if (info[0][0].children[i].children[j].children[k].hasOwnProperty('children')) {
                                    for (var l = 0; l < info[0][0].children[i].children[j].children[k].children.length; l++) {
                                        var numberSubSubSubSection = info[0][0].children[i].children[j].children[k].children[l].order + 1;
                                        var blockTextSubSubSubString = info[0][0].children[i].children[j].children[k].children[l].string.replace(regex, "");
                                        var headerSubSubSubString = "" + numberSection + "." + numberSubSection + "." + numberSubSubSection + "." + numberSubSubSubSection + ": " + blockTextSubSubSubString;
                                        await updateBlock(info[0][0].children[i].children[j].children[k].children[l].uid, headerSubSubSubString);
                                        if (info[0][0].children[i].children[j].children[k].children[l].hasOwnProperty('children')) {
                                            for (var m = 0; m < info[0][0].children[i].children[j].children[k].children[l].children.length; m++) {
                                                var numberSubSubSubSubSection = info[0][0].children[i].children[j].children[k].children[l].children[m].order + 1;
                                                var blockTextSubSubSubSubString = info[0][0].children[i].children[j].children[k].children[l].children[m].string.replace(regex, "");
                                                var headerSubSubSubSubString = "" + numberSection + "." + numberSubSection + "." + numberSubSubSection + "." + numberSubSubSubSection + "." + numberSubSubSubSubSection + ": " + blockTextSubSubSubSubString;
                                                await updateBlock(info[0][0].children[i].children[j].children[k].children[l].children[m].uid, headerSubSubSubSubString);
                                                if (info[0][0].children[i].children[j].children[k].children[l].children[m].hasOwnProperty('children')) {
                                                    for (var n = 0; n < info[0][0].children[i].children[j].children[k].children[l].children[m].children.length; n++) {
                                                        var numberSubSubSubSubSubSection = info[0][0].children[i].children[j].children[k].children[l].children[m].children[n].order + 1;
                                                        var blockTextSubSubSubSubSubString = info[0][0].children[i].children[j].children[k].children[l].children[m].children[n].string.replace(regex, "");
                                                        var headerSubSubSubSubSubString = "" + numberSection + "." + numberSubSection + "." + numberSubSubSection + "." + numberSubSubSubSection + "." + numberSubSubSubSubSection + "." + numberSubSubSubSubSubSection + ": " + blockTextSubSubSubSubSubString;
                                                        await updateBlock(info[0][0].children[i].children[j].children[k].children[l].children[m].children[n].uid, headerSubSubSubSubSubString);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            buttonTrigger = false;
            var results = await window.roamAlphaAPI.q(q);
            for (var m = 0; m < results[0][0].children.length; m++) {
                if (results[0][0].children[m].string == buttonString) {
                    for (var n=0; n<results[0][0].children[m].children?.length; n++) {
                        window.roamAlphaAPI.deleteBlock({"block": { "uid": results[0][0].children[m].children[n].uid }
                        })
                    }
                }
            }
            return;
        };
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'JSON to Webhook'
        });
    }
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

async function checkFirstRun() {
    var page = await window.roamAlphaAPI.q(`[:find ?e :where [?e :node/title "Numbered List Extension"]]`);
    if (page.length > 0) { // the page already exists
        return;
    } else { // no workspaces page created, so create one
        let newUid = roamAlphaAPI.util.generateUID();
        await window.roamAlphaAPI.createPage({ page: { title: "Numbered List Extension", uid: newUid } });
        let string1 = "Thank you for installing the Numbered List extension for Roam Research. This page has been automatically generated to allow creation of a SmartBlock to allow you to refresh your numbered lists after you move things around and re-order them.";
        await createBlock(string1, newUid, 0);
        let string2 = "Below the horizontal line is the Refresh Numbered List SmartBlock. Please don't change it unless you know what you are doing!";
        await createBlock(string2, newUid, 1);
        let string3 = "---";
        await createBlock(string3, newUid, 2);
        let string4 = "#SmartBlock Refresh Numbered List";
        let subUID = await createBlock(string4, newUid, 3);
        let string5 = "<%REFRESHNUMBEREDLIST%>";
        await createBlock(string5, subUID, 1);
        await window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid: newUid } });
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