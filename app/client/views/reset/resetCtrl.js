angular.module('app')
  .controller('ResetCtrl', [
    '$scope',
    '$stateParams',
    '$state',
    'AuthService',
    function($scope, $stateParams, $state, AuthService) {
      const token = $stateParams.token;

      $scope.loading = true;

      $scope.changePassword = function() {
        const password = $scope.password;
        const confirm = $scope.confirm;

        if (password !== confirm) {
          $scope.error = "Passwords don't match!";
          $scope.confirm = '';
          return;
        }

        AuthService.resetPassword(
          token,
          $scope.password,
          (message) => {
            sweetAlert({
              title: 'Neato!',
              text: 'Your password has been changed!',
              type: 'success',
              confirmButtonColor: '#e76482'
            }, () => {
              $state.go('login');
            });
          },
          (data) => {
            $scope.error = data.message;
            $scope.loading = false;
          });
      };
    }]);
