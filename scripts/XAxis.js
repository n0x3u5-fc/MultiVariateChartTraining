goog.require("Chart");
;(function(){
    'use strict';
    /**
     * @constructor
     */
    Chart.XAxis = function(startX, startY, endX, endY, className, columnsAreComplete) {
        Chart.Axis.call(this, startX, startY, endX, endY, className, columnsAreComplete);
    };
    chartUtilities.inheritsFrom(Chart.XAxis, Chart.Axis);
    Chart.XAxis.prototype.renderTicks = function(svg, xTicks) {
        var tickLength = 5;
        var xTickLine;
        for (var xTick of xTicks) {
            if(this.columnsAreComplete) {
                xTickLine = this.svgHelper.drawLineByClass(xTick, this.startY, xTick,
                                                           this.endY + tickLength, "xTick");
            } else {
                xTickLine = this.svgHelper.drawLineByClass(xTick, this.startY - tickLength, xTick,
                                                           this.startY, "xTick");
            }
            svg.appendChild(xTickLine);
        }
    };
    Chart.XAxis.prototype.renderTickValues = function(svg, xTicks, xData) {
        var xValues;
        for (var xTick of xTicks) {
            var xValuesContent = xData[xTicks.indexOf(xTick)];
            if(this.columnsAreComplete) {
                if(this.chartVis === "crosstabs") {
                    if(xTicks.indexOf(xTick) === xTicks.length - 1) {
                        xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY + 22, "",
                                                             "x-value");
                    } else {
                        xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY + 22, xValuesContent,
                                                             "x-value");
                    }
                } else {
                    xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY + 32, xValuesContent,
                                                         "x-value");
                }
            } else {
                xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY - 23, xValuesContent,
                                                         "x-value");
            }
            svg.appendChild(xValues);
        }
    };
})();
