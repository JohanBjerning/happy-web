/* eslint-env browser */
/* eslint import/extensions:0 */

import enigma from 'enigma.js';
import {configuration} from './config'
import qixSchema from 'enigma.js/schemas/3.2.json';

const mysqlConnectionSettings = {
    qType: 'jdbc', // the name we defined as a parameter to engine in our docker-compose.yml
    qName: 'jdbc',
    qConnectionString: configuration.MySQLConnectionString, // the connection string includes both the provide to use and parameters to it.
    qUserName: configuration.MySQLUser,
    qPassword: configuration.MySQLPass,
  };

  const script = `
    lib connect to 'jdbc';
    happy:
    LOAD
    Date(timestamp) as HappinessDate,
    happiness as Happiness;
    sql SELECT * FROM happy;
    `;


export default class HappinessApp {
    doReload(appId, config) {        
        let app = null;
        let global = null;
        let session = null;

        session = enigma.create(config);
        /* Open Connection to Engine */
        session.open()
        .then((result) => {
            global = result;
        })
        /* Open Document */
        .then(() => global.openDoc(appId))
        .then((result) => {
            app = result;
        })
        .then(() => global.abortAll())

        /* Create Connection */
        .then(() => app.getConnections())
        .then((connections) => {
            if(connections) {
                for (var j=0; j<connections.length; j++) {
                    if (connections[j].qName.match("jdbc")) 
                    return connections[j].qId;
                }                
            }
            return app.createConnection(mysqlConnectionSettings);
        })

        /* Configure the Reload */
        .then(() => global.configureReload(true, false, false))

        /* Set the Script */
        .then(() => app.setScript(script))

        /* Do the Reload*/
        .then(() => app.doReload())

        // /* Get the table data and log it */
        // .then(() => app.getTableData(-1, 10000, true, 'happy'))
        // .then((tableData) => {
        //     const tableDataAsString = tableData
        //       .map(row =>
        //         row.qValue
        //           .map(value => value.qText)
        //           .reduce((left, right) => `${left}\t${right}`),
        //     )
        //     .reduce((row1, row2) => `${row1}\n${row2}`);
        //     console.log(tableDataAsString);
        // })

        /* Save the app */
        .then(() => app.doSave())

        /* Close the session */
        .then(() => session.close())
        .catch((error) => {
            console.log('Session: Failed to reload app:', error);           
        });
    }

    createNewApp(appId, config) {
        const session = enigma.create(config);
        session.open()
        .then((result) => {
            global = result;
        })
        .then(() => global.createApp(appId))
        .then(() => session.close())
        .catch((error) => {
            console.log('Session: Failed to create app:', error);            
        });
    }
}
