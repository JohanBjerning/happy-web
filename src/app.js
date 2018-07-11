/* eslint-env browser */
import angular from 'angular';
import enigma from 'enigma.js';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import BarChart from './barchart';
import BarChartToday from './barchartToday';
import DailyDistribution from './dailydistribution';
import HappinessApp from './happinessapp';
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
        qDef: 'Count({1<[HappinessDate]={">$(=Date(Today()))"}>}Happiness)',
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
    ],
    qMeasures: [{
      qDef: {
        qDef: 'Count([Happiness])',
        qLabel: 'Respondents',
      }
    }],
    qInitialDataFetch: [{
      qTop: 0, qHeight: 1000, qLeft: 0, qWidth: 3,
    }],
    //qMode: 'K', // Stacked Pivot
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
    let app = null;

    const select = (value) => {

    };

    const barchart = new BarChart();
    const barchartToday = new BarChartToday();
    const dailyDistribution = new DailyDistribution();

    const happinessapp = new HappinessApp();

    const paintChart = (layout) => {
      barchart.paintBarChart(document.getElementById('chart-container'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      barchartToday.paintBarChart(document.getElementById('chart-container2'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
    };

    const paintDaily = (layout) => {
      dailyDistribution.paintChart(document.getElementById('daily-container'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      this.painted = true;
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

      enigma.create(config).open().then((global) => {
        this.connected = true;
        this.connecting = false;
        // global === QIX global interface
        global.openDoc(appId)
        .then((result) => {
          app = result;
          app.getAppLayout()
          .then(() => app.createSessionObject(barchartProperties))
            .then((model) => {
              barChartModel = model;

              const update = () => barChartModel.getLayout().then((layout) => {
                paintChart(layout);   
              });

              barChartModel.on('changed', update);
              update();
            })
          .then(() => app.createSessionObject(dayDistributionChartProperties))
            .then((model) => {
              lineChartModel = model;

              const update = () => lineChartModel.getLayout().then((layout) => {
                console.log(layout);
                paintDaily(layout);   
              });

              lineChartModel.on('changed', update);
              update();
            })       
        });        
      });           

      this.createNewApp = () => {
        happinessapp.createNewApp(appId, config);
      };

      this.reloadData = () => {
        happinessapp.doReload(appId, config);
      };
      
      this.reloadEveryXSewc = () => {
        setInterval(this.reloadData, 10000);          
      };
    }
  }],
  template,
});


angular.bootstrap(document, ['app']);
