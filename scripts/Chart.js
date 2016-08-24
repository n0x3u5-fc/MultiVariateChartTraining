goog.provide("Chart");
/**
 * @constructor
 */
var Chart = function(url) {
    'use strict';
    this.render = function(renderDiv) {
        var data = new Chart.Data(renderDiv);
        data.ajaxLoader(url, data.dataParser.bind(data));
        if(this.customSort) {
        	data.customSort = this.customSort;
        }
    };
}