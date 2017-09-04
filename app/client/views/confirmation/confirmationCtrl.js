angular.module('app')
  .controller('ConfirmationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    'currentUser',
    'Utils',
    'UserService',
    function ($scope, $rootScope, $state, currentUser, Utils, UserService) {
      // Set up the user
      const user = currentUser.data;
      $scope.user = user;

      $scope.pastConfirmation = Date.now() > user.status.confirmBy;

      $scope.formatTime = Utils.formatTime;

      _setupForm();

      $scope.fileName = user._id + '_' + user.profile.name.split(' ').join('_');

      // -------------------------------
      // All this just for dietary restriction checkboxes fml

      const dietaryRestrictions = {
        'Vegetarian': false,
        'Vegan': false,
        'Halal': false,
        'Kosher': false,
        'Gluten-free': false,
        'Nut Allergy': false
      };

      if (user.confirmation.dietaryRestrictions) {
        user.confirmation.dietaryRestrictions.forEach((restriction) => {
          if (restriction in dietaryRestrictions) {
            dietaryRestrictions[restriction] = true;
          }
        });
      }

      $scope.dietaryRestrictions = dietaryRestrictions;

      // -------------------------------

      function _updateUser(e) {
        const confirmation = $scope.user.confirmation;
        // Get the dietary restrictions as an array
        const drs = [];
        Object.keys($scope.dietaryRestrictions).forEach((key) => {
          if ($scope.dietaryRestrictions[key]) {
            drs.push(key);
          }
        });
        confirmation.dietaryRestrictions = drs;

        UserService
          .updateConfirmation(user._id, confirmation)
          .success((data) => {
            sweetAlert({
              title: 'Woo!',
              text: "You're confirmed!",
              type: 'success',
              confirmButtonColor: '#e76482'
            }, () => {
              $state.go('app.dashboard');
            });
          })
          .error((res) => {
            sweetAlert('Uh oh!', 'Something went wrong.', 'error');
          });
      }

      function _setupForm() {
        // Semantic-UI form validation
        $('.ui.form').form({
          fields: {
            phone: {
              identifier: 'phone',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter a phone number.'
                }
              ]
            },
            shirt: {
              identifier: 'shirt',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a shirt size.'
                }
              ]
            },
            city: {
              identifier: 'city',
              depends: 'needsReimbursement',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the city you are traveling from.'
                }
              ]
            },
            state: {
              identifier: 'state',
              depends: 'needsReimbursement',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the state you are traveling from.'
                }
              ]
            },
            zip: {
              identifier: 'zip',
              depends: 'needsReimbursement',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the zip you are traveling from.'
                }
              ]
            },
            country: {
              identifier: 'country',
              depends: 'needsReimbursement',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the country you are traveling from.'
                }
              ]
            },
            notes: {
              identifier: 'notes',
              optional: true,
              rules: [
                {
                  type: 'maxLength',
                  value: 2500,
                  prompt: 'Your additional notes cannot be longer than 2500 characters.'
                }
              ]
            }
          }
        });
      }

      $scope.submitForm = function () {
        $('.ui.form').form('validate form');
        if ($('.ui.form').form('is valid')) {
          _updateUser();
        }
      };
    }]);
