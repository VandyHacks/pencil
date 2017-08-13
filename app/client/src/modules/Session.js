angular.module('app')
  .service('Session', [
    '$rootScope',
    '$window',
    function ($rootScope, $window) {
      this.create = function (token, user) {
        $window.localStorage.jwt = token;
        $window.localStorage.currentUser = JSON.stringify(user);
        $rootScope.currentUser = user;
      };

      this.destroy = function (onComplete) {
        delete $window.localStorage.jwt;
        delete $window.localStorage.userId;
        delete $window.localStorage.currentUser;
        $rootScope.currentUser = null;
        if (onComplete) {
          onComplete();
        }
      };

      this.getToken = function () {
        return $window.localStorage.jwt;
      };

      this.getUser = function () {
        return JSON.parse($window.localStorage.currentUser);
      };

      this.getUserId = function () {
        return this.getUser()._id;
      };

      this.setUser = function (user) {
        $window.localStorage.currentUser = JSON.stringify(user);
        $rootScope.currentUser = user;
      };
    }
  ]);
