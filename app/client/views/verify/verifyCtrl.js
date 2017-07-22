angular.module('reg')
  .controller('VerifyCtrl', [
    '$scope',
    '$stateParams',
    'AuthService',
    function($scope, $stateParams, AuthService) {
      const token = $stateParams.token;

      $scope.loading = true;

      if (token) {
        AuthService.verify(token,
          (user) => {
            $scope.success = true;

            $scope.loading = false;
          },
          (err) => {
            console.log(err);
            $scope.loading = false;
          });
      }
    }]);
