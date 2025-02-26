/**
 * SNMP Monitoring Script
 *
 * Purpose:
 * - Establishes an SNMP session and agent using the net-snmp library to monitor network devices.
 * - Connects to a specified device using defined configuration parameters (IP address, port, community string, etc.).
 * - Sets SNMP options (e.g., retries, timeout, transport) to control communication with the SNMP agent.
 * - Defines a callback function to handle SNMP responses, logging data or errors to the console.
 * - Optionally supports loading a MIB file for enhanced SNMP functionality (currently commented out).
 *
 * How to Use:
 * 1. Update the 'monitor' object with the target device's IP address, port, and community string.
 * 2. Adjust any SNMP options in the 'options' object if necessary.
 * 3. Uncomment and modify the MIB loading section if you need to load a MIB file.
 * 4. Run the script with Node.js (e.g., `node snmpMib.js`).
 *
 * Requirements:
 * - Node.js
 * - net-snmp package (install via `npm install net-snmp`)
 */
const fs = require('fs');
const snmp = require('net-snmp');

// Configuration
const monitor = {
    ipAddress: '', // Should be an IP address, e.g. '192.168.50.57'
    port: '161',
    communityString: '', // A string, e.g. 'public'
    snmpVersion: '2c',
    rootOid: '1.3.6.1',
    snmpCondition: '>',
    snmpControlValue: 80
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

// Define a callback function to handle SNMP requests
const callback = function (error, data) {
    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
};

// Create the SNMP agent with the options, callback, and MIB
const agent = snmp.createAgent(options, callback);

// Load the MIB file
// const mib = agent.Mib();
// mib.load('/mnt/c/Users/mattv/Downloads/MIBs_ODM_Sx200_Sx300_v1.4.7.2/CISCOSBmacmulticast.mib');