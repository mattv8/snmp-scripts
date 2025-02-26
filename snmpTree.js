/**
 * SNMP Tree Builder Script
 *
 * Purpose:
 * - Performs an SNMP walk from a specified root OID on a target device.
 * - Constructs a hierarchical tree representing the structure of OIDs encountered during the walk.
 * - Logs each varbind's OID, type, and value to the console, and writes the data to a CSV file ("snmp_data.csv").
 *
 * Usage:
 * - Update the configuration parameters (IP address, community string, root OID) in the "monitor" object.
 * - Run the script with Node.js to perform the SNMP walk and display the constructed OID tree in the console.
 */
const fs = require('fs');
const snmp = require('net-snmp');

// Configuration
const monitor = {
    ipAddress: '', // Should be an IP address, e.g. '192.168.50.57'
    port: '161',
    communityString: '', // Should be a string, e.g. 'public'
    snmpVersion: '2c',
    rootOid: '1.3.6.1', // Starting from the root OID
};

// SNMP options
const options = {
    port: monitor.port,
    retries: 1,
    timeout: 1000,
    version: snmp.Version2c,
};

// Hierarchical structure to represent the OID tree
class TreeNode {
    constructor(oid) {
        this.oid = oid;
        this.children = [];
    }
}

// Function to build the OID tree from the root OID
function buildOidTreeFromRoot(rootOid) {
    const rootNode = new TreeNode(rootOid);
    const oidMap = new Map();
    oidMap.set(rootOid, rootNode);
    return { rootNode, oidMap };
}

// Function to add OID to the OID tree
function addToOidTree(oid, oidTree) {
    const nodes = oid.split('.');
    let currentNode = oidTree.rootNode;

    nodes.forEach(node => {
        const childNode = currentNode.children.find(child => child.oid === node);

        if (childNode) {
            currentNode = childNode;
        } else {
            const newNode = new TreeNode(node);
            currentNode.children.push(newNode);
            currentNode = newNode;
        }
    });

    oidTree.oidMap.set(oid, currentNode);
}

// Function to print the OID tree
function printOidTree(node, indent = 0) {
    console.log(' '.repeat(indent) + node.oid);
    node.children.forEach(child => printOidTree(child, indent + 4));
}

// Create SNMP session
const session = snmp.createSession(monitor.ipAddress, monitor.communityString, options);

// Create writable stream for CSV
const csvStream = fs.createWriteStream('snmp_data.csv');

// Function to handle SNMP walk feed callback
function feedCb(varbinds, oidTree) {
    for (const varbind of varbinds) {
        if (!snmp.isVarbindError(varbind) && varbind.value !== null && varbind.value !== undefined) {
            console.log(`OID: ${varbind.oid}, Type: ${findType(varbind.type)}, Value: ${varbind.value}`);
            const csvRow = `${varbind.oid},${findType(varbind.type)},${varbind.value}\n`;
            csvStream.write(csvRow);

            // Add OID to the OID tree
            addToOidTree(varbind.oid, oidTree);
        }
    }
}

// Function to handle SNMP walk done callback
function doneCb(error) {
    if (error) {
        console.error(error.toString());
    } else {
        console.log('SNMP walk completed.');
    }
    // Print OID tree after SNMP walk is completed
    console.log('OID Tree:');
    printOidTree(oidTree.rootNode);
}

// Start SNMP walk from the specified OID
const oidTree = buildOidTreeFromRoot(monitor.rootOid);
session.walk(monitor.rootOid, 20, (varbinds) => feedCb(varbinds, oidTree), doneCb);

// Function to find the corresponding type name for a given value
function findType(value) {
    const typeName = Object.entries(snmp.ObjectType).find(([key, val]) => val === value);
    return typeName ? typeName[0] : 'Unknown';
}
