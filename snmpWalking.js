/**
 * SNMP Walking Script (No MIB)
 *
 * Purpose:
 * - Initiates an SNMP walk from a specified root OID on a target device without relying on a MIB file.
 * - Logs SNMP varbind information (OID, type, value) to the console and writes it to a CSV file.
 * - Logs progress periodically to ensure the walk is running efficiently and to track the number of OIDs processed.
 *
 * Usage:
 * - Update the configuration with the target device's IP address, community string, and root OID.
 * - Run the script with Node.js; the SNMP walk data will be output to the console and stored in 'snmp_data.csv'.
 */
const fs = require('fs');
const snmp = require('net-snmp');

// Configuration
const monitor = {
    ipAddress: '', // Should be an IP address, e.g. '192.168.50.57'
    port: '161',
    communityString: '', // A string, e.g. 'public'
    snmpVersion: '2c',
    rootOid: '1.3.6.1' // Starting from the root OID
};

// SNMP options
const options = {
    port: monitor.port,
    retries: 2,
    timeout: 2000,
    version: snmp.Version2c,
};

// Create SNMP session
const session = snmp.createSession(monitor.ipAddress, monitor.communityString, options);

// Create writable stream for CSV output
const csvStream = fs.createWriteStream('snmp_data.csv', { flags: 'a' });

// Progress counter
let varbindCount = 0;
const logProgressInterval = 100; // Log progress every 100 varbinds

console.log(`Starting SNMP walk from OID: ${monitor.rootOid} on ${monitor.ipAddress}`);

// Function to handle SNMP walk feed callback
function feedCb(varbinds) {
    for (const varbind of varbinds) {
        if (!snmp.isVarbindError(varbind) && varbind.value !== null && varbind.value !== undefined) {
            const oid = varbind.oid;
            const typeName = findType(varbind.type);
            const value = varbind.value;
            console.log(`OID: ${oid}, Type: ${typeName}, Value: ${value}`);
            const csvRow = `${oid},${typeName},${value}\n`;
            csvStream.write(csvRow);
            varbindCount++;
            if (varbindCount % logProgressInterval === 0) {
                console.log(`Processed ${varbindCount} varbinds so far...`);
            }
        } else {
            console.error(`Error or null value for OID: ${varbind.oid}`);
        }
    }
}

// Function to handle SNMP walk completion
function doneCb(error) {
    if (error) {
        console.error(`SNMP walk error: ${error.toString()}`);
    } else {
        console.log('SNMP walk completed successfully.');
    }
    console.log(`Total varbinds processed: ${varbindCount}`);
    csvStream.end();
    session.close();
}

// Function to find the corresponding type name for a given value
function findType(value) {
    const typeEntry = Object.entries(snmp.ObjectType).find(([key, val]) => val === value);
    return typeEntry ? typeEntry[0] : 'Unknown';
}

// Start the SNMP walk
session.walk(monitor.rootOid, 20, feedCb, doneCb);
