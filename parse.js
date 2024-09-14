const fs = require('fs');
const path = require('path');

function parseSwitchData(filePath) {
    const data = fs.readFileSync("./binfile/iblatest.unknown", 'utf8');
    const switchData = [];
    const switchPattern = /# IB switch no\.\s*(\d+):\s*(\S+)\s*GUID:\s*(\S+)\s*Description:\s*(.+?)\s*#/g;
    const nodePattern = /SwitchName=(\S+)\s+Nodes=([^\n]+)/g;
    const neighborPattern = /# IB switch no\.\s*\d+:\s*\S+\s*GUID:\s*\S+\s*Description:\s*.+?\s*#([\s\S]+?)SwitchName=/g;

    let match;
    while ((match = switchPattern.exec(data)) !== null) {
        const switchInfo = {
            switch_name: match[2],
            guid: match[3],
            description: match[4],
            nodes: [],
            hasLink: false
        };

        let nodeMatch;
        while ((nodeMatch = nodePattern.exec(data)) !== null) {
            if (nodeMatch[1] === switchInfo.switch_name) {
                switchInfo.nodes = expandNodeRanges(nodeMatch[2].split(',').map(node => node.trim()));
                break;
            }
        }

        const neighborMatch = neighborPattern.exec(data);
        if (neighborMatch) {
            const neighborInfo = neighborMatch[1];
            if (/Switch neighbor\s+CA\s+with/.test(neighborInfo)) {
                switchInfo.hasLink = true;
            }
        }

        switchData.push(switchInfo);
    }
    return switchData;
}

function expandNodeRanges(nodes) {
    const expandedNodes = [];
    let currentRange = '';

    nodes.forEach(node => {
        if (node.includes('[') && !node.includes(']')) {
            currentRange = node;
        } else if (!node.includes('[') && node.includes(']')) {
            currentRange += ',' + node;
            processRange(currentRange, expandedNodes);
            currentRange = '';
        } else if (currentRange) {
            currentRange += ',' + node;
        } else {
            processRange(node, expandedNodes);
        }
    });

    return expandedNodes;
}

function processRange(range, expandedNodes) {
    const rangePattern = /(\w+)\[(.+)\]/;
    const match = rangePattern.exec(range);

    if (match) {
        const prefix = match[1];
        const ranges = match[2].split(',').map(r => r.trim());
        ranges.forEach(subRange => {
            if (subRange.includes('-')) {
                const [start, end] = subRange.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    expandedNodes.push(`${prefix}${i.toString().padStart(3, '0')}`);
                }
            } else {
                expandedNodes.push(`${prefix}${subRange.padStart(3, '0')}`);
            }
        });
    } else {
        const numericPattern = /(\D+)(\d+)/;
        const numericMatch = numericPattern.exec(range);
        if (numericMatch) {
            const prefix = numericMatch[1];
            const number = numericMatch[2];
            expandedNodes.push(`${prefix}${number.padStart(3, '0')}`);
        } else {
            expandedNodes.push(range);
        }
    }
}

const inputFilePath = path.join(__dirname, 'ibtest.unknown');
const outputFilePath = path.join(__dirname, 'parsed_data.json');

const parsedData = parseSwitchData(inputFilePath);

fs.writeFileSync(outputFilePath, JSON.stringify(parsedData, null, 4), 'utf8');

console.log('Data has been parsed and written to parsed_data.json');