/**
 * @constructor
 */
var Data = function() {
    'use strict';
    this.caption    = "";
    this.subCaption = "";
    this.height     = "";
    this.width      = "";
    this.type       = "";
    this.chartData  = [];
};

Data.prototype.ajaxLoader = function(url, callback) {
    'use strict';
    var httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
        console.log("Unable to create XMLHTTP instance.");
        return false;
    }
    httpRequest.open('POST', url, true);
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                callback(JSON.parse(httpRequest.responseText));
            } else {
                console.log("There was a problem with the request");
            }
        }
    };
    httpRequest.send();
};

Data.prototype.dataParser = function(json) {
    'use strict';

    var jsonDataKeys, numCharts, chartRenderer, rowCount;

    this.caption    = json.metadata.caption;
    this.subCaption = json.metadata.subCaption;
    this.height     = json.metadata.height;
    this.width      = json.metadata.width;
    this.vis        = json.metadata.visualization;
    this.type       = json.metadata.type;
    this.sortBy     = json.metadata.sortBy;
    this.sortOrder  = json.metadata.sortOrder;

    if(this.vis === "crosstabs") {
        for(var datum of json.data) {
            jsonDataKeys = Object.keys(datum);
            numCharts    = jsonDataKeys.length - 2;
            rowCount     = json.data.indexOf(datum);
            this.chartData = [];
            for (var i = 2; i < jsonDataKeys.length; i++) {
                var category = datum[jsonDataKeys[0]];
                var xData = datum[jsonDataKeys[1]].split(",");
                var yData = datum[jsonDataKeys[i]]
                    .split(",")
                    .map(this.numberMapper);
                if (!this.allSame(yData, "")) {
                    var units = json.metadata.units.split(",");
                    var chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
                                                jsonDataKeys[i], xData, yData, units[0], units[i]);
                    chart.keys     = jsonDataKeys;
                    chart.category = category;
                    this.chartData.push(chart);
                }
            }
            if(typeof this.customSort == "function") {
                this.customSort();
            } else {
                this.sortData(this.sortBy);
            }

            var chartProperties = new ChartPropertyCalculator(this.chartData);

            if(this.type === "bar") {
                chartRenderer = new BarChartRenderer(this.chartData, chartProperties);
                chartRenderer.displayCharts(this.height, this.width, rowCount);
            } else {
                console.log("I'm sorry, Dave. You are not allowed to do that.");
            }
        }
    } else if(this.vis === "trellis"){
        jsonDataKeys = Object.keys(json.data);
        numCharts    = jsonDataKeys.length - 1;

        for (var i = 1; i <= numCharts; i++) {
            var xData = json.data[jsonDataKeys[0]].split(",");
            var yData = json.data[jsonDataKeys[i]]
                .split(",")
                .map(this.numberMapper);

            if (!this.allSame(yData, "")) {
                var units = json.metadata.units.split(",");
                var chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
                    jsonDataKeys[i], xData, yData, units[0], units[i]);
                this.chartData.push(chart);
            }
        }

        if(typeof this.customSort == "function") {
            this.customSort();
        } else {
            this.sortData(this.sortBy);
        }

        var chartProperties = new ChartPropertyCalculator(this.chartData);

        if(this.type === "line") {
            chartRenderer = new LineChartRenderer(this.chartData, chartProperties);
            chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
            chartRenderer.displayCharts(this.height, this.width);
        } else if(this.type === "column") {
            chartRenderer = new ColumnChartRenderer(this.chartData, chartProperties);
            chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
            chartRenderer.displayCharts(this.height, this.width);
        } else {
            console.log("Sorry Dave. I can't let you do that.");
        }
    } else {
        console.log("Sorry Dave. I'm afraid I can't let you do that.");
    }
    // var that = this;
    // window.addEventListener("resize", function() {
    //     console.log("whaaa");
    //     var chartDiv = document.getElementById("chart-area");
    //     while(chartDiv.firstChild) {
    //         chartDiv.removeChild(chartDiv.firstChild);
    //     }
    //     if(that.type === "line") {
    //         chartRenderer = new LineChartRenderer(that.chartData, chartProperties);
    //         chartRenderer.createCaptions("chart-area", that.caption, that.subCaption);
    //         chartRenderer.displayCharts(that.height, that.width);
    //     } else if(that.type === "column") {
    //         chartRenderer = new ColumnChartRenderer(that.chartData, chartProperties);
    //         chartRenderer.createCaptions("chart-area", that.caption, that.subCaption);
    //         chartRenderer.displayCharts(that.height, that.width);
    //     } else {
    //         console.log("Sorry Dave. I can't let you do that.");
    //     }
    //     var eventAgent = new EventAgents(this.type);
    //     eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
    // });
    var eventAgent = new EventAgents(this.type);
    eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
};

Data.prototype.sortData = function(sortBy) {
    'use strict';
    switch(sortBy) {
        case "average":
            this.sortByAverage();
            break;
        case "value":
            this.sortByValue();
            break;
        default:
            console.log("no sorting applied");
    }
};

Data.prototype.sortByAverage = function() {
    'use strict';
    var averages = [];
    for(var chartDatum of this.chartData) {
        var sum = 0, length = 0;
        for (var yDatum of chartDatum.yData) {
            if(yDatum !== "") {
                sum += yDatum;
                length++;
            }
        }
        averages.push(sum / length);
    }
    this.chartData = this.multiSort(averages, this.chartData, this.sortOrder);
};

Data.prototype.sortByValue = function() {
    'use strict';
    var maxes = [];
    for(var chartDatum of this.chartData) {
        maxes.push(Math.max.apply(Math, chartDatum.yData));
    }
    this.chartData = this.multiSort(maxes, this.chartData, this.sortOrder);
};

Data.prototype.multiSort = function(supportingArray, sortingArray, order) {
    'use strict';
    var arr = [];
    for(var i in sortingArray) {
        arr.push({'sort': sortingArray[i], 'support': supportingArray[i]});
    }
    if(order == "descending") {
        arr.sort(function(a, b) {
            return ((a.support > b.support) ? -1 : ((a.support == b.support) ? 0 : 1));
        });
    } else if(order == "ascending") {
        arr.sort(function(a, b) {
            return ((a.support < b.support) ? -1 : ((a.support == b.support) ? 0 : 1));
        });
    }
    for(var j = 0; j < arr.length; j++) {
        sortingArray[j] = arr[j].sort;
    }
    return sortingArray;
};

Data.prototype.allSame = function(arr, val) {
    'use strict';
    for (var elem of arr) {
        if (elem !== val) {
            return false;
        }
    }
    return true;
};

Data.prototype.numberMapper = function(numStr) {
    'use strict';
    return numStr === "" ? "" : Number(numStr);
};