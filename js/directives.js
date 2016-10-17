(function($, win){
    // Get angular app
    var app = angular.module('AdminPanel');

    app.directive('trackedTable', function(){
        return {
            restrict: "A",
            priority: -1,
            require: "ngForm",
            controller: 'trackedTableController'
        };
    });

    app.directive("trackedTableRow", function(){
        return {
            restrict: "A",
            priority: -1,
            require: ["^trackedTable", "ngForm"],
            controller: 'trackedTableRowController'
        };
    });

    app.directive("trackedTableCell", function() {
        return {
            restrict: "A",
            priority: -1,
            scope: true,
            require: ["^trackedTableRow", "ngForm"],
            controller: 'trackedTableCellController'
        };
    });

})(jQuery, window);