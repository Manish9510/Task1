const fs = require('fs');

const data = JSON.parse(fs.readFileSync('parsed_data.json', 'utf8'));

let l2Switches = [];
let l1Switches = [];

data.forEach(switchObj => {
    if (switchObj.hasLink) {
        l1Switches.push({
            switch_name: switchObj.switch_name,
            nodes: switchObj.nodes
        });
    } else {
        l2Switches.push({
            switch_name: switchObj.switch_name
        });
    }
});

let l1SwitchMap = new Map();
l1Switches.forEach(l1 => {
    l1SwitchMap.set(l1.switch_name, l1);
});

l1Switches.forEach(l1Switch => {
    l1Switch.nodes.forEach(node => {
        let l0Switch = data.find(sw => sw.switch_name === node && !sw.hasLink);
        if (l0Switch) {
            if (!l1Switch.nodes) {
                l1Switch.nodes = [];
            }
            l1Switch.nodes.push({
                switch_name: node
            });
        }
    });
});

const result = {
    l2Switches,
    l1Switches
};

fs.writeFileSync('result.json', JSON.stringify(result, null, 2), 'utf8');

console.log('Data has been structured and saved to result_new.json');
