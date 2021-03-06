;(function(){
    'use strict';
    /**
     * @constructor
     */
    Chart.BarChartRenderer = function(charts, chartProperties) {
        this.charts = charts;
        this.chartProperties = chartProperties;
    };
    Chart.BarChartRenderer.prototype.displayHeaders = function(height, width, keys) {
        var headerText,
            svgHelper = new Chart.SvgHelper();
        for(var key of keys) {
            this.createDivs(this.renderDiv);
            var headerSvg = svgHelper.createSvgByClass(height, width, "header-svg");
            var headerDivs = document.getElementsByClassName("multi-chart-header");
            Array.from(headerDivs).map(function(currentValue, index) {
                currentValue.style.borderBottom = "1px solid black";
                if(index > 0) {
                    currentValue.style.borderRight = "1px solid black";
                }
                currentValue.appendChild(headerSvg);
            });
            if(keys.indexOf(key) > 1) {
                headerText = svgHelper.drawTextByClass(Math.floor((width / 2) - (key.length) * 2),
                                                           16, key, "header");
            } else {
                headerText = svgHelper.drawTextByClass(16, 16, key, "header");
            }
            headerSvg.appendChild(headerText);
        }
    };
    Chart.BarChartRenderer.prototype.drawRowName = function(charts, multiCharts, svgHelper, svg,
                                                            height, width, i, rowCount) {
        var mappedCharts  = [];
        var chartUbHeight = Math.ceil(height);
        var chartUbWidth  = Math.ceil(width);
        var chartLbHeight = Math.floor(0);
        var chartLbWidth  = Math.floor(1);
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, charts[0]);
        mappedCharts.push(mappedData);
        var categoryText = svgHelper.drawTextByClass(16, mappedData.xTicks[0] + 8,
                                                     charts[i].category, "category-text");
        svg.appendChild(categoryText);
        svg.setAttributeNS(null, "class", "row-category");
        if(i !== charts.length - 1 && rowCount !== this.totalRows - 1) {
            svg.style.borderBottom = "1px solid black";
        }
    };
    Chart.BarChartRenderer.prototype.drawYLabels = function(charts, multiCharts, svgHelper, svg,
                                                            height, width, i, rowCount) {
        var mappedCharts  = [];
        var chartUbHeight = Math.ceil(height);
        var chartUbWidth  = Math.ceil(width);
        var chartLbHeight = Math.floor(0);
        var chartLbWidth  = Math.floor(1);
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, charts[0]);
        mappedCharts.push(mappedData);

        for(var yTick of mappedData.xTicks) {
            var yValuesContent = charts[i].xData[mappedData.xTicks.indexOf(yTick)];
            var yValues = svgHelper.drawTextByClass(16, yTick + 8, yValuesContent, "y-value");
            svg.appendChild(yValues);
        }
        svg.setAttributeNS(null, "class", "y-labels");
        if(i !== charts.length - 1 && rowCount !== this.totalRows - 1) {
            svg.style.borderBottom = "1px solid black";
        }
    };
    Chart.BarChartRenderer.prototype.drawX = function(height, width, keys, title) {
        var mappedCharts  = [];
        var formattedTickValues = [];
        var chartUbHeight = Math.ceil(height);
        var chartUbWidth  = Math.ceil(width);
        var chartLbHeight = Math.floor(0);
        var chartLbWidth  = Math.floor(1);
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;
        var svgHelper     = new Chart.SvgHelper();

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, this.charts[0]);
        mappedCharts.push(mappedData);

        for(var key of keys) {
            var div = document.createElement('span');
            div.setAttribute('class', "multi-chart-footer");
            div.style.display = "inline-block";
            var renderDiv = document.getElementById(this.renderDiv);
            renderDiv.appendChild(div);

            var footerSvg = svgHelper.createSvgByClass(height, width, "footer-svg");
            var footerDivs = document.getElementsByClassName("multi-chart-footer");
            var xAxis = new Chart.XAxis(chartLbWidth, 0, chartUbWidth, 0, "xAxis", true);
            xAxis.type = "numeric";
            Array.from(footerDivs).map(function(currentValue, index) {
                currentValue.style.borderTop = "1px solid black";
                if(index > 0) {
                    currentValue.style.borderRight = "1px solid black";
                }
                currentValue.appendChild(footerSvg);
            });
            var footerSvgs = document.getElementsByClassName("footer-svg");
            var that = this;
            Array.from(footerSvgs).map(function(currentValue, index) {
                if(index > 1) {
                    // xAxis.render(footerSvg);
                    xAxis.renderTicks(footerSvg, mappedData.yTicks);
                    for(var yTick of that.charts[0].yTicks) {
                        formattedTickValues.push(Chart.chartUtilities.shortenLargeNumber(yTick, 2));
                    }
                }
            });
            xAxis.chartVis = "crosstabs";
            xAxis.renderTickValues(footerSvg, mappedData.yTicks, formattedTickValues);
            if(keys.indexOf(key) > 1) {
                var xTitle = svgHelper.drawTextByClass((chartWidth / 2) - (title.length * 3),
                                                       chartHeight / 1.2, title, "x-title");
                footerSvg.appendChild(xTitle);
            }
        }
    };
    Chart.BarChartRenderer.prototype.displayCharts = function(height, width, rowCount) {
        var maxY = -Infinity, minY = Infinity;
        if(this.charts[0].vis === "trellis") {
            var chartsInARow = Math.floor(window.innerWidth / (width + 55));
            if(chartsInARow > this.charts.length) {
                chartsInARow = this.charts.length;
            }
            for (var i = 0; i < this.charts.length; i++) {
                for(var j = i; j < chartsInARow; j++) {
                    var tMaxY = Math.max.apply(Math, this.charts[j].yData.map(Chart.chartUtilities.nullMaxMapper));
                    var tMinY = Math.min.apply(Math, this.charts[j].yData.map(Chart.chartUtilities.nullMinMapper));
                    if(tMaxY > maxY) {
                        maxY = tMaxY;
                    }
                    if(tMinY < minY) {
                        minY = tMinY;
                    }
                }
                if (minY !== Infinity || maxY !== -Infinity) {
                    this.charts[i].yTicks = this.chartProperties.calculateYAxis(minY, maxY);
                    this.charts[i].xTicks = this.chartProperties.calculateYAxis(0,
                                                                           this.charts[i].xData.length);
                    this.createDivs(this.renderDiv);
                }
            }
            this.createCharts(this.charts, height, width);
        } else if (this.charts[0].vis === "crosstab") {
            this.createDivs(this.renderDiv, rowCount);
            this.createDivs(this.renderDiv, rowCount);
            for (var i = 0; i < this.charts.length; i++) {
                var tempMaxY = Math.max.apply(Math, this.charts[i].yData.map(Chart.chartUtilities.nullMaxMapper));
                var tempMinY = Math.min.apply(Math, this.charts[i].yData.map(Chart.chartUtilities.nullMinMapper));
                if(tempMaxY > maxY) {
                    maxY = tempMaxY;
                }
                if(tempMinY < minY) {
                    minY = tempMinY;
                }
                if (minY !== Infinity || maxY !== -Infinity) {
                    this.createDivs(this.renderDiv, rowCount);
                }
            }
            for(i = 0; i < this.charts.length; i++) {
                if (minY !== Infinity || maxY !== -Infinity) {
                    this.charts[i].yTicks = this.chartProperties.calculateYAxis(this.charts[0].minY,
                                                                                this.charts[0].maxY);
                    this.charts[i].xTicks = this.chartProperties.calculateYAxis(this.charts[0].minY,
                                                                                this.charts[0].maxY);
                }
            }
            this.createCharts(this.charts, height, width, rowCount);
        } else {
            console.log("unavailable chart visualization.");
        }
    };
    Chart.BarChartRenderer.prototype.createDivs = function(targetDiv, rowCount) {
        var div = document.createElement('span');
        if(rowCount !== undefined) {
            div.setAttribute('class', "multi-chart" + rowCount);
        } else if(rowCount === undefined && this.charts[0].vis === "crosstab") {
            div.setAttribute('class', "multi-chart-header");
        } else {
            div.setAttribute('class', "multi-chart");
        }
        div.style.display = "inline-block";
        var renderDiv = document.getElementById(targetDiv);
        renderDiv.appendChild(div);
    };
    Chart.BarChartRenderer.prototype.colorPlots = function(criteria) {
        var color, lumRatio, plots;
        var charts = document.getElementsByClassName("chart-svg");
        var that = this;
        var losses = criteria.filter(function(currentValue) {
            if(currentValue < 0) { return true; } else { return false; }
        });
        var lossDiff = Math.max.apply(Math, losses) - Math.min.apply(Math, losses);
        var profits = criteria.filter(function(currentValue) {
            if(currentValue >= 0) { return true; } else { return false; }
        });
        var profitDiff = Math.max.apply(Math, profits) - Math.min.apply(Math, profits);
        Array.from(charts).map(function(currentValue, index) {
            var chartIdx = index;
            if(that.charts[0].type === "line") {
                plots = currentValue.getElementsByClassName("graphCircle");
                Array.from(plots).map(function(currentValue, index, array) {
                    var colorCriteria = Number(currentValue.getAttributeNS(null, "data-criteria"));
                    if(colorCriteria < 0) {
                        lumRatio = colorCriteria / lossDiff;
                        color = Chart.chartUtilities.generateColor(that.negativeColor, that.negativeColorEnd, lumRatio);
                    } else {
                        lumRatio = colorCriteria / profitDiff;
                        color = Chart.chartUtilities.generateColor(that.plotColor, that.plotColorEnd, lumRatio);
                    }
                    currentValue.style.fill = color;
                    currentValue.style.stroke = color;
                });
                var lines = Array.from(currentValue.getElementsByClassName("graphLine"));
                var anchors = Array.from(currentValue.getElementsByClassName("graphCircle"));
                lines.map(function(currentValue, index, array) {
                    var startAnchor, endAnchor;
                    if(currentValue.parentNode.getElementsByTagName("defs").length === 0) {
                        var defSvg = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                        currentValue.parentNode.appendChild(defSvg);
                    }
                });
                lines.map(function(currentValue, index, array) {
                    var startAnchor, endAnchor;
                    var svgDefs = currentValue.parentNode.getElementsByTagName("defs");
                    var grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
                    grad.setAttributeNS(null, "id", "lineGradient" + chartIdx + index);
                    grad.setAttributeNS(null, "x1", "0");
                    grad.setAttributeNS(null, "x2", "0");
                    grad.setAttributeNS(null, "y1", "0");
                    grad.setAttributeNS(null, "y2", "1");
                    var beginStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                    beginStop.setAttributeNS(null, "offset", "5%");
                    var lineStartX = currentValue.getAttributeNS(null, "x1");
                    var lineStartY = currentValue.getAttributeNS(null, "y1");
                    var lineEndX = currentValue.getAttributeNS(null, "x2");
                    var lineEndY = currentValue.getAttributeNS(null, "y2");
                    anchors.map(function(currentValue) {
                        if(currentValue.getAttributeNS(null, "cx") == lineStartX && currentValue.getAttributeNS(null, "cy") == lineStartY) {
                            startAnchor = currentValue;
                        }
                    });
                    var endStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                    endStop.setAttributeNS(null, "offset", "95%");
                    anchors.map(function(currentValue) {
                        if(currentValue.getAttributeNS(null, "cx") == lineEndX && currentValue.getAttributeNS(null, "cy") == lineEndY) {
                            endAnchor = currentValue;
                        }
                    });
                    beginStop.setAttributeNS(null, "stop-color", startAnchor.style.fill);
                    endStop.setAttributeNS(null, "stop-color", endAnchor.style.fill);
                    grad.appendChild(beginStop);
                    grad.appendChild(endStop);
                    svgDefs[0].appendChild(grad);
                    currentValue.style.stroke = "url(#lineGradient" + chartIdx + index + ")";
                });
            } else if(that.charts[0].type === "bar") {
                plots = currentValue.getElementsByClassName("bar-plot");
                Array.from(plots).map(function(currentValue, index, array) {
                    var colorCriteria = Number(currentValue.getAttributeNS(null, "data-criteria"));
                    if(colorCriteria < 0) {
                        lumRatio = colorCriteria / lossDiff;
                        color = Chart.chartUtilities.generateColor(that.negativeColor, that.negativeColorEnd, lumRatio);
                    } else {
                        lumRatio = colorCriteria / profitDiff;
                        color = Chart.chartUtilities.generateColor(that.plotColor, that.plotColorEnd, lumRatio);
                    }
                    currentValue.style.fill = color;
                });
            }
        });
    };
    Chart.BarChartRenderer.prototype.createCaptions = function(targetDiv, caption, subCaption) {
        var captionHeader = document.createElement('h1');
        captionHeader.setAttribute('class', 'caption');
        var renderDiv = document.getElementById(targetDiv);
        captionHeader.innerHTML = caption;
        renderDiv.appendChild(captionHeader);
        var subCaptionHeader = document.createElement('h2');
        subCaptionHeader.setAttribute('class', 'sub-caption');
        subCaptionHeader.innerHTML = subCaption;
        renderDiv.appendChild(subCaptionHeader);
    };
    Chart.BarChartRenderer.prototype.drawCompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width, columnsAreComplete, rowCount) {
        var columnPlot;
        var mappedCharts  = [];
        var formattedTickValues = [];
        var chartUbHeight = 0,
            chartUbWidth  = 0,
            chartLbWidth  = 0,
            chartLbHeight = 0;
        if(this.charts[0].vis === "crosstab") {
            chartUbHeight = Math.ceil(height);
            chartUbWidth  = Math.ceil(width);
            chartLbHeight = Math.floor(0);
            chartLbWidth  = Math.floor(1);
        } else if(this.charts[0].vis === "trellis") {
            chartUbHeight = Math.ceil(height - (0.001 * height)) + 55;
            chartUbWidth  = Math.ceil(width - (0.025 * width)) + 55;
            chartLbHeight = Math.floor(0 + (0.2 * height)) + 55;
            chartLbWidth  = Math.floor(0 + (0.025 * height)) + 55;
        } else {
            console.log("Unsupported chart visualization.");
        }
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;
        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        if(this.charts[0].vis === "crosstab") {
            var yAxis = new Chart.YAxis(chartLbWidth, chartLbHeight, chartLbWidth, chartUbHeight,
                              "yAxis", columnsAreComplete);
            yAxis.type = "category";

            if(rowCount !== this.totalRows - 1) {
                var xAxis = new Chart.XAxis(chartUbWidth, chartUbHeight, chartLbWidth, chartUbHeight,
                                  "xAxis", columnsAreComplete);
                xAxis.type = "numeric";
                xAxis.render(svg);
            }
            // xAxis.renderTicks(svg, mappedData.yTicks);
            if (i >= multiCharts.length - chartsInARow) {
                for(var yTick of charts[i].yTicks) {
                    formattedTickValues.push(Chart.chartUtilities.shortenLargeNumber(yTick, 2));
                }
                // xAxis.renderTickValues(svg, mappedData.yTicks, formattedTickValues);
            }

            var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartLbHeight - 40, 30, chartWidth, "y-title-rect");
            // svg.appendChild(yTitleRect);
            var yTitleContent = charts[i].yUnit === "" ?
                charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
            var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartLbHeight - 20, yTitleContent,
                                                   "y-title");
            // svg.appendChild(yTitle);
            if(this.charts[0].type === "line") {
                for (var l = 0; l < mappedData.yData.length - 1; l++) {
                    var graphLine;
                    var c = 0;
                    if (mappedData.yData[l + 1] !== "" && mappedData.yData[l] !== "") {
                        graphLine = svgHelper.drawLineByClass(mappedData.yData[l] + chartLbWidth,
                                            mappedData.xData[l] + chartLbHeight,
                                            mappedData.yData[l + 1] + chartLbWidth,
                                            mappedData.xData[l + 1] + chartLbHeight,
                                            "graphLine");
                        svg.appendChild(graphLine);
                    } else if (mappedData.yData[l] !== "") {
                        for (var j = l + 2; j < mappedData.yData.length; j++) {
                            l++;
                            c++;
                            if (mappedData.yData[j] !== "") {
                                graphLine = svgHelper
                                    .drawLineByClass(mappedData.yData[l - c] + chartLbWidth,
                                            mappedData.xData[l - c] + chartLbHeight,
                                            mappedData.yData[j] + chartLbWidth,
                                            mappedData.xData[j] + chartLbHeight,
                                            "graphLine inferredLine");
                                svg.appendChild(graphLine);
                                break;
                            }
                        }
                    }
                }
            }
            for (var k = 0; k < mappedData.yData.length; k++) {
                if (mappedData.yData[k] !== "") {
                    var anchor = svgHelper.drawCircleByClass(mappedData.yData[k] + chartLbWidth,
                                            mappedData.xData[k] + chartLbHeight,
                                            4, "graphCircle");
                    anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                    if (this.charts[0].type === "line") {
                        anchor.setAttributeNS(null, "data-criteria", charts[i].colorCriteria[k]);
                        svg.appendChild(anchor);
                    } else {
                        var plotHeight = (chartHeight / mappedData.xData.length) - 13;
                        if(plotHeight > 27) { plotHeight = 27; }
                        if(svg.getElementsByClassName("zeroPlane").length > 0) {
                            // var xZeroLine = svg.getElementsByClassName("zeroPlane");
                            // var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
                            // if(charts[i].yData[k] < 0) {
                            //     var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight - 55 - zeroPlaneY;
                            //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                            //     zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                            // } else {
                            //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                            //     chartUbHeight - mappedData.yData[k] - 55,
                            //     mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 55, plotWidth,
                            //     "column-plot");
                            // }
                        } else {
                            var zeroes = charts[i].yData.filter(function(currentValue) {
                                if(currentValue === 0) { return true; } else { return false; }
                            });
                            if(mappedData.yData[k] < 2 && zeroes.length === 0) {
                                mappedData.yData[k] = 2;
                            }
                            columnPlot = svgHelper.drawRectByClass(chartLbWidth - 1,
                            mappedData.xData[k] + chartLbHeight - (plotHeight / 2),
                            plotHeight, mappedData.yData[k],
                            "bar-plot");
                        }
                        columnPlot.setAttributeNS(null, "data-criteria", charts[i].colorCriteria[k]);
                        columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
                        svg.appendChild(columnPlot);
                    }
                }
            }
        } else if(this.charts[0].vis === "trellis") {
            var yAxis = new Chart.YAxis(chartLbWidth, chartLbHeight - 55, chartLbWidth, chartUbHeight - 55,
                              "yAxis", columnsAreComplete);
            yAxis.type = "category";
            yAxis.render(svg);
            yAxis.renderTicks(svg, mappedData.xTicks);
            if(i % chartsInARow === 0) {
                yAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
            }
            // yAxis.renderDivs(svg, mappedData.yTicks, chartHeight, chartLbWidth, chartWidth);
            // yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

            var xAxis = new Chart.XAxis(chartUbWidth, chartUbHeight - 55, chartLbWidth, chartUbHeight - 55,
                                  "xAxis", columnsAreComplete);
            xAxis.render(svg);
            if(svg.getElementsByClassName("zeroPlane").length > 0) {
                var xLine = svg.getElementsByClassName("xAxis");
                Array.from(xLine).map(function(currentValue) {
                    currentValue.style.strokeWidth = 0;
                });
            }
            xAxis.renderTicks(svg, mappedData.yTicks);
            var shortYData = charts[i].yTicks.map(function(currentValue) {
                return Chart.chartUtilities.shortenLargeNumber(currentValue, 2);
            });
            if (i >= multiCharts.length - chartsInARow) {
                xAxis.renderTickValues(svg, mappedData.yTicks, shortYData);
            }

            var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartLbHeight - 55 - 40, 30,
                                                       chartWidth, "y-title-rect");
            svg.appendChild(yTitleRect);
            var yTitleContent = charts[i].yUnit === "" ?
                charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
            var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - yTitleContent.length,
                                                   chartLbHeight - 55 - 20, yTitleContent,
                                                   "y-title");
            svg.appendChild(yTitle);

            for (var k = 0; k < mappedData.yData.length; k++) {
                if (mappedData.yData[k] !== "") {
                    var anchor = svgHelper.drawCircleByClass(mappedData.yData[k] + chartLbWidth,
                                            mappedData.xData[k] + chartLbHeight - 55,
                                            4, "graphCircle");
                    anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                    // svg.appendChild(anchor);
                    var plotHeight = (chartHeight / mappedData.xData.length) - 13;
                    if(plotHeight > 27) { plotHeight = 27; }
                    if(svg.getElementsByClassName("zeroPlane").length > 0) {
                        // var xZeroLine = svg.getElementsByClassName("zeroPlane");
                        // var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
                        // if(charts[i].yData[k] < 0) {
                        //     var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight -
                        //                        55 - zeroPlaneY;
                        //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        //     zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                        // } else {
                        //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        //     chartUbHeight - mappedData.yData[k] - 55,
                        //     mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 55, plotWidth,
                        //     "column-plot");
                        // }
                    } else {
                        columnPlot = svgHelper.drawRectByClass(chartLbWidth,
                        mappedData.xData[k] + chartLbHeight - (plotHeight / 2) - 55,
                        plotHeight, mappedData.yData[k],
                        "column-plot");
                    }
                    columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
                    svg.appendChild(columnPlot);
                }
            }
        } else {
            console.log("Unsupported chart visualization.");
        }

    };

    Chart.BarChartRenderer.prototype.drawIncompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width, columnsAreComplete) {
        var columnPlot, yTitle;
        var mappedCharts  = [];
        var chartUbHeight = Math.ceil(height - (0.095 * height)) + 55;
        var chartUbWidth  = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.025 * height)) + 55;
        var chartLbWidth  = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                             chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        var yAxis = new Chart.YAxis(chartLbWidth, chartLbHeight - 15, chartLbWidth, chartUbHeight - 15,
                              "yAxis", columnsAreComplete);
        yAxis.render(svg);
        yAxis.renderTicks(svg, mappedData.xTicks);
        if(i % chartsInARow === 0) {
            yAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
        }
        // yAxis.renderDivs(svg, mappedData.yTicks, chartHeight, chartLbWidth, chartWidth);
        // yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

        var xAxis = new Chart.XAxis(chartLbWidth, chartLbHeight - 15, chartUbWidth, chartLbHeight - 15,
                              "xAxis", columnsAreComplete);
        xAxis.render(svg);
        xAxis.renderTicks(svg, mappedData.yTicks);
        var shortYData = charts[i].yTicks.map(function(currentValue) {
            return Chart.chartUtilities.shortenLargeNumber(currentValue, 2);
        });
        if(i < chartsInARow) {
            xAxis.renderTickValues(svg, mappedData.yTicks, shortYData);
        }

        var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartUbHeight - 7, 30, chartWidth,
                                                   "y-title-rect");
        svg.appendChild(yTitleRect);
        var yTitleContent = charts[i].yUnit === "" ?
            charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
        if(this.charts[0].vis === "crosstab") {
            yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15,
                                               chartUbHeight + 15, yTitleContent, "y-title");
        } else if(this.charts[0].vis === "trellis"){
            yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - yTitleContent.length,
                                               chartUbHeight + 15, yTitleContent, "y-title");
        } else {
            console.log("Unsupported chart visualization.");
        }
        svg.appendChild(yTitle);

        for (var k = 0; k < mappedData.yData.length; k++) {
            if (mappedData.yData[k] !== "") {
                var anchor = svgHelper.drawCircleByClass(mappedData.yData[k] + chartLbWidth,
                                        chartHeight - mappedData.xData[k] + chartLbHeight - 15,
                                        4, "graphCircle");
                anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                // svg.appendChild(anchor);
                var plotHeight = (chartHeight / mappedData.xData.length) - 13;
                if(plotHeight > 27) { plotHeight = 27; }
                if(svg.getElementsByClassName("zeroPlane").length > 0) {
                    // var xZeroLine = svg.getElementsByClassName("zeroPlane");
                    // var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
                    // if(charts[i].yData[k] < 0) {
                    //     var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight -
                    //                        15 - zeroPlaneY;
                    //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    //     zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                    // } else {
                    //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    //     chartUbHeight - mappedData.yData[k] - 15,
                    //     mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 15, plotWidth,
                    //     "column-plot");
                    // }
                } else {
                    columnPlot = svgHelper.drawRectByClass(chartLbWidth,
                    mappedData.xData[k] + chartLbHeight - (plotHeight / 2) - 15,
                    plotHeight, mappedData.yData[k],
                    "column-plot");
                }
                columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
                svg.appendChild(columnPlot);
            }
        }
    };

    Chart.BarChartRenderer.prototype.createCharts = function(charts, height, width, rowCount) {
        var columnsAreComplete, multiCharts, svg;
        var svgHelper    = new Chart.SvgHelper();
        var chartsInARow = Math.floor(window.innerWidth / (width));

        if(this.charts[0].vis === "crosstab") {
            multiCharts = document.getElementsByClassName("multi-chart" + rowCount);
            columnsAreComplete = true;              // since crosstabs always have their columns complete
        } else if(this.charts[0].vis === "trellis") {
            multiCharts = document.getElementsByClassName("multi-chart");
            if(chartsInARow > multiCharts.length) {
                chartsInARow = multiCharts.length;
            }
            if(multiCharts.length % chartsInARow === 0) {
                columnsAreComplete = true;
            } else {
                columnsAreComplete = false;
            }
        } else {
            console.log("Visualization unsupported.");
        }
        for (var i = 0; i < multiCharts.length; i++) {
            if(this.charts[0].vis === "crosstab") {
                svg = svgHelper.createSvgByClass(height, width, "chart-svg");
                if(i === 0) {
                    this.drawRowName(charts, multiCharts, svgHelper, svg, height, width, i, rowCount);
                } else if(i === 1) {
                    this.drawYLabels(charts, multiCharts, svgHelper, svg, height, width, i, rowCount);
                } else {
                    if(columnsAreComplete) {
                        this.drawCompleteCharts(i - 2, charts, multiCharts, chartsInARow, svgHelper,
                            svg, height, width, columnsAreComplete, rowCount);
                    } else {
                        this.drawIncompleteCharts(i - 2, charts, multiCharts, chartsInARow, svgHelper,
                            svg, height, width, columnsAreComplete);
                    }
                }
                multiCharts[i].appendChild(svg);
                if(i > 0) {
                    multiCharts[i].style.borderRight = "1px solid black";
                }
            } else if(this.charts[0].vis === "trellis") {
                svg = svgHelper.createSvgByClass(height + 55, width + 55, "chart-svg");

                if(columnsAreComplete) {
                    this.drawCompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                        svg, height, width, columnsAreComplete);
                } else {
                    this.drawIncompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                        svg, height, width, columnsAreComplete);
                }

                multiCharts[i].appendChild(svg);
            } else {
                console.log("Visualization unsupported.");
            }
            var xValueElements = svg.getElementsByClassName("x-value");
            for(var e = 0; e < xValueElements.length; e++) {
                var rotationPt = svgHelper.getRotationPoint(xValueElements[e]);
                xValueElements[e].setAttributeNS(null, "transform",
                    "rotate(270 " + rotationPt + ")");
            }
        }
    };
})();
