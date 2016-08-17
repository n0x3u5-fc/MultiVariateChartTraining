;(function() {
    'use strict';
    /**
     * @constructor
     */
    Chart.Data = function(renderDiv) {
        this.caption    = "";
        this.subCaption = "";
        this.height     = "";
        this.width      = "";
        this.type       = "";
        this.chartData  = [];
        this.renderDiv  = renderDiv;
    };

    Chart.Data.prototype.ajaxLoader = function(url, callback) {
        var httpRequest = new XMLHttpRequest();
        if (!httpRequest) {
            console.log("Unable to create XMLHTTP instance.");
            return false;
        }
        httpRequest.open('GET', url, true);
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

    Chart.Data.prototype.dataParser = function(json) {
        var objKeys, chartRenderer, crosstabHeaders, xTitle, chartDiv,
            yHasString    = false,
            errorStr      = "",
            criteria      = [],
            categoryNames = [],
            headerNames   = [],
            productNames  = [],
            productData   = [],
            colorCriteria = [],
            dataValues    = [],
            maxY          = -Infinity,
            minY          = Infinity,
            data          = this;

        this.vis                = json.metadata.visualization;
        this.type               = json.metadata.type;
        this.width              = Number(json.metadata.width);
        this.sortBy             = json.metadata.sortBy;
        this.height             = Number(json.metadata.height);
        this.caption            = json.metadata.caption;
        this.sortOrder          = json.metadata.sortOrder;
        this.subCaption         = json.metadata.subCaption;
        this.positiveColorEnd   = json.metadata.positiveGradientEnd;
        this.negativeColorEnd   = json.metadata.negativeGradientEnd;
        this.positiveColorStart = json.metadata.positiveGradientStart;
        this.negativeColorStart = json.metadata.negativeGradientStart;

        json.data.map(function(currentValue) {
            objKeys = Object.keys(currentValue);
            var cat = currentValue.category.split("|");
            if(categoryNames.indexOf(cat[1]) === -1) {
                categoryNames.push(cat[1]);
            }
            var data = currentValue.data.split("|");
            if(data[1] === undefined) {
                dataValues.push("");
            } else {
                dataValues.push(Number(data[1]));
            }
            xTitle = data[0];
        });
        dataValues.map(function(currentValue) {
            if(currentValue !== "") {
                maxY = currentValue > maxY ? currentValue : maxY;
                minY = currentValue < minY ? currentValue : minY;
            }
        });

        categoryNames.forEach(function(currentValue, index) {
            var categoryName = currentValue;
            headerNames = [];
            json.data.map(function(currentValue) {
                objKeys  = Object.keys(currentValue);
                var cat  = currentValue.category.split("|");
                var head = currentValue.header.split("|");
                if(cat[1] === categoryName) {
                    if(headerNames.indexOf(head[1]) === -1) {
                        headerNames.push(head[1]);
                    }
                }
            });
            headerNames.forEach(function(currentValue, index) {
                var prod,
                    headerName = currentValue;
                productNames   = [];
                productData    = [];
                colorCriteria  = [];
                json.data.map(function(currentValue) {
                    objKeys = Object.keys(currentValue);
                    var cat = currentValue.category.split("|");
                    var head = currentValue.header.split("|");
                    var type = currentValue.type.split("|");
                    var dataVal = currentValue.data.split("|");
                    var light = currentValue.highlight.split("|");
                    if(cat[1] === categoryName && head[1] === headerName) {
                        if(productNames.indexOf(type[1]) === -1) {
                            if(data.vis === "trellis") {
                                prod = Chart.chartUtilities.truncateString(type[1]);
                            } else {
                                prod = type[1];
                            }
                            productNames.push(prod);
                        }
                        if(Number.isNaN(Number(dataVal[1])) && dataVal[1] !== undefined) {
                            productData.push("0");
                        } else if(dataVal[1] === undefined) {
                            productData.push("");
                        } else {
                            productData.push(dataVal[1]);
                        }
                        colorCriteria.push(light[1]);
                    }
                });
                var chart = new Chart.MultiVarChart(index + 2, data.vis, data.type, xTitle,
                                              headerNames[index], productNames, productData);
                chart.yHasString = yHasString;
                crosstabHeaders = headerNames.slice();
                crosstabHeaders.unshift(json.data[0].category.split("|")[0]);
                crosstabHeaders.unshift(json.data[0].type.split("|")[0]);

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

            var chartProperties = new Chart.ChartPropertyCalculator(data.chartData);

            if(data.vis === "trellis") {
                if(data.type === "line") {
                    if(categoryNames.indexOf(categoryName) === 0) {
                        chartRenderer = new Chart.LineChartRenderer(data.chartData, chartProperties);
                        chartRenderer.renderDiv = data.renderDiv;
                        chartRenderer.createCaptions(data.renderDiv, data.caption, data.subCaption);
                        chartRenderer.displayCharts(data.height, data.width);
                    }
                } else if(data.type === "column") {
                    if(categoryNames.indexOf(categoryName) === 0) {
                        chartRenderer = new Chart.ColumnChartRenderer(data.chartData, chartProperties);
                        chartRenderer.renderDiv = data.renderDiv;
                        chartRenderer.createCaptions(data.renderDiv, data.caption, data.subCaption);
                        chartRenderer.displayCharts(data.height, data.width);
                    }
                } else {
                    errorStr = "Chart type not supported in selected visualization type.";
                    chartDiv = document.getElementById(data.renderDiv);
                    chartDiv.innerHTML = errorStr;
                    throw {
                        name    : "ChartVisMismatchError",
                        message : errorStr,
                        toString: function() { return this.name + ": " + this.message; }
                    };
                }
            } else if(data.vis === "crosstab"){
                if(data.type === "bar") {
                    chartRenderer = new Chart.BarChartRenderer(data.chartData, chartProperties);
                    chartRenderer.renderDiv = data.renderDiv;
                    chartRenderer.plotColor        = data.positiveColorStart;
                    chartRenderer.plotColorEnd     = data.positiveColorEnd;
                    chartRenderer.negativeColor    = data.negativeColorStart;
                    chartRenderer.negativeColorEnd = data.negativeColorEnd;
                    chartRenderer.totalRows        = categoryNames.length;
                    var width = Math.floor((document.body.clientWidth - 20) / crosstabHeaders.length);
                    var headerHeight = 20;
                    var footerHeight = 50;
                    var height = Math.floor((window.innerHeight) / categoryNames.length);
                    var safetyOffset = crosstabHeaders.length;
                    if(height < 110) { height = 110; } else if(height > 300) { height = 300; }
                    if(index === 0) {
                        chartRenderer.displayHeaders(headerHeight, width - safetyOffset, crosstabHeaders);
                    }
                    chartRenderer.displayCharts(height - 25, width - safetyOffset, categoryNames.indexOf(categoryName));
                    if(index === categoryNames.length - 1) {
                        chartRenderer.drawX(footerHeight, width - safetyOffset, crosstabHeaders, xTitle);
                    }
                    var allPlots = document.getElementsByClassName("bar-plot");
                    Array.from(allPlots).map(function(currentValue) {
                        criteria.push(currentValue.getAttributeNS(null, "data-criteria"));
                    });
                    chartRenderer.colorPlots(criteria);
                } else {
                    errorStr = "Chart type not supported in selected visualization type.";
                    chartDiv = document.getElementById(data.renderDiv);
                    chartDiv.innerHTML = errorStr;
                    throw {
                        name    : "ChartVisMismatchError",
                        message : errorStr,
                        toString: function() { return this.name + ": " + this.message; }
                    };
                }
            } else {
                errorStr = "Visualization type not supported.";
                chartDiv = document.getElementById(data.renderDiv);
                chartDiv.innerHTML = errorStr;
                throw {
                    name    : "ChartVisError",
                    message : errorStr,
                    toString: function() { return this.name + ": " + this.message; }
                };
            }
            data.chartData = [];
        });

        // var that = this;
        // window.addEventListener("resize", function() {
        //     console.log("whaaa");
        //     var chartDiv = document.getElementById(data.renderDiv);
        //     while(chartDiv.firstChild) {
        //         chartDiv.removeChild(chartDiv.firstChild);
        //     }
        //     if(that.type === "line") {
        //         chartRenderer = new LineChartRenderer(that.chartData, chartProperties);
        //         chartRenderer.createCaptions(data.renderDiv, that.caption, that.subCaption);
        //         chartRenderer.displayCharts(that.height, that.width);
        //     } else if(that.type === "column") {
        //         chartRenderer = new ColumnChartRenderer(that.chartData, chartProperties);
        //         chartRenderer.createCaptions(data.renderDiv, that.caption, that.subCaption);
        //         chartRenderer.displayCharts(that.height, that.width);
        //     } else {
        //         console.log("Sorry Dave. I can't let you do that.");
        //     }
        //     var eventAgent = new EventAgents(this.type);
        //     eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
        // });

        var eventAgent = new Chart.EventAgents(this.type);
        eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
    };

    Chart.Data.prototype.sortData = function(sortBy) {
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

    Chart.Data.prototype.sortByAverage = function() {
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

    Chart.Data.prototype.sortByValue = function() {
        var maxes = [];
        for(var chartDatum of this.chartData) {
            maxes.push(Math.max.apply(Math, chartDatum.yData));
        }
        this.chartData = this.multiSort(maxes, this.chartData, this.sortOrder);
    };

    Chart.Data.prototype.multiSort = function(supportingArray, sortingArray, order) {
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
})();