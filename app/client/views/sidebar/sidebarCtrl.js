angular.module('app')
  .controller('SidebarCtrl', [
    '$rootScope',
    '$scope',
    'Utils',
    'AuthService',
    'Session',
    'EVENT_INFO',
    function ($rootScope, $scope, Utils, AuthService, Session, EVENT_INFO) {
      const user = $rootScope.currentUser;

      $scope.EVENT_INFO = EVENT_INFO;

      if (user && user.status) {
        $scope.pastConfirmation = Utils.isAfter(user.status.confirmBy);
      }

      $scope.logout = function () {
        AuthService.logout();
      };

      $scope.showSidebar = false;
      $scope.toggleSidebar = function () {
        $scope.showSidebar = !$scope.showSidebar;
      };

      // oh god jQuery hack
      $('.item').on('click', () => {
        $scope.showSidebar = false;
      });
    }]);
