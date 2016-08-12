/**
 * @constructor
 */
var BarChartRenderer = function(charts, chartProperties) {
	'use strict';
	this.charts = charts;
    this.chartProperties = chartProperties;
};
BarChartRenderer.prototype.displayHeaders = function(height, width, keys) {
    'use strict';
    var headerText,
        svgHelper = new SvgHelper();
    for(var key of keys) {
        this.createDivs("chart-area");
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
BarChartRenderer.prototype.drawRowName = function(charts, multiCharts, svgHelper, svg, height, width, i, rowCount) {
    'use strict';
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
BarChartRenderer.prototype.drawYLabels = function(charts, multiCharts, svgHelper, svg, height, width, i, rowCount) {
    'use strict';
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
BarChartRenderer.prototype.drawX = function(height, width, keys, title) {
    'use strict';
    var mappedCharts  = [];
    var formattedTickValues = [];
    var chartUbHeight = Math.ceil(height);
    var chartUbWidth  = Math.ceil(width);
    var chartLbHeight = Math.floor(0);
    var chartLbWidth  = Math.floor(1);
    var chartHeight   = chartUbHeight - chartLbHeight;
    var chartWidth    = chartUbWidth - chartLbWidth;
    var svgHelper     = new SvgHelper();

    var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                     chartLbWidth, this.charts[0]);
    mappedCharts.push(mappedData);

    for(var key of keys) {
        var div = document.createElement('span');
        div.setAttribute('class', "multi-chart-footer");
        div.style.display = "inline-block";
        var renderDiv = document.getElementById("chart-area");
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
                    formattedTickValues.push(chartUtilities.shortenLargeNumber(yTick, 2));
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
BarChartRenderer.prototype.displayCharts = function(height, width, rowCount) {
    'use strict';
    var maxY = -Infinity, minY = Infinity;
    this.createDivs("chart-area", rowCount);
    this.createDivs("chart-area", rowCount);
    for (var i = 0; i < this.charts.length; i++) {
        var tempMaxY = Math.max.apply(Math, this.charts[i].yData.map(chartUtilities.nullMaxMapper));
        var tempMinY = Math.min.apply(Math, this.charts[i].yData.map(chartUtilities.nullMinMapper));
        if(tempMaxY > maxY) {
            maxY = tempMaxY;
        }
        if(tempMinY < minY) {
            minY = tempMinY;
        }
        if (minY !== Infinity || maxY !== -Infinity) {
            this.createDivs("chart-area", rowCount);
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
};
BarChartRenderer.prototype.createDivs = function(targetDiv, rowCount) {
    'use strict';
    var div = document.createElement('span');
    if(rowCount !== undefined) {
        div.setAttribute('class', "multi-chart" + rowCount);
    } else {
        div.setAttribute('class', "multi-chart-header");
    }
    div.style.display = "inline-block";
    var renderDiv = document.getElementById(targetDiv);
    renderDiv.appendChild(div);
};
BarChartRenderer.prototype.colorPlots = function(criteria) {
    'use strict';
    var color, lumRatio;
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
        var plots = currentValue.getElementsByClassName("bar-plot");
        Array.from(plots).map(function(currentValue, index, array) {
            var colorCriteria = Number(currentValue.getAttributeNS(null, "data-criteria"));
            if(colorCriteria < 0) {
                lumRatio = colorCriteria / lossDiff;
                color = chartUtilities.generateColor(that.negativeColor, that.negativeColorEnd, lumRatio);
            } else {
                lumRatio = colorCriteria / profitDiff;
                color = chartUtilities.generateColor(that.plotColor, that.plotColorEnd, lumRatio);
            }
            currentValue.setAttributeNS(null, "fill", color);
        });
    });
};
BarChartRenderer.prototype.drawCompleteCharts = function(i, charts, multiCharts,
    chartsInARow, svgHelper, svg, height, width, columnsAreComplete, rowCount) {
    'use strict';
    var columnPlot;
    var mappedCharts  = [];
    var formattedTickValues = [];
    var chartUbHeight = Math.ceil(height);
    var chartUbWidth  = Math.ceil(width);
    var chartLbHeight = Math.floor(0);
    var chartLbWidth  = Math.floor(1);
    var chartHeight   = chartUbHeight - chartLbHeight;
    var chartWidth    = chartUbWidth - chartLbWidth;
    var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                     chartLbWidth, charts[i]);
    mappedCharts.push(mappedData);
    var yAxis = new Chart.YAxis(chartLbWidth, chartLbHeight, chartLbWidth, chartUbHeight,
                          "yAxis", columnsAreComplete);
    yAxis.type = "category";
    // yAxis.render(svg);
    // yAxis.renderTicks(svg, mappedData.xTicks);
    // yAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
    yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

    var xAxis = new Chart.XAxis(chartUbWidth, chartUbHeight, chartLbWidth, chartUbHeight,
                          "xAxis", columnsAreComplete);
    xAxis.type = "numeric";
    if(rowCount !== this.totalRows - 1) {
        xAxis.render(svg);
    }
    // xAxis.renderTicks(svg, mappedData.yTicks);
    if (i >= multiCharts.length - chartsInARow) {
        for(var yTick of charts[i].yTicks) {
            formattedTickValues.push(chartUtilities.shortenLargeNumber(yTick, 2));
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

    for (var k = 0; k < mappedData.yData.length; k++) {
        if (mappedData.yData[k] !== "") {
            var anchor = svgHelper.drawCircleByClass(mappedData.yData[k] + chartLbWidth,
                                    mappedData.xData[k] + chartLbHeight,
                                    4, "graphCircle");
            anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
            // svg.appendChild(anchor);
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
            // columnPlot.setAttributeNS(null, "data-color", );
            svg.appendChild(columnPlot);
        }
    }
};

BarChartRenderer.prototype.drawIncompleteCharts = function(i, charts, multiCharts,
    chartsInARow, svgHelper, svg, height, width, columnsAreComplete) {
    'use strict';
    var columnPlot;
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
    yAxis.renderTicks(svg, mappedData.yTicks);
    yAxis.renderTickValues(svg, mappedData.yTicks, charts[i].yTicks);
    yAxis.renderDivs(svg, mappedData.yTicks, chartHeight, chartLbWidth, chartWidth);
    yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

    var xAxis = new Chart.XAxis(chartLbWidth, chartLbHeight - 15, chartLbWidth, chartLbHeight - 15,
                          "xAxis", columnsAreComplete);
    xAxis.render(svg);
    xAxis.renderTicks(svg, mappedData.xTicks);
    if(i < chartsInARow) {
        xAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
    }

    var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartUbHeight - 7, 30, chartWidth, "y-title-rect");
    svg.appendChild(yTitleRect);
    var yTitleContent = charts[i].yUnit === "" ?
        charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
    var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartUbHeight + 15, yTitleContent,
                                           "y-title");
    svg.appendChild(yTitle);

    for (var k = 0; k < mappedData.yData.length; k++) {
        if (mappedData.yData[k] !== "") {
            var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                    chartHeight - mappedData.yData[k] + chartLbHeight - 15,
                                    4, "graphCircle");
            anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
            // svg.appendChild(anchor);
            var plotWidth = (chartWidth / mappedData.xData.length) - 10;
            if(svg.getElementsByClassName("zeroPlane").length > 0) {
                var xZeroLine = svg.getElementsByClassName("zeroPlane");
                var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
                if(charts[i].yData[k] < 0) {
                    var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight - 15 - zeroPlaneY;
                    columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                } else {
                    columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    chartUbHeight - mappedData.yData[k] - 15,
                    mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 15, plotWidth,
                    "column-plot");
                }
            } else {
                columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                chartUbHeight - mappedData.yData[k] - 15,
                mappedData.yData[k], plotWidth,
                "column-plot");
            }
            columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
            svg.appendChild(columnPlot);
        }
    }
};

BarChartRenderer.prototype.createCharts = function(charts, height, width, rowCount) {
    'use strict';
    var columnsAreComplete;
    var svgHelper    = new SvgHelper();
    var chartsInARow = Math.floor(window.innerWidth / (width));

    var multiCharts = document.getElementsByClassName("multi-chart" + rowCount);
    columnsAreComplete = true;              // since crosstabs always have their columns complete
    for (var i = 0; i < multiCharts.length; i++) {
        var svg = svgHelper.createSvgByClass(height, width, "chart-svg");
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
        var xValueElements = svg.getElementsByClassName("x-value");
        for(var e = 0; e < xValueElements.length; e++) {
            var rotationPt = svgHelper.getRotationPoint(xValueElements[e]);
            xValueElements[e].setAttributeNS(null, "transform",
                "rotate(270 " + rotationPt + ")");
        }
    }
};
