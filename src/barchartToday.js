/* eslint-env browser */
/* eslint import/extensions:0 */

import picasso from 'picasso.js';
import picassoQ from 'picasso-plugin-q';

picasso.use(picassoQ);

export default class BarChartToday {
  constructor() {
    this.axisPainted = false;
    this.pic = null;
  }

  paintBarChart(element, layout, selectionAPI) {
    if (!(layout.qHyperCube &&
      layout.qHyperCube.qDataPages &&
      layout.qHyperCube.qDataPages[0] &&
      layout.qHyperCube.qDataPages[0].qMatrix)
    ) {
      return;
    }
    if (selectionAPI.hasSelected) {
      return; // keep selected chart state
    }
    const settings = {
      collections: [
        {
          key: 'coll',
          data: {
            extract: {
              field: 'qDimensionInfo/0',
              props: {
                movie: { value: v => v.qText },
                cost: { field: 'qMeasureInfo/0' },
                rating: { field: 'qMeasureInfo/0' },
              },
            },
          },
        },
      ],
      scales: {
        y: {
          data: { field: 'qMeasureInfo/1' },
          invert: true,
          include: [0],          
        },
        c: {
          data: { field: 'qMeasureInfo/1' },
          type: 'color'
        },
        t: { data: { extract: { field: 'qDimensionInfo/0' } }, padding: 0.3 },
      },
      components: [{
        type: 'axis',
        dock: 'left',
        scale: 'y',
        settings: {
          labels: {
            fontSize: '16px',
            fill: 'black',
            fontFamily: 'quicksand-regular',
          }
        }
      },{
        type: 'axis',
        dock: 'bottom',
        scale: 't',
        settings: {
          labels: {
            fontSize: '16px',
            fontFamily: 'quicksand-regular',
            fill: 'black'
          }
        }
      },{
        key: 'bars',
        type: 'box',
        data: {
          extract: {
            field: 'qDimensionInfo/0',
            props: {
              start: 0,
              end: { field: 'qMeasureInfo/1' }
            }
          }
        },
        settings: {
          major: { scale: 't' },
          minor: { scale: 'y'},
          box: {
            fill: { scale: 'c', ref: 'end' }
          }
        }}
      ],
    };

    const data = layout.qHyperCube.qDataPages[0].qMatrix.map(item => ({
      hello: item[0].qText,
    }));

    var data2 = layout.qHyperCube;  
    console.log(data2);  

    const hello = document.getElementsByClassName('hello-title')[0];
    hello.innerHTML = data[0].hello;

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
