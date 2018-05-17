/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import BarChart from './barchart';

const halyard = new Halyard();

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', '$http', function Controller($scope, $q, $http) {
    $scope.dataSelected = false;
    $scope.showFooter = false;

    this.connected = false;
    this.painted = false;
    this.connecting = true;

    let object = null;
    let app = null;

    const select = (value) => {
      
    };

    const barchart = new BarChart();

    const paintChart = (layout) => {
      barchart.paintBarChart(document.getElementById('chart-container'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      this.painted = true;
    };

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
        mixins: enigmaMixin,
        url: `ws://${window.location.hostname}:19076/app/${this.generateGUID()}`,
      };

      // Add local data
      const filePathHappiness = '/data/happiness.csv';
      const tableHappiness = new Halyard.Table(filePathHappiness, {
        name: 'Happiness',
        fields: [{ src: 'timestamp', name: 'HappinessDate' }, { src: 'happiness', name: 'Happiness' }],
        delimiter: ',',
      });
      halyard.addTable(tableHappiness);

      enigma.create(config).open().then((qix) => {
        this.connected = true;
        this.connecting = false;
        qix.createSessionAppUsingHalyard(halyard).then((result) => {
          app = result;
          result.getAppLayout()
            .then(() => {
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
                      qDef: 'Count(Happiness)',
                      qLabel: 'Nbr of Happiness',
                    },
                    qSortBy: {
                      qSortByExpression: 1,
                      qExpression:'Match([happiness], "happy", "content" and "sad")',
                    },
                  }],
                  qDimensions: [{
                    qDef: {
                      qFieldDefs: ['Happiness'],
                      qSortCriterias: [{
                        qSortByExpression: 1,
                        qExpression:'Match([happiness], "happy", "content" and "sad")',
                      }],
                    },
                  }],
                  qInitialDataFetch: [{
                    qTop: 0, qHeight: 50, qLeft: 0, qWidth: 3,
                  }],
                  qSuppressZero: false,
                  qSuppressMissing: true,
                },
              };
              result.createSessionObject(barchartProperties).then((model) => {
                object = model;

                const update = () => object.getLayout().then((layout) => {
                  paintChart(layout);
                });

                object.on('changed', update);
                update();
              });
            });
        }, () => {
          this.error = 'Could not create session app';
          this.connected = false;
          this.connecting = false;
        });
      }, () => {
        this.error = 'Could not connect to QIX Engine';
        this.connecting = false;
      });

    this.clearAllSelections = () => {
      if ($scope.dataSelected) {
        $scope.dataSelected = false;
        app.clearAll();
      }
      $scope.showFooter = false;
    };
  }}],
  template,
});

angular.bootstrap(document, ['app']);
