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

    var i, idx, objKeys, jsonDataKeys, yObjectKeys, numCharts, chartRenderer, rowCount,
        headerName, crosstabHeaders, xTitle,
        criteria = [],
        categoryNames = [],
        headerNames = [],
        productNames = [],
        productData = [],
        colorCriteria = [],
        dataValues = [],
        maxY = -Infinity,
        minY = Infinity,
        data = this;

    this.vis                = json.metadata.visualization;
    this.type               = json.metadata.type;
    this.width              = json.metadata.width;
    this.sortBy             = json.metadata.sortBy;
    this.height             = json.metadata.height;
    this.caption            = json.metadata.caption;
    this.sortOrder          = json.metadata.sortOrder;
    this.subCaption         = json.metadata.subCaption;
    this.positiveColorEnd   = json.metadata.positiveGradientEnd;
    this.negativeColorEnd   = json.metadata.negativeGradientEnd;
    this.positiveColorStart = json.metadata.positiveGradientStart;
    this.negativeColorStart = json.metadata.negativeGradientStart;

    json.data.map(function(currentValue) {
        objKeys = Object.keys(currentValue);
        if(categoryNames.indexOf(currentValue[objKeys[0]]) === -1) {
            categoryNames.push(currentValue[objKeys[0]]);
        }
        dataValues.push(currentValue[objKeys[3]]);
        xTitle = objKeys[3];
    });

    dataValues.map(function(currentValue, index) {
        maxY = currentValue > maxY ? currentValue : maxY;
        minY = currentValue < minY ? currentValue : minY;
    });

    categoryNames.forEach(function(currentValue, index) {
        var categoryName = currentValue;
        headerNames = [];
        json.data.map(function(currentValue) {
            objKeys = Object.keys(currentValue);
            if(currentValue[objKeys[0]] === categoryName) {
                if(headerNames.indexOf(currentValue[objKeys[1]]) === -1) {
                    headerNames.push(currentValue[objKeys[1]]);
                }
            }
        });
        headerNames.forEach(function(currentValue, index) {
            var headerName = currentValue;
            productNames = [];
            productData = [];
            colorCriteria = [];
            json.data.map(function(currentValue) {
                objKeys = Object.keys(currentValue);
                if(currentValue[objKeys[0]] === categoryName &&
                    currentValue[objKeys[1]] === headerName) {
                    if(productNames.indexOf(currentValue[objKeys[2]]) === -1) {
                        productNames.push(currentValue[objKeys[2]]);
                    }
                    productData.push(currentValue[objKeys[3]]);
                    colorCriteria.push(currentValue[objKeys[4]]);
                }
            });
            var chart = new MultiVarChart(index + 2, data.vis, data.type, objKeys[3],
                                          headerNames[index], productNames, productData);
            crosstabHeaders = headerNames.slice();
            crosstabHeaders.unshift(objKeys[2]);
            crosstabHeaders.unshift(objKeys[0]);

            if(data.vis === "crosstab") {
                chart.keys          = crosstabHeaders;
                chart.minY          = minY;
                chart.maxY          = maxY;
                chart.category      = categoryName;
                chart.colorCriteria = colorCriteria;
            }

            data.chartData.push(chart);
        });

        if(typeof data.customSort == "function") {
            data.customSort();
        } else {
            data.sortData(data.sortBy);
        }

        var chartProperties = new ChartPropertyCalculator(data.chartData);

        if(data.vis === "trellis") {
            if(data.type === "line") {
                if(categoryNames.indexOf(categoryName) === 0) {
                    chartRenderer = new LineChartRenderer(data.chartData, chartProperties);
                    chartRenderer.createCaptions("chart-area", data.caption, data.subCaption);
                    chartRenderer.displayCharts(data.height, data.width);
                }
            } else if(data.type === "column") {
                if(categoryNames.indexOf(categoryName) === 0) {
                    chartRenderer = new ColumnChartRenderer(data.chartData, chartProperties);
                    chartRenderer.createCaptions("chart-area", data.caption, data.subCaption);
                    chartRenderer.displayCharts(data.height, data.width);
                }
            } else {
                console.log("Sorry Dave. I can't let you render a trellis without columns or lines");
            }
        } else if(data.vis === "crosstab"){
            if(data.type === "bar") {
                chartRenderer = new BarChartRenderer(data.chartData, chartProperties);
                chartRenderer.plotColor        = data.positiveColorStart;
                chartRenderer.plotColorEnd     = data.positiveColorEnd;
                chartRenderer.negativeColor    = data.negativeColorStart;
                chartRenderer.negativeColorEnd = data.negativeColorEnd;
                chartRenderer.totalRows        = categoryNames.length;
                var width = Math.floor((document.body.clientWidth - 20) / crosstabHeaders.length);
                var headerHeight = 20;
                var footerHeight = 50;
                var height = Math.floor((window.innerHeight) / categoryNames.length);
                if(height < 110) { height = 110; }
                if(index === 0) {
                    chartRenderer.displayHeaders(headerHeight, width, crosstabHeaders);
                }
                chartRenderer.displayCharts(height - 25, width, categoryNames.indexOf(categoryName));
                if(index === categoryNames.length - 1) {
                    chartRenderer.drawX(footerHeight, width, crosstabHeaders, xTitle);
                }
                var allPlots = document.getElementsByClassName("bar-plot");
                Array.from(allPlots).map(function(currentValue, index, array) {
                    criteria.push(currentValue.getAttributeNS(null, "data-criteria"));
                });
                chartRenderer.colorPlots(criteria);
            } else {
                console.log("Sorry Dave. I can't let you render a crosstab without bars.");
            }
        } else {
            console.log("Sorry Dave. I can't let you render anything other than a trellis or a crosstab");
        }
        data.chartData = [];
    });

    var eventAgent = new EventAgents(this.type);
    eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));

    // if(this.vis === "crosstabs") {
    //     for(var datum of json.data) {
    //         var keys = Object.keys(datum);
    //         for(i = 2; i < keys.length; i++) {
    //             yObjectKeys = Object.keys(datum[keys[i]]);
    //             var yValues = datum[keys[i]][yObjectKeys[0]].split(",").map(Number);
    //             yValues.map(function(currentValue, index) {
    //                 maxY = currentValue > maxY ? currentValue : maxY;
    //                 minY = currentValue < minY ? currentValue : minY;
    //             });
    //         }
    //     }
    //     for(var datum of json.data) {
    //         jsonDataKeys = Object.keys(datum);
    //         numCharts    = jsonDataKeys.length - 2;
    //         rowCount     = json.data.indexOf(datum);
    //         this.chartData = [];
    //         for (i = 2; i < jsonDataKeys.length; i++) {
    //             yObjectKeys = Object.keys(datum[jsonDataKeys[i]]);
    //             var units;
    //             var category = datum[jsonDataKeys[0]];
    //             var xData = datum[jsonDataKeys[1]].split(",");
    //             var yData = datum[jsonDataKeys[i]][yObjectKeys[0]]
    //                 .split(",")
    //                 .map(chartUtilities.numberMapper);
    //             var colorCriteria = datum[jsonDataKeys[i]][yObjectKeys[1]]
    //                 .split(",")
    //                 .map(chartUtilities.numberMapper);
    //             if (!chartUtilities.allSame(yData, "")) {
    //                 if(json.metadata.units !== undefined) {
    //                     units = json.metadata.units.split(",");
    //                     var chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
    //                                             jsonDataKeys[i], xData, yData, units[0], units[i]);
    //                 } else {
    //                     units = [];
    //                     var chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
    //                                             jsonDataKeys[i], xData, yData, units[0], units[i]);
    //                 }
    //                 chart.keys          = jsonDataKeys;
    //                 chart.minY          = minY;
    //                 chart.maxY          = maxY;
    //                 chart.category      = category;
    //                 chart.colorCriteria = colorCriteria;
    //                 this.chartData.push(chart);
    //             }
    //         }
    //         if(typeof this.customSort == "function") {
    //             this.customSort();
    //         } else {
    //             this.sortData(this.sortBy);
    //         }

    //         var chartProperties = new ChartPropertyCalculator(this.chartData);

    //         if(this.type === "bar") {
    //             chartRenderer = new BarChartRenderer(this.chartData, chartProperties);
    //             chartRenderer.plotColor        = this.positiveColorStart;
    //             chartRenderer.plotColorEnd     = this.positiveColorEnd;
    //             chartRenderer.negativeColor    = this.negativeColorStart;
    //             chartRenderer.negativeColorEnd = this.negativeColorEnd;
    //             chartRenderer.totalRows        = json.data.length;
    //             var width = Math.floor((document.body.clientWidth - 20) / jsonDataKeys.length);
    //             var headerHeight = 20;
    //             var footerHeight = 50;
    //             var height = Math.floor((window.innerHeight) / json.data.length);
    //             if(height < 110) { height = 110; }
    //             if(json.data.indexOf(datum) === 0) {
    //                 chartRenderer.displayHeaders(headerHeight, width, jsonDataKeys);
    //             }
    //             chartRenderer.displayCharts(height - 25, width, rowCount);
    //             if(json.data.indexOf(datum) === json.data.length - 1) {
    //                 chartRenderer.drawX(footerHeight, width, jsonDataKeys);
    //             }
    //         } else {
    //             console.log("I'm sorry, Dave. You are not allowed to do that.");
    //         }
    //     }
    //     var allPlots = document.getElementsByClassName("bar-plot");
    //     Array.from(allPlots).map(function(currentValue, index, array) {
    //         criteria.push(currentValue.getAttributeNS(null, "data-criteria"));
    //     });
    //     chartRenderer.colorPlots(criteria);
    // } else if(this.vis === "trellis"){
    //     var chart;

    //     jsonDataKeys = Object.keys(json.data[0]);
    //     numCharts    = jsonDataKeys.length - 1;

    //     for (i = 2; i <= numCharts; i++) {
    //         var yData;
    //             xData = json.data[0][jsonDataKeys[1]]
    //                     .split(",")
    //                     .map(chartUtilities.truncateString);
    //         if(typeof json.data[0][jsonDataKeys[i]] === "object") {
    //             var yKeys = Object.keys(json.data[0][jsonDataKeys[i]])[0];
    //             yData = json.data[0][jsonDataKeys[i]][yKeys]
    //                     .split(",")
    //                     .map(chartUtilities.numberMapper);
    //         } else {
    //             yData = json.data[0][jsonDataKeys[i]]
    //                     .split(",")
    //                     .map(chartUtilities.numberMapper);
    //         }
    //         var units;
    //         if (!chartUtilities.allSame(yData, "")) {
    //             if(json.metadata.units !== undefined) {
    //                 var units = json.metadata.units.split(",");
    //                 chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
    //                     jsonDataKeys[i], xData, yData, units[0], units[i - 1]);
    //             } else {
    //                 units = [];
    //                 chart = new MultiVarChart(i, this.vis, this.type, jsonDataKeys[0],
    //                     jsonDataKeys[i], xData, yData, units[0], units[i - 1]);
    //             }
                // this.chartData.push(chart);
        //     }
        // }

    //     if(typeof this.customSort == "function") {
    //         this.customSort();
    //     } else {
    //         this.sortData(this.sortBy);
    //     }

    //     var chartProperties = new ChartPropertyCalculator(this.chartData);

    //     if(this.type === "line") {
    //         chartRenderer = new LineChartRenderer(this.chartData, chartProperties);
    //         chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
    //         chartRenderer.displayCharts(this.height, this.width);
    //     } else if(this.type === "column") {
    //         chartRenderer = new ColumnChartRenderer(this.chartData, chartProperties);
    //         chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
    //         chartRenderer.displayCharts(this.height, this.width);
    //     } else {
    //         console.log("Sorry Dave. I can't let you do that.");
    //     }
    // } else {
    //     console.log("Sorry Dave. I'm afraid I can't let you do that.");
    // }
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
    // var eventAgent = new EventAgents(this.type);
    // eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
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
