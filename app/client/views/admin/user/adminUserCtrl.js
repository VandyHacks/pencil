angular.module('reg')
  .controller('AdminUserCtrl', [
    '$scope',
    '$http',
    'user',
    'UserService',
    function($scope, $http, User, UserService) {
      $scope.selectedUser = User.data;

      // Populate the school dropdown
      populateSchools();

      /**
       * TODO: JANK WARNING
       */
      function populateSchools() {
        $http
          .get('/assets/schools.json')
          .then((res) => {
            const schools = res.data;
            const email = $scope.selectedUser.email.split('@')[1];

            if (schools[email]) {
              $scope.selectedUser.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });
      }

      $scope.updateProfile = function() {
        UserService
          .updateProfile($scope.selectedUser._id, $scope.selectedUser.profile)
          .success((data) => {
            $selectedUser = data;
            swal('Updated!', 'Profile updated.', 'success');
          })
          .error(() => {
            swal('Oops, you forgot something.');
          });
      };
    }]);
