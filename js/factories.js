(function($, win){
    // Get angular app
    var app = angular.module('AdminPanel');

    /**
     * @factory AdminPage
     * Set title (<title>, <h3>) and body class
     * @param $rootScope
     */
    app.factory("AdminPage", function($rootScope){
        return {
            /**
             * Set title
             * @param title {String}
             */
            setTitle: function(title){
                $rootScope.pageTitle = title;
            },
            /**
             * Set setClass
             * @param bodyClass {String}
             */
            setClass: function(bodyClass){
                $rootScope.bodyClass = bodyClass;
            }
        };
    });
})(jQuery, window);