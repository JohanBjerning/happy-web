/* eslint-env browser */
import angular from 'angular';
import enigma from 'enigma.js';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import BarChartToday from './barchartToday';
import DailyDistribution from './dailydistribution';
import {configuration} from './config';


const barchartProperties = {
  qInfo: {
    qType: 'visualization',
    qId: '',
  },
  type: 'my-picasso-barchart',
  labels: true,
  qHyperCubeDef: {
    qMeasures: [{
      qDef: {
        qDef: "Count([Happiness])",
        qLabel: 'Nbr of Happiness',
      },
      qSortBy: {
        qSortByLoadOrder: 1,
        qExpression: {}
      },
    },
    {
      qDef: {
        qDef: 'Count({1<[HappinessDate]={">$(=Date(Today(1)))"}>}Happiness)',
        qLabel: 'Nbr of Happiness Today',
      },
    }],
    qDimensions: [{
      qDef: {
        qFieldDefs: ['Happiness'],
      },
      qSortCriterias: [
        {
          qSortByAscii: 0,
          qSortByLoadOrder: 0,
          qSortByExpression: 1,
          qExpression: { "qv": "Match([Happiness], 'sad','content' and 'happy')" }
        }
      ],
    }],
    qInitialDataFetch: [{
      qTop: 0, qHeight: 1000, qLeft: 0, qWidth: 3,
    }],
    qSuppressZero: false,
    qSuppressMissing: true,
  },
};

const dayDistributionChartProperties = {
  qInfo: {
    qType: 'visualization',
    qId: '',
  },
  type: 'my-picasso-multilinechart',
  labels: true,
  qHyperCubeDef: {
    qDimensions: [
      {
        qDef: {
          qFieldDefs: ['Hour'],
          qSortCriterias: [
            {
              qSortByNumeric: 1 // Sort ascending
            }
          ]
        }
      }
      ,{
        qDef: {
          qFieldDefs: ['Happiness'],
          qSortCriterias: [
            {
              qSortByNumeric: 1 // Sort ascending
            }
          ]
        }
      }
    ],
    qMeasures: [
      {
        qDef: {
          qDef: 'Count({1<[HappinessDate]={">$(=Date(Today(1) - 7))"}>}[Happiness])',
          qLabel: 'Respondents',
        }
      },
    ],
    qInitialDataFetch: [{
      qTop: 0, qHeight: 1000, qLeft: 0, qWidth: 3,
    }],
    qMode: 'S', 
    qInterColumnSortOrder: [0,2,1],
    qSuppressZero: false,
    qSuppressMissing: true,
  },
};

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', '$http', function Controller($scope, $q, $http) {
    $scope.dataSelected = false;
    $scope.showFooter = false;

    this.admin = true;
    this.connected = false;
    this.painted = false;
    this.connecting = true;

    let barChartModel = null;
    let lineChartModel = null;
    let lineChartModel2 = null;
    let app = null;

    const select = (value) => {

    };

    const barchartToday = new BarChartToday();
    const dailyDistribution = new DailyDistribution();

    const paintHappiness = (layout) => {
      barchartToday.paintBarChart(document.getElementById('happiness-container'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
    };

    const paintDistribution = (layout) => {
      dailyDistribution.paintChart(document.getElementById('distribution-container'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
    }

    this.generateGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });

    this.$onInit = () => {
      const config = {
        Promise: $q,
        schema: qixSchema,
        url: `ws://${configuration.engineUrl}/app/${this.generateGUID()}`,
      };

      const appId = configuration.appName;

      var connection = new WebSocket('ws://' + configuration.happyServer);

      connection.onopen = function () {
        // connection is opened and ready to use
      };
    
      connection.onerror = function (error) {
        // an error occurred when sending/receiving data
      };
    
      connection.onmessage = function (message) {
        // try to decode json (I assume that each message
        // from server is json)
        var mood;
        try {
          var json = JSON.parse(message.data);
          mood = json.data.button;
        } catch (e) {
          console.log('This doesn\'t look like a valid JSON: ',
              message.data);
          return;
        }
        document.getElementById('mood-pushed').style.backgroundImage = "url(resources/"+mood+"Icon.png)";
        document.getElementById('mood-pushed').style.display = 'inline';
        function removeIt() {
          document.getElementById('mood-pushed').style.display = 'none';
        }
        setTimeout(removeIt, 2000);

        // handle incoming message
      };

      enigma.create(config).open().then((global) => {
        this.connected = true;
        this.connecting = false;
        // global === QIX global interface
        global.openDoc(appId)
        .then((result) => {
          app = result;
          app.evaluate('max(HappinessDate)')
          .then((date) => {
            document.getElementById('latest').innerHTML = date;
            app.getAppLayout()
            .then(() => app.createSessionObject(barchartProperties))
              .then((model) => {
                barChartModel = model;

                const update = () => barChartModel.getLayout().then((layout) => {
                  paintHappiness(layout);   
                });

                barChartModel.on('changed', update);
                update();
              })
            .then(() => app.createSessionObject(dayDistributionChartProperties))
              .then((model) => {
                lineChartModel = model;

                const update = () => lineChartModel.getLayout().then((layout) => {
                  paintDistribution(layout);   
                });

                lineChartModel.on('changed', update);
                update();
              })       
            })     
        });        
      });           
    }
  }],
  template,
});


angular.bootstrap(document, ['app']);
