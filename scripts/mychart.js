var data = new Data();
data.ajaxLoader('res/data/user_data.json', data.dataParser.bind(data));
data.customSort = function() {
    //custom average
    'use strict';
    var averages = [];
    var sortOrder = "descending";
    for(var chartDatum of data.chartData) {
        var sum = 0, length = 0;
        for(var yDatum of chartDatum.yData) {
            if(yDatum !== "") {
                sum += yDatum;
                length++;
            }
        }
        averages.push(sum / length);
    }
    data.chartData = data.multiSort(averages, data.chartData, sortOrder);
};