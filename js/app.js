(function($, win){
    // Create angular app
    var app = angular.module('AdminPanel', ['ngResource', 'ui.router', 'ui-notification', 'webStorageModule', 'ngTable']);

    // Configuring angular app
    app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider){
        // Redirect from unknown urls to /
        $urlRouterProvider.otherwise('/');
        // Remove hash in urls /#login to normal /login
        $locationProvider.html5Mode(true);
        // Set hash urls /# to /#!/ for older browsers
        $locationProvider.hashPrefix('!');

        // Configuring url and templates
        $stateProvider
            .state('login', {
                url: '/',
                templateUrl: 'views/login.html',
                controller: 'loginCtrl'
            })
            .state('home', {
                url: '/home',
                templateUrl: 'views/home.html',
                controller: 'homeCtrl',
                abstract: true
            }).
            state('home.dash', {
                url: '/dash',
                templateUrl: 'views/dashboard.html',
                controller: 'dashboardCtrl'
            }).
            state('home.tableEvents', {
                url: '/table/events',
                templateUrl: 'views/events.html',
                controller: 'eventsCtrl'
            }).
            state('home.tableSpeakers', {
                url: '/table/speakers',
                templateUrl: 'views/speakers.html',
                controller: 'speakersCtrl'
            });

        /*
         Need configure Ngnix for redirect like this url http://localhost/home/table/speakers on our app index.html
         location / {
             expires -1;
             add_header Pragma "no-cache";
             root your/path;
             add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
             try_files $uri $uri/ /index.html =404;
         }

         Or htaccess

         RewriteEngine on
         RewriteCond %{REQUEST_FILENAME} -s [OR]
         RewriteCond %{REQUEST_FILENAME} -l [OR]
         RewriteCond %{REQUEST_FILENAME} -d
         RewriteRule ^.*$ - [NC,L]

         RewriteRule ^(.*) /your/path/index.html [NC,L]
         */
    }]);

    /**
     * First run app, configuring defaults.
     * @param $rootScope
     * @param $state
     * @param Session
     * @param Notification
     * @param webStorage
     */
    app.run(['$rootScope', '$state', 'Session', 'Notification', 'webStorage', function ($rootScope, $state, Session, Notification, webStorage){
        var session = webStorage.session.get('session'),
            user = webStorage.session.get('user');

        // If have session and user, then set, suddenly was refresh page
        if(session)
            Session.setSession(session);

        if(user)
            Session.setUser(user);

        /**
         * Event change url
         * @param event - object Event $state
         * @param newUrl - object new $state
         * @param params - object params new $state
         */
        $rootScope.$on('$stateChangeStart', function (event, newUrl, params){
            var date,
                expires;

            if(Session.isLoggedIn()){
                date = new Date().getTime();
                expires = Session.getSession().expires;

                // If expire time session, then logout
                if(date >= expires)
                    Session.logout();
                else
                // Redirect to home if we have session go to '/'
                if(newUrl.url == '/'){
                    $state.go('home.dash', {});
                    event.preventDefault();
                }

            }else
            // Redirect to /login if close session
            if(newUrl.url != '/')
                Session.logout();
        });
    }]);
})(jQuery, window);