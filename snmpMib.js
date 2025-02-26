/**
 * SNMP Monitoring Script with MIB Directory Integration
 *
 * Purpose:
 * - Establishes an SNMP session and agent using the net-snmp library to monitor network devices.
 * - Loads all MIB files from a supplied MIB directory to enhance OID translation.
 * - Initiates an SNMP walk from a specified root OID on the target device.
 * - Logs SNMP varbind information (OID, translated OID name, type, value) to the console and writes it to a CSV file.
 * - Logs progress periodically to track the number of OIDs processed.
 *
 * How to Use:
 * 1. Update the 'monitor' object with the target device's IP address, port, community string, root OID, and MIB directory.
 * 2. Run the script with Node.js (e.g., `node snmpMibDirectory.js`).
 *
 * Requirements:
 * - Node.js
 * - net-snmp package (install via `npm install net-snmp`)
 */
const fs = require('fs');
const snmp = require('net-snmp');

// Configuration
const monitor = {
    ipAddress: '',       // Target device IP address (e.g. '192.168.50.52')
    port: '161',         // SNMP port (default 161)
    communityString: '', // SNMP community string (e.g. 'public')
    snmpVersion: '2c',   // SNMP version
    rootOid: '1.3.6.1',  // Root OID to start the walk
    mibDirectory: ''     // Directory containing MIB files (e.g. 'MIBs/ubnt')
};

// SNMP options
const options = {
    port: monitor.port,
    retries: 1,
    timeout: 5000,
    backoff: 1.0,
    transport: "udp4",
    trapPort: 162,
    version: snmp.Version2c,
    backwardsGetNexts: true,
    reportOidMismatchErrors: false,
    idBitsSize: 32,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: '80000009032c36f84eeb63',
    address: null,
};

// Create SNMP session
const session = snmp.createSession(monitor.ipAddress, monitor.communityString, options);

// Create SNMP agent with an empty callback (errors will be logged during walk)
const agent = snmp.createAgent(options, (error, data) => {
    if (error) {
        console.error('Agent error:', error);
    }
});

// Get the agent's MIB object
const mib = agent.getMib();

// Load all MIB files from the specified directory
try {
    const mibFiles = fs.readdirSync(monitor.mibDirectory);
    mibFiles.forEach(file => {
        // Only process files with .mib or .txt extensions
        if (file.match(/\.(mib|txt)$/i)) {
            const filePath = `${monitor.mibDirectory}/${file}`;
            console.log(`Loading MIB file: ${file}`);
            try {
                mib.load(filePath);
            } catch (err) {
                console.error(`Error loading MIB file ${file}: ${err.message}`);
            }
        }
    });
} catch (err) {
    console.error(`Error reading MIB directory: ${err.message}`);
}

// Create a writable stream for CSV output
const csvStream = fs.createWriteStream('snmp_data.csv', { flags: 'a' });

// Progress counter
let varbindCount = 0;
const logProgressInterval = 100; // Log progress every 100 varbinds

console.log(`Starting SNMP walk from OID: ${monitor.rootOid} on ${monitor.ipAddress}`);

// Function to handle SNMP walk feed callback
function feedCb(varbinds) {
    for (const varbind of varbinds) {
        if (!snmp.isVarbindError(varbind) && varbind.value !== null && varbind.value !== undefined) {
            let oidName;
            try {
                // Use the loaded MIBs to translate the OID into a human-readable path
                oidName = mib.translate(varbind.oid, snmp.OidFormat.path);
            } catch (error) {
                console.error(`Error translating OID ${varbind.oid}: ${error.message}`);
                oidName = varbind.oid;
            }
            const typeName = findType(varbind.type);
            console.log(`OID: ${varbind.oid}, Name: ${oidName}, Type: ${typeName}, Value: ${varbind.value}`);
            const csvRow = `${varbind.oid},${oidName},${typeName},${varbind.value}\n`;
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
