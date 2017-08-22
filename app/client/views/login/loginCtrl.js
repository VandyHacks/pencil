angular.module('app')
  .controller('LoginCtrl', [
    '$scope',
    '$http',
    '$state',
    'settings',
    'Utils',
    'AuthService',
    function ($scope, $http, $state, settings, Utils, AuthService) {
      // Is registration open?
      const Settings = settings.data;
      const sweetAlertButtonColor = '';
      $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Start state for login
      $scope.loginState = 'login';

      function onSuccess() {
        $state.go('app.dashboard');
      }

      function onError(data) {
        $scope.error = data.message;
      }

      function resetError() {
        $scope.error = null;
      }

      $scope.login = function () {
        resetError();
        AuthService.loginWithPassword(
          $scope.email, $scope.password, onSuccess, onError);
      };

      $scope.register = function () {
        resetError();
        AuthService.register(
          $scope.email, $scope.password, () => {
            sweetAlert({
              title: 'Registration complete!',
              text: 'A confirmation email will be sent to you shortly. If you don\'t receive it within the next few minutes, please check your spam folder.',
              type: 'success',
              confirmButtonColor: sweetAlertButtonColor
            });
          }, onError);
      };

      $scope.setLoginState = function (state) {
        if ($scope.loginState !== state) {
          $scope.loginState = state;
          resetError();
        }
      };

      $scope.sendResetEmail = function () {
        resetError();
        AuthService.sendResetEmail($scope.email, () => {
          sweetAlert({
            title: "Don't sweat!",
            text: 'If the email you submitted matches our records, you\'ll receive a reset link shortly.',
            type: 'success',
            confirmButtonColor: sweetAlertButtonColor
          });
        }, onError);
      };
    }
  ]);
