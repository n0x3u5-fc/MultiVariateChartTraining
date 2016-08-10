var chart = new Chart('res/data/trellis_data.json');
//custom average function
// chart.customSort = function() {
//     'use strict';
//     var averages = [];
//     var sortOrder = "descending";
//     for(var chartDatum of this.chartData) {
//         var sum = 0, length = 0;
//         for(var yDatum of chartDatum.yData) {
//             if(yDatum !== "") {
//                 sum += yDatum;
//                 length++;
//             }
//         }
//         averages.push(sum / length);
//     }
//     this.chartData = this.multiSort(averages, this.chartData, sortOrder);
// };

chart.render();
