(function($, win){
    // Get angular app
    var app = angular.module('AdminPanel');

    /**
     * @service Tables
     * Resource fo get and edit tables
     * @param $resource
     * @param Session
     */
    app.service("Tables", ['$resource', 'Session',  function($resource, Session){

        /**
        * Set token for $resource
        * @param token {string} session token
        * @returns $resource.
        */
        this.setToken = function(token){
            return $resource(Session.get('apiPath') + '/:data/:className/:id', {
                id: "@id",
                className: '@className',
                data: '@data'
            }, {
                get: {
                    headers: {
                        'QB-Token': token
                    }
                },
                update: {
                    method:'PUT',
                    headers: {
                        'QB-Token': token
                    }
                }
            });
        };
    }]);

    /**
     * @service Data
     * Service for storage/manage data
     * @param webStorage
     */
    app.service('Data', function(webStorage){
        var session = {},
            user = {},
            // Constants, it is more comfortable than angular constants
            constants = {
                applicationId: 48231,
                authorizationKey: 'EeqhcgLW-qZPTqN',
                authorizationSecret: 'yXP6ejeahQXqnPY',

                apiPath: 'https://api.quickblox.com',
                sessionEndPoint: '/session.json',
                loginEndPoint: '/login.json',
                classEndPoint: '/class.json'
            };

        /**
         * Get constant
         * @param param {String} name of constant
         * @return {*}
         */
        this.get = function(param){
            if(typeof constants[param] != 'undefined')
                return constants[param];

            return '';
        };

        this.auth = {
            is: false,
            /**
             * Save session
             * @param _session {Object}
             */
            set: function(_session){
                this.is = true;
                session = _session;
                webStorage.session.set('session', _session);
            },
            /**
             * Get session
             * @return {Object}
             */
            get: function(){
                return session;
            },
            /**
             * Clear session
             */
            clear: function(){
                this.is = false;
                session = {};
                webStorage.session.remove('session');
            }
        };

        this.profile = {
            is: false,
            /**
             * Save user
             * @param _user {Object} user data
             */
            set: function(_user){
                this.is = true;
                user = _user;
                webStorage.session.set('user', _user);
            },
            /**
             * Get user
             * @return {Object}
             */
            get: function(){
                return user;
            },
            /**
             * Clear user
             */
            clear: function(){
                this.is = false;
                user = {};
                webStorage.session.remove('user');
            }
        };
    });

    /**
     * @service Session
     * Service for get/set session and user in REST Api
     * @param $http
     * @param $state
     * @param Data
     * @param Notification
     * @param $timeout
     */
    app.service('Session', function($http, $state, Data, Notification, $timeout){
        var self = this;

        /**
         * Get constant
         * @param param {String} name of constant
         * @return {*}
         */
        this.get = function(param){
            return Data.get(param);
        };

        /**
         * Check user login status
         * @return {Boolean}
         */
        this.isLoggedIn = function(){
            return Data.auth.is == true;
        };

        /**
         * Redirect to administrator panel
         */
        this.login = function(){
            $state.go('home.dash', {});
        };

        /**
         * Clear all data session and user and go to login
         * @param hardLogout {Boolean} if true logout with REST Api
         */
        this.logout = function(hardLogout){
            var token;

            if(hardLogout){
                token = self.getSession().token;
                $http({
                    method: 'DELETE',
                    url: self.get('apiPath') + self.get('loginEndPoint'),
                    headers: {
                        'QuickBlox-REST-API-Version': '0.1.0',
                        'QB-Token': token
                    }
                }).finally(function(){
                    Data.profile.clear();

                    $http({
                        method: 'DELETE',
                        url: self.get('apiPath') + self.get('sessionEndPoint'),
                        headers: {
                            'QuickBlox-REST-API-Version': '0.1.0',
                            'QB-Token': self.getSession().token
                        }
                    }).finally(function(){
                        Data.auth.clear();
                        $state.go('login', {});
                    });
                });
            }else{
                Data.profile.clear();
                Data.auth.clear();

                // Need wait for init $state
                $timeout(function(){
                    $state.go('login', {});
                }, 0);
            }
        };

        /**
         * Save session data
         * @param session {Object}
         * @param timestamp {Number} Date timestamp
         */
        this.setSession = function(session, timestamp){
            var date;

            if(timestamp){
                date = new Date(timestamp * 1000);
                date.setTime(date.getTime() + (2 * 60 * 60 * 1000));

                // Set expires timestamp
                session.expires = date.getTime();
            }

            Data.auth.set(session);
        };

        /**
         * Get session data
         * @return {Object} session data
         */
        this.getSession = function(){
            return Data.auth.get();
        };

        /**
         * Save user data
         * @param user {Object} user data
         */
        this.setUser = function(user){
            Data.profile.set(user);
        };

        /**
         * Get user data
         * @return {Object} user data
         */
        this.getUser = function(){
            return Data.profile.get();
        };

        /**
         * Get user data REST Api
         * @param login {String}
         * @param password {String}
         */
        this.getUserData = function(login, password){
            $http({
                method: 'POST',
                url: self.get('apiPath') + self.get('loginEndPoint'),
                headers: {
                    'QuickBlox-REST-API-Version': '0.1.0',
                    'QB-Token': self.getSession().token
                },
                data: {
                    'login': login,
                    'password': password
                }
            })
            .then(
                function successGetAuth(json) {
                    if(json.status == 202 && json.statusText == 'Accepted' && json.data.user){
                        Notification.success({message: 'Вы вошли', title: 'Войти'});
                        self.setUser(json.data.user);
                        self.login();
                    }
                },
                function errorGetAuth(json) {
                    Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Войти'});

                    if(json && (json.status || json.statusText))
                        console.log((function(){
                            return (json.status ? 'status: ' + json.status : '') + (json.status ? ', ' : '') + (json.statusText ? 'statusText: ' + json.statusText : '')
                        })());

                    if(json && json.data && json.data.errors)
                        for(var param in json.data.errors)
                            console.log(param + ':', (function(errors){
                                var result = '';

                                if(angular.isArray(errors))
                                    angular.forEach(errors, function(value, key){
                                        result += value + (errors.length == key + 1 ? '' : ', ');
                                    });
                                else
                                    result = errors;

                                return result;
                            })(json.data.errors[param]));
                }
            );
        };

        /**
         *
         * @param login {String}
         * @param password {String}
         * @param loginClickEventEnd {Function} fire in the end
         */
        this.getAuth = function(login, password, loginClickEventEnd){
            var timestamp = Math.floor(new Date().getTime() / 1000),
                random = Math.floor(Math.random() * (99999 - 1 + 1)) + 1,
                signatureString = 'application_id=' + self.get('applicationId')
                    + '&auth_key=' + self.get('authorizationKey')
                    + '&nonce=' + random
                    + '&timestamp=' + timestamp
                    + '&user[login]=' + login
                    + '&user[password]=' + password,
                signature = CryptoJS.HmacSHA1(signatureString, self.get('authorizationSecret'));

            $http({
                method: 'POST',
                url: self.get('apiPath') + self.get('sessionEndPoint'),
                headers: {
                    'QuickBlox-REST-API-Version': '0.1.0'
                },
                data: {
                    'application_id': self.get('applicationId'),
                    'auth_key': self.get('authorizationKey'),
                    'timestamp': timestamp,
                    'nonce': random,
                    'signature': signature.toString(),
                    'user[login]': login,
                    'user[password]': password
                }
            })
            .then(
                function successGetAuth(json) {
                    if(json.status == 201 && json.statusText == 'Created' && json.data.session){
                        self.setSession(json.data.session, timestamp);
                        self.getUserData(login, password);
                    }else
                        Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Войти'});
                },
                function errorGetAuth(json) {
                    Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Войти'});

                    if(json && (json.status || json.statusText))
                        console.log((function(){
                            return (json.status ? 'status: ' + json.status : '') + (json.status ? ', ' : '') + (json.statusText ? 'statusText: ' + json.statusText : '')
                        })());

                    if(json && json.data && json.data.errors)
                        for(var param in json.data.errors)
                            console.log(param + ':', (function(errors){
                                var result = '';

                                if(angular.isArray(errors))
                                    angular.forEach(errors, function(value, key){
                                        result += value + (errors.length == key + 1 ? '' : ', ');
                                    });
                                else
                                    result = errors;

                                return result;
                            })(json.data.errors[param]));
                }
            ).finally(function(){
                if(angular.isFunction(loginClickEventEnd))
                    loginClickEventEnd.call(this);
            });
        };
    });
})(jQuery, window);