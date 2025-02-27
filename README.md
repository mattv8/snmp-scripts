# SNMP Scripts

This repository contains a collection of Node.js scripts that leverage the [net-snmp](https://github.com/markabrahams/node-net-snmp) library to interact with SNMP-enabled devices. These tools allow you to perform SNMP walks, retrieve specific OID values, build hierarchical OID trees, and integrate MIB files for OID translation.

## Scripts

### snmpWalking.js

- **Purpose:**

  Initiates an SNMP walk from a specified root OID, logs SNMP varbind data (OID, type, value) to the console, writes the data to a CSV file, and builds an OID tree.

- **Usage:**

  Configure the target device's IP address, community string, and root OID in the script. Run:
  ```sh
  node snmpWalking.js
  ```
### snmpGet.js

- **Purpose:**

    Executes an SNMP GET request for a specified OID, compares the retrieved value against a control value using a defined condition, and outputs the status.

- **Usage:**

    Update the SNMP parameters in the monitor object. Run:

    ```sh
    node snmpGet.js
    ```

### snmpTree.js

**Purpose:**

Similar to snmpWalking.js, this script performs an SNMP walk starting from a given root OID and builds a hierarchical tree of OIDs. It logs SNMP varbind details to the console and writes the results to a CSV file.

- **Usage:**

    Set the target device configuration in the script. Run:
    ```sh
    node snmpTree.js
    ```
### snmpMib.js

- **Purpose:**
Loads a specified MIB file and registers its providers with an SNMP agent. The script performs an SNMP walk and translates OIDs into human-readable names using the loaded MIB.

- **Usage:**
Adjust the monitor object with the correct MIB directory, file, and module name. Run the corresponding script:
    ```sh
    node snmpMib.js
    ```

## Installation
- Prerequisites:

    Ensure Node.js is installed on your system.

- Clone the Repository:

    ```sh
    git clone https://github.com/mattv8/snmp-scripts.git
    cd snmp-scripts
    ```

- Install Dependencies:

    ```sh
    npm install net-snmp
    ```

## Configuration

Each script has a configuration section where you can set:

- IP Address/Hostname: The target device's address.
- Port: SNMP port (default is 161).
- Community String: SNMP community string (e.g., "public", "tacos").
- SNMP Version: Typically "2c".
- OIDs: Specific OIDs or root OIDs for SNMP operations.
- MIB Files (if applicable): Specify the MIB directory and file names.

## Running the Scripts

Execute any script using Node.js. For example, to run the SNMP walking script:

```sh
node snmpWalking.js
```

Check the console output for logs, and review the generated snmp_data.csv for recorded SNMP data.

## License
This project is licensed under the GPLv3 License. See the LICENSE file for details.

## Contributing
Contributions are welcome! Please fork this repository and submit pull requests for improvements or bug fixes.

## Disclaimer
These scripts are provided "as is" without any warranty. Use them at your own risk.
