/* eslint-env browser */
/* eslint import/extensions:0 */

import enigma from 'enigma.js';
import {configuration} from './config'
import qixSchema from 'enigma.js/schemas/3.2.json';
import { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } from 'constants';

const mysqlConnectionSettings = {
    qType: 'jdbc', // the name we defined as a parameter to engine in our docker-compose.yml
    qName: 'jdbc',
    qConnectionString: configuration.MySQLConnectionString, // the connection string includes both the provide to use and parameters to it.
    qUserName: configuration.MySQLUser,
    qPassword: configuration.MySQLPass,
  };

  const script = `
    SET DateFormat='YYYY-MM-DD';

    lib connect to 'jdbc';
    happy:
    LOAD
    Date(timestamp) as HappinessDate,
    Hour(TimeStamp(Round(timestamp, 1/24))) As Hour,
    happiness as Happiness;
    sql SELECT * FROM happy;
    `;


export default class HappinessApp {
    
    constructor(){
        this.app = null;
        this.global = null; 
        this.session = null;
    }

    /**
     * Setup enigmas session
     * @param {*} appId 
     * @param {*} config 
     */
    setupSession(appId, config) {
        this.session = enigma.create(config);
        /* Open Connection to Engine */
        return this.session.open()
        .then((result) => {
            this.global = result;
        })
        /* Open Document */
        .then(() => this.global.openDoc(appId))
        .then((result) => {
            this.app = result;
        })
        .catch((error) => {
            console.log('Session: Failed to setup session:', error);            
        });
    }

    /**
     * Reload and save application
     */
    doReload() {        
        return this.app.doReload()
        .then(() => this.app.doSave())
        .catch((error) => {
            console.log('Session: Failed to reload app:', error);           
        });
    }

    /**
     * Return promise of last happiness entry
     */
    getLastEntry() {
        return this.app.evaluate('max(HappinessDate)')
        .catch((error) => {
            console.log('Session: Failed to get last happiness entry:', error);           
        });
    }

    /** 
     * Close Enigma sessinon
    */
    closeSession() {
        return this.session.close()
        .catch((error) => {
            console.log('Session: Failed to close session:', error);           
        });
    }

    /**
     * Crate happiness app in engine
     * @param {*} appId 
     * @param {*} config 
     */
    createNewApp(appId, config) {
        const session = enigma.create(config);
        session.open()
        .then((result) => {
            this.global = result;
        })
        .then(() => this.global.createApp(appId))
        .then(() => this.global.abortAll())

        /* Create Connection */
        .then(() => this.app.getConnections())
        .then((connections) => {
            if(connections) {
                for (var j=0; j<connections.length; j++) {
                    if (connections[j].qName.match("jdbc")) 
                    return connections[j].qId;
                }                
            }
            return this.app.createConnection(mysqlConnectionSettings);
        })

        /* Configure the Reload */
        .then(() => this.global.configureReload(true, false, false))

        /* Set the Script */
        .then(() => this.app.setScript(script))

        .then(() => this.session.close()) 
    }
}
