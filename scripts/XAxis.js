/**
 * @constructor
 */
var XAxis = function(startX, startY, endX, endY, className, columnsAreComplete) {
	'use strict';
	Axis.call(this, startX, startY, endX, endY, className, columnsAreComplete);
};
chartUtilities.inheritsFrom(XAxis, Axis);
XAxis.prototype.renderTicks = function(svg, xTicks) {
	'use strict';
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
XAxis.prototype.renderTickValues = function(svg, xTicks, xData) {
	'use strict';
    var xValues;
	for (var xTick of xTicks) {
        var xValuesContent = xData[xTicks.indexOf(xTick)];
        if(this.columnsAreComplete) {
            if(xTicks.indexOf(xTick) === xTicks.length - 1 && this.chartVis === "crosstabs") {
                xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY + 32, "",
                                                     "x-value");
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
