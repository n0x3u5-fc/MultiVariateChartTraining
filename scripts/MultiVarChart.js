/**
 * @constructor
 */
var MultiVarChart = function(index, vis, type, xTitle, yTitle, xData, yData, xUnit, yUnit) {
	'use strict';
	this.index  = index;
	this.vis    = vis;
	this.type   = type;
	this.xTitle = xTitle;
	this.yTitle = yTitle;
	this.xData  = xData;
	this.yData  = yData;
	this.xUnit  = xUnit ? xUnit : "";
	this.yUnit  = yUnit ? yUnit : "";
};