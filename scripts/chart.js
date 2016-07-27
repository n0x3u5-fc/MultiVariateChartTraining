var Chart = function(url) {
    'use strict';
    this.render = function() {
        var data = new Data();
        data.ajaxLoader(url, data.dataParser.bind(data));
        data.customSort = this.customSort;
    };
};