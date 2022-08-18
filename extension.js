export default {
    onload: ({ extensionAPI }) => {

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Convert to Numbered List",
            callback: () => numberedList()
        });

        /*
                function ready(fn) {
                    if (document.readyState === "complete" || document.readyState === "interactive") {
                        setTimeout(fn, 1);
                    } else {
                        document.addEventListener("DOMContentLoaded", fn);
                    }
                }
                ready(initiateObserver);
        
                function initiateObserver() {
                    console.log("Starting Mutation Observer for Todoist Tasks");
                    const targetNode = document.getElementsByClassName("rm-xparser-default-Refresh Numbering")[0];
                    console.error(targetNode);
                    const config = { attributes: true, childList: true, subtree: true };
                    const callback = function (mutationsList, observer) {
                        for (const mutation of mutationsList) {
                            //console.error(mutation);
                        }
                    };
                    const observer = new MutationObserver(callback);
                    observer.observe(targetNode, config);
                }
        */
        async function numberedList() {
            var startBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

            let q = `[:find (pull ?page
                [:node/title :block/string :block/uid :block/heading :block/props 
                 :entity/attrs :block/open :block/text-align :children/view-type
                 :block/order {:block/children ...} {:block/parents ...}
                ])
             :where [?page :block/uid "${startBlock}"]  ]`;
            var info = await window.roamAlphaAPI.q(q);

            var buttonString = "{{Refresh}}";
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

            const targetNode = document.getElementsByClassName("rm-xparser-default-Refresh");
            targetNode[0].onclick = numberedList;

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