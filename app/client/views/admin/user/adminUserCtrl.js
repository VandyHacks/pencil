angular.module('app')
  .controller('AdminUserCtrl', [
    '$scope',
    '$http',
    'EMAILS_TO_SCHOOLS',
    'user',
    'UserService',
    function ($scope, $http, emailsToSchools, User, UserService) {
      $scope.selectedUser = User.data;

      // Populate the school dropdown
      populateSchools();

      /**
       * TODO: JANK WARNING
       */
      function populateSchools() {
        const email = $scope.selectedUser.email.split('@')[1];

        if (emailsToSchools[email]) {
          $scope.selectedUser.profile.school = emailsToSchools[email].school;
          $scope.autoFilledSchool = true;
        }
      }

      $scope.updateProfile = function () {
        UserService
          .updateProfile($scope.selectedUser._id, $scope.selectedUser.profile)
          .success((data) => {
            $scope.$selectedUser = data;
            swal('Updated!', 'Profile updated.', 'success');
          })
          .error(() => {
            swal('Oops, you forgot something.');
          });
      };
    }]);
