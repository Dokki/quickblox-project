(function($, win){
    // Get angular app
    var app = angular.module('AdminPanel');

    /**
     * @controller adminCtrl
     * @param $scope
     */
    app.controller('adminCtrl', function($scope) {

    });

    /**
     * @controller loginCtrl
     * Controller for page Login
     * @param $scope
     * @param AdminPage
     * @param Session
     * @param Notification
     */
    app.controller('loginCtrl', function($scope, AdminPage, Session, Notification) {
        AdminPage.setClass('login');
        AdminPage.setTitle('Панель управления - Войти');

        /**
         * Set password and login, need remove it later
         */
        $scope.ohhMyGod = function(){
            $scope.login = 'test_admin';
            $scope.password = 'password';
        };

        /**
         * Login button click, init login
         */
        $scope.loginClick = function(){
            var error = false,
                errorMessage = '';

            $scope.disabled = true;

            if(!$scope.login){
                error = true;
                errorMessage = 'Введите логин';
            }

            if(!$scope.password){
                error = true;
                errorMessage += !errorMessage ? 'Введите пароль' : ' и пароль';
            }

            if(error){
                Notification.error({message: errorMessage, title: 'Войти'});
                $scope.disabled = false;
            }else
                Session.getAuth($scope.login, $scope.password, function loginClickEventEnd(){
                    $scope.disabled = false;
                });
        };
    });

    /**
     * @controller homeCtrl
     * Controller for page home
     * @param $scope
     * @param AdminPage
     * @param Session
     * @param $state
     */
    app.controller('homeCtrl', function($scope, AdminPage, Session, $state) {
        var user = Session.getUser();

        AdminPage.setTitle('Панель управления - Рабочий стол');
        AdminPage.setClass('nav-md');

        $scope.userName = user.full_name || user.login;

        /**
         * Logout button click, init Logout
         */
        $scope.logout = function(){
            Session.logout(true);
        };

        /**
         * Set class active for menu in side bar to all parent tags
         * @param states
         * @return {*}
         */
        $scope.active = function(states){
            if(states.length == 1)
                return states[0] == $state.current.name;

            return (function(){
                var result = false;

                for(var i = 0; i < states.length; i++)
                    if(states[i] == $state.current.name){
                        result = true;
                        break;
                    }

                return result;
            })();
        };
    });

    /**
     * @controller dashboardCtrl
     * Controller for page Dashboard, main page in Admin panel
     * @param $scope
     * @param AdminPage
     */
    app.controller('dashboardCtrl', function($scope, AdminPage) {
        $scope.titleTab = 'Рабочий стол';
        AdminPage.setTitle('Панель управления - Рабочий стол');
    });

    /**
     * @controller eventsCtrl
     * Controller for page Events, page for Event tables
     * @param $scope
     * @param AdminPage
     * @param NgTableParams
     * @param Session
     * @param Tables
     * @param Notification
     */
    app.controller('eventsCtrl', function($scope, AdminPage, NgTableParams, Session, Tables, Notification){
        var originalTable;

        $scope.titleTab = 'Таблицы События';
        $scope.show = true;
        AdminPage.setTitle('Панель управления - Таблицы События');

        $scope.cancel = cancel;
        $scope.save = save;

        /**
         * Cancel edit
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         */
        function cancel(row, rowForm) {
            angular.extend(resetRow(row, rowForm), _.findWhere(originalTable, function(r){
                return r._id === row._id;
            }));
        }

        /**
         * Save edited cells
         * Я Не смог сохранять результаты, так как у юзера нету прав на это
         * Скриншоты:
         * 1 - https://s.mail.ru/9mD3/eG4ifTExn
         * 2 - https://s.mail.ru/4kFS/3sKaTtffA
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         */
        function save(row, rowForm){
            var originalTableRow = _.findWhere(originalTable, function(r){
                    return r._id === row._id;
                }),
                rowToSave = {};

            angular.forEach(['Title', 'Description', 'BeginDate', 'EndDate'], function(value){
                if(originalTableRow[value] != row[value])
                    rowToSave[value] = row[value];
            });

            Tables.setToken(Session.getSession().token).update({className: 'Event', data: 'data', id: row._id + '.json'}, rowToSave).$promise.then(
                function(json){
                    var originalRow = resetRow(row, rowForm);

                    angular.extend(originalRow, row);

                    angular.forEach(originalTable, function(value, key){
                        if(originalTable[key]._id == row._id)
                            angular.extend(originalTable[key], rowToSave);
                    });

                    Notification({message: 'Сохранено', title: 'Таблица События'});
                },
                function(){
                    Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Таблица События'});
                }
            );
        }

        /**
         * Returns row in normal views
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         * @return {Object} object row {Title: '', Description: ''}
         */
        function resetRow(row, rowForm){
            row.isEditing = false;
            rowForm.$setPristine();
            $scope.tableTracker.untrack(row);

            return _.findWhere($scope.tableParams.data, function(r){
                return r._id === row._id;
            });
        }

        Tables.setToken(Session.getSession().token).get({className: 'Event.json', data: 'data'}).$promise.then(
            function(json){
                if(json && json.items && json.items.length){
                    $scope.tableParams = new NgTableParams({}, {
                        dataset: json.items
                    });

                    originalTable = angular.copy(json.items);
                }
                else
                if(json && json.items && !json.items.length)
                    Notification.error({message: 'Пустая таблица', title: 'Таблица События'});

                $scope.show = false;
            },
            function(){
                Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Таблица События'});
                $scope.show = false;
            }
        );
    });

    /**
     * @controller speakersCtrl
     * Controller for page Speakers, page for Speaker tables
     * @param $scope
     * @param AdminPage
     * @param NgTableParams
     * @param Session
     * @param Tables
     * @param Notification
     */
    app.controller('speakersCtrl', function($scope, AdminPage, NgTableParams, Session, Tables, Notification){
        var originalTable;

        $scope.titleTab = 'Таблицы Докладчики';
        $scope.show = true;
        AdminPage.setTitle('Панель управления - Таблицы Докладчики');

        $scope.cancel = cancel;
        $scope.save = save;

        /**
         * Cancel edit
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         */
        function cancel(row, rowForm) {
            angular.extend(resetRow(row, rowForm), _.findWhere(originalTable, function(r){
                return r._id === row._id;
            }));
        }

        /**
         * Save edited cells
         * Я Не смог сохранять результаты, так как у юзера нету прав на это
         * Скриншоты:
         * 1 - https://s.mail.ru/9mD3/eG4ifTExn
         * 2 - https://s.mail.ru/4kFS/3sKaTtffA
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         */
        function save(row, rowForm){
            var originalTableRow = _.findWhere(originalTable, function(r){
                    return r._id === row._id;
                }),
                rowToSave = {};

            angular.forEach(['FirstName', 'LastName', 'Биография', 'Birthday'], function(value){
                if(originalTableRow[value] != row[value])
                    rowToSave[value] = row[value];
            });

            Tables.setToken(Session.getSession().token).update({className: 'Event', data: 'data', id: row._id + '.json'}, rowToSave).$promise.then(
                function(json){
                    var originalRow = resetRow(row, rowForm);

                    angular.extend(originalRow, row);

                    angular.forEach(originalTable, function(value, key){
                        if(originalTable[key]._id == row._id)
                            angular.extend(originalTable[key], rowToSave);
                    });

                    Notification({message: 'Сохранено', title: 'Таблица События'});
                },
                function(){
                    Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Таблица События'});
                }
            );
        }

        /**
         * Returns row in normal views
         * @param row {Object} object row {Title: '', Description: ''}
         * @param rowForm {Object} object Form ngTable
         * @return {Object} object row {Title: '', Description: ''}
         */
        function resetRow(row, rowForm){
            row.isEditing = false;
            rowForm.$setPristine();
            $scope.tableTracker.untrack(row);

            return _.findWhere($scope.tableParams.data, function(r){
                return r._id === row._id;
            });
        }

        /**
         * Я не смог вытащить картинки из quickblox. :((
         * При запросе всех данных таблицы в поле Фото выводится uid картинки, я делал отдельный запрос
         * чтобы вытащить данные картиное но всегда выводился пустой список.
         * Вот скриншоты
         * 1 - https://s.mail.ru/8V2r/R6PFHWeB1
         * 1 - https://s.mail.ru/BbS7/UXbWaPKWE
         *
         * У меня получилось получить картинку в raw виде по такой ссылке
         * https://api.quickblox.com/data/<Class_name>/<record_id>/file.json
         * но я не стал городит и оставил так.
         */

        Tables.setToken(Session.getSession().token).get({className: 'Speaker.json', data: 'data'}).$promise.then(
            function(json){
                if(json && json.items && json.items.length){
                    $scope.tableParams = new NgTableParams({}, {
                        dataset: json.items
                    });

                    originalTable = angular.copy(json.items);
                }
                else
                if(json && json.items && !json.items.length)
                    Notification.error({message: 'Пустая таблица', title: 'Таблица Докладчики'});

                $scope.show = false;
            },
            function(){
                Notification.error({message: 'Произошла ошибка, попробуйте позже.', title: 'Таблица Докладчики'});
                $scope.show = false;
            }
        );
    });

    /**
     * @controller trackedTableController
     * Controller for table
     * @param $scope
     * @param $parse
     * @param $attrs
     */
    app.controller('trackedTableController', function ($scope, $parse, $attrs){
        var self = this,
            dirtyCellsByRow = [],
            invalidCellsByRow = [];

        init();

        /**
         * Init table tracker
         */
        function init() {
            var setter = $parse($attrs.trackedTable).assign;

            setter($scope.$parent, self);

            $scope.$parent.$on('$destroy', function() {
                setter(null);
            });

            self.reset = reset;
            self.isCellDirty = isCellDirty;
            self.setCellDirty = setCellDirty;
            self.setCellInvalid = setCellInvalid;
            self.untrack = untrack;
        }

        /**
         * Get cells
         * @param row {Object} object row {Title: '', Description: ''}
         * @param cellsByRow []
         * @return {Object} row object Form ngTable
         */
        function getCellsForRow(row, cellsByRow){
            return _.find(cellsByRow, function(entry) {
                return entry.row === row;
            })
        }

        /**
         * Is cell valid
         * @param row {Object} object row {Title: '', Description: ''}
         * @param cell {String} name of cell
         * @return {Boolean}
         */
        function isCellDirty(row, cell) {
            var rowCells = getCellsForRow(row, dirtyCellsByRow);

            return rowCells && rowCells.cells.indexOf(cell) !== -1;
        }

        /**
         * Reset row to normal views
         */
        function reset() {
            dirtyCellsByRow = [];
            invalidCellsByRow = [];
            setInvalid(false);
        }

        /**
         * Set cell status edited
         * @param row {Object} object row {Title: '', Description: ''}
         * @param cell {String} name of cell
         * @param isDirty {Boolean}
         */
        function setCellDirty(row, cell, isDirty) {
            setCellStatus(row, cell, isDirty, dirtyCellsByRow);
        }

        /**
         * Check cell is valid/invalid
         * @param row {Object} object row {Title: '', Description: ''}
         * @param cell {String} name of cell
         * @param isInvalid {Boolean}
         */
        function setCellInvalid(row, cell, isInvalid) {
            setCellStatus(row, cell, isInvalid, invalidCellsByRow);
            setInvalid(invalidCellsByRow.length > 0);
        }

        /**
         * Set status cell edited/no edited
         * @param row {Object} object row {Title: '', Description: ''}
         * @param cell {String} name of cell
         * @param value {Boolean} status
         * @param cellsByRow {Object} {cells: Array, row: Object} Edited cells in row
         */
        function setCellStatus(row, cell, value, cellsByRow) {
            var rowCells = getCellsForRow(row, cellsByRow);

            if(!rowCells && !value)
                return;

            if(value) {
                if(!rowCells) {
                    rowCells = {
                        row: row,
                        cells: []
                    };

                    cellsByRow.push(rowCells);
                }
                if (rowCells.cells.indexOf(cell) === -1)
                    rowCells.cells.push(cell);
            } else {
                angular.forEach(rowCells.cells, function(item, key){
                    if(cell === item)
                        rowCells.cells.splice(key, 1);
                });

                if(rowCells.cells.length === 0)
                    angular.forEach(cellsByRow, function(item, key){
                        if(rowCells === item)
                            cellsByRow.splice(key, 1);
                    });
            }
        }

        /**
         * Set valid/invalid cell
         * @param isInvalid {Boolean}
         */
        function setInvalid(isInvalid) {
            self.$invalid = isInvalid;
            self.$valid = !isInvalid;
        }

        /**
         * Remove cell checking
         * @param row {Object} object row {Title: '', Description: ''}
         */
        function untrack(row) {

            angular.forEach(invalidCellsByRow, function(item, key){
                if(item.row === row)
                    invalidCellsByRow.splice(key, 1);
            });

            angular.forEach(dirtyCellsByRow, function(item, key){
                if(item.row === row)
                    dirtyCellsByRow.splice(key, 1);
            });

            setInvalid(invalidCellsByRow.length > 0);
        }
    });

    /**
     * @controller trackedTableRowController
     * Controller for table
     * @param $attrs
     * @param $element
     * @param $parse
     * @param $scope
     */
    app.controller('trackedTableRowController', function ($attrs, $element, $parse, $scope){
        var self = this,
            row = $parse($attrs.trackedTableRow)($scope),
            trackedTableCtrl = $element.controller('trackedTable');

        self.isCellDirty = isCellDirty;
        self.setCellDirty = setCellDirty;
        self.setCellInvalid = setCellInvalid;

        /**
         * Check cell is edited
         * @param cell {String} name of cell
         * @return {Boolean}
         */
        function isCellDirty(cell) {
            return trackedTableCtrl.isCellDirty(row, cell);
        }

        /**
         * Set cell status edit/no edit
         * @param cell {String} name of cell
         * @param isDirty {Boolean}
         */
        function setCellDirty(cell, isDirty) {
            trackedTableCtrl.setCellDirty(row, cell, isDirty)
        }

        /**
         * Set cell valid/invalid
         * @param cell {String} name of cell
         * @param isInvalid {Boolean}
         */
        function setCellInvalid(cell, isInvalid) {
            trackedTableCtrl.setCellInvalid(row, cell, isInvalid)
        }
    });

    /**
     * @controller trackedTableCellController
     * Controller for table
     * @param $attrs
     * @param $element
     * @param $scope
     */
    app.controller('trackedTableCellController', function ($attrs, $element, $scope){
        var cellFormCtrl = $element.controller('form'),
            cellName = cellFormCtrl.$name,
            trackedTableRowCtrl = $element.controller('trackedTableRow');

        if (trackedTableRowCtrl.isCellDirty(cellName))
            cellFormCtrl.$setDirty();
        else
            cellFormCtrl.$setPristine();

        $scope.$watch(function() {
            return cellFormCtrl.$dirty;
        }, function(newValue, oldValue) {
            if(newValue === oldValue) return;

            trackedTableRowCtrl.setCellDirty(cellName, newValue);
        });

        $scope.$watch(function() {
            return cellFormCtrl.$invalid;
        }, function(newValue, oldValue) {
            if(newValue === oldValue) return;

            trackedTableRowCtrl.setCellInvalid(cellName, newValue);
        });
    });
})(jQuery, window);