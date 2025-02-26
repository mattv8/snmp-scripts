/**
 * SNMP Walking Script
 *
 * Purpose:
 * - Initiates an SNMP walk from a specified root OID on a target device.
 * - Builds a hierarchical tree representing the OID structure.
 * - Logs SNMP varbind information (OID, type, value) to the console and writes it to a CSV file.
 *
 * Usage:
 * - Update the configuration with the target device's IP address, community string, and root OID.
 * - Run the script with Node.js; the SNMP walk data will be output to the console and stored in 'snmp_data.csv'.
 */
const fs = require('fs');
const snmp = require('net-snmp');

// Configuration
const monitor = {
    ipAddress: '10.87.1.32',
    port: '161',
    communityString: 'tacos',
    snmpVersion: '2c',
    rootOid: '1.3.6.1', // This is pretty high level
    mibDirectory: 'MIBs/ubnt', // Specify the directory containing MIB files
};

// Create a module store and load UBNT-MIB file
const store = snmp.createModuleStore();
const mibFile = 'UBNT-MIB.txt';
console.log(`Loading MIB file: ${mibFile}`);
store.loadFromFile(`${monitor.mibDirectory}/${mibFile}`);

// Fetch MIB providers for the specified module
const moduleName = 'UBNT-MIB'; // Adjust this according to your MIB
const providers = store.getProvidersForModule(moduleName);

// Create an agent
const agent = snmp.createAgent({ disableAuthorization: true }, function (error, data) {});

// Register the providers with the agent's MIB
const mib = agent.getMib();
mib.registerProviders(providers);

// Create SNMP session
const session = snmp.createSession(monitor.ipAddress, monitor.communityString, {
    port: monitor.port,
    retries: 1,
    timeout: 1000,
    version: snmp.Version2c,
});

// Start SNMP walk from the specified OID
session.walk(monitor.rootOid, 20, feedCb, doneCb);

// Function to handle SNMP walk feed callback
function feedCb(varbinds) {
    for (const varbind of varbinds) {
        if (!snmp.isVarbindError(varbind) && varbind.value !== null && varbind.value !== undefined) {
            let oidName;
            try {
                oidName = store.translate(varbind.oid, snmp.OidFormat.path);
            } catch (error) {
                console.error(`Error translating OID ${varbind.oid} to path format: ${error.message}`);
                oidName = varbind.oid;
            }
            const typeName = findType(varbind.type);
            console.log(`OID: ${oidName}, Type: ${typeName}, Value: ${varbind.value}`);
            const csvRow = `${varbind.oid},${oidName},${typeName},${varbind.value}\n`;
            fs.appendFileSync('snmp_data.csv', csvRow);
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
}

// Function to find the corresponding type name for a given value
function findType(value) {
    const typeName = Object.entries(snmp.ObjectType).find(([key, val]) => val === value);
    return typeName ? typeName[0] : 'Unknown';
}
