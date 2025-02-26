/**
 * SNMP GET Script for Control Value Testing
 *
 * Purpose:
 * - Executes an SNMP GET request on a specified OID to retrieve its value.
 * - Compares the retrieved value against a control value using a specified condition (>, >=, <, <=, ==, contains).
 * - Determines and logs the status (UP or DOWN) based on the comparison.
 *
 * Usage:
 * - Configure the monitor object with the target device's IP address, port, community string, and SNMP parameters.
 * - Run the script with Node.js to perform the SNMP check and output the result.
 */
const snmp = require('net-snmp');
const UP = { value: true, txt: 'UP' };
const DOWN = { value: false, txt: 'DOWN' };

const monitor = {
    hostname: '', // Should be an IP address, e.g. '192.168.50.57'
    port: 161,
    communityString: '', // A string, e.g. 'public'
    snmpVersion: '2c', // Example SNMP version
    snmpOid: '1.3.6.1.2.1.6.4.0', // Example OID (change me)
    snmpCondition: 'contains', // Example condition
    snmpControlValue: '-1' // Example control value
};

async function check(monitor, heartbeat, _server) {
    console.log("IP Address:", monitor.hostname);
    console.log("SNMP Port:", monitor.port);
    console.log("SNMP Community String:", monitor.communityString);
    console.log("SNMP OID:", monitor.snmpOid);
    console.log("SNMP Version:", monitor.snmpVersion);
    console.log("SNMP Condition:", monitor.snmpCondition);
    console.log("SNMP Control Value:", monitor.snmpControlValue);

    const options = {
        port: monitor.port || '161',
        retries: 1,
        timeout: 1000,
        version: getKey(snmp.Version, monitor.snmpVersion) || snmp.Version2c,
    };

    function getKey(obj, value) {
        return Object.keys(obj).find(key => obj[key] === value) || null;
    }

    try {
        const session = snmp.createSession(monitor.hostname, monitor.communityString, options);

        const varbinds = await new Promise((resolve, reject) => {
            session.get([monitor.snmpOid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(varbinds);
                }
            });
        });

        console.log("monitor", `SNMP: Received varbinds (Type:${snmp.ObjectType[varbinds[0].type]} Value: ${varbinds[0].value}`);
        console.log(snmp.ObjectType);
        console.log(snmp.Version);

        if (varbinds && varbinds.length > 0) {
            const value = varbinds[0].value;
            const numericValue = parseInt(value);
            const stringValue = value.toString();

            switch (monitor.snmpCondition) {
                case '>':
                    heartbeat.status = numericValue > monitor.snmpControlValue ? UP : DOWN;
                    break;
                case '>=':
                    heartbeat.status = numericValue >= monitor.snmpControlValue ? UP : DOWN;
                    break;
                case '<':
                    heartbeat.status = numericValue < monitor.snmpControlValue ? UP : DOWN;
                    break;
                case '<=':
                    heartbeat.status = numericValue <= monitor.snmpControlValue ? UP : DOWN;
                    break;
                case '==':
                    heartbeat.status = value === monitor.snmpControlValue ? UP : DOWN;
                    break;
                case 'contains':
                    heartbeat.status = stringValue.includes(monitor.snmpControlValue) ? UP : DOWN;
                    break;
                default:
                    heartbeat.status = DOWN;
            }
            console.log(heartbeat.status);
            heartbeat.msg = `SNMP value is ` + (heartbeat.status.value ? `` : `not `) + `within rage (comparison: ${value.toString()} ${monitor.snmpCondition} ${monitor.snmpControlValue})`;

        } else {
            heartbeat.status = DOWN;
            heartbeat.msg = 'No varbinds returned from SNMP session';
        }

        session.close(); // Close the session after use
    } catch (err) {
        console.error("Error in SNMP check:", err); // Log any errors
        heartbeat.status = DOWN;
        heartbeat.msg = `Error: ${err.message}`;
    }

    console.log(`Status: ${heartbeat.status.txt}, Mesg: ${heartbeat.msg}`); // Print heartbeat status
}

const heartbeat = {
    status: null,
    msg: ''
};

const server = null; // Assuming no server is passed

check(monitor, heartbeat, server);

module.exports = {
    check
};
