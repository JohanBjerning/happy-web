/* eslint-env browser */
/* eslint import/extensions:0 */

import picasso from 'picasso.js';
import picassoQ from 'picasso-plugin-q';

picasso.use(picassoQ);

export default class DailyDistribution {
  constructor() {
    this.axisPainted = false;
    this.pic = null;
  }

  paintChart(element, layout, selectionAPI) {
    if (!(layout.qHyperCube &&
      layout.qHyperCube.qStackedDataPages)
    ) {
      console.log('Broken hypercube')
      return;
    }
    if (selectionAPI.hasSelected) {
      return; // keep selected chart state
    }
    
    const settings = {
      collections: [
        {
          key: 'collection',
          data: {
            extract: 
            {
                field: 'qDimensionInfo/0',
                value: v => v.qNum,
                props: {
                  hour: { value: v => v.qNum },
                  happinessCount: { field: 'qMeasureInfo/0' }
              }
            }
          }
        },
      ],
      scales: {
        x: { data: { field: 'qDimensionInfo/0' }, type: 'linear', ticks: {distance:60} },
        y: { data: { field: 'qMeasureInfo/0' }, expand: 0.1, invert: true },
      },
      components: [{
        type: 'axis',
        dock: 'left',
        scale: 'y',
        settings: {
          labels: {
            fontSize: '10px',
            fill: 'black',
            fontFamily: 'quicksand-regular',
          }
        }
      },{
        type: 'axis',
        dock: 'bottom',
        scale: 'x',
        settings: {
          labels: {
            fontSize: '10px',
            fontFamily: 'quicksand-regular',
            fill: 'black'
          }
        }
      },{
        key: 'lines',
        type: 'line',
        data: { collection: 'collection' },
        settings: {
          coordinates: {
            major: { scale: 'x' },
            minor: { scale: 'y', ref: 'happinessCount' },
          },
          layers: {
            line: {},
          },
        },    
      }
      ]
    };

    if (!this.pic) {
      this.pic = picasso.chart({
        element,
        data: [{
          type: 'q',
          key: 'qHyperCube',
          data: layout.qHyperCube,
        }],
        settings,
      });

      this.pic.brush('highlight').on('update', (added) => {
        if (added[0]) {
          selectionAPI.select(added[0].values[0]);
        } else {
          this.pic.brush('highlight').end();
          selectionAPI.clear();
        }
      });
      this.pic.brush('tooltip').on('update', (added) => {
        if (added.length) {
          const s = this.pic.getAffectedShapes('tooltip')[0];
          const rect = s.element.getBoundingClientRect();
          const p = {
            x: s.bounds.x + s.bounds.width + rect.x + 5,
            y: s.bounds.y + (s.bounds.height / 2) + (rect.y - 28),
          };
        } else {
        }
      });
    } else {
      this.pic.update({
        data: [{
          type: 'q',
          key: 'qHyperCube',
          data: layout.qHyperCube,
        }],
        settings,
      });
    }
  }
}
