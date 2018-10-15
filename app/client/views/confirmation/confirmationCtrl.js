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

      const name = user.profile && user.profile.name ? user.profile.name : '';
      $scope.fileName = user._id + '_' + name.split(' ').join('_');

      $scope.waiverLinkClicked = false;

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

        function normalizePhoneNumber(phoneNumberString) {
          const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
          const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
          if (match) {
            const intlCode = (match[1] ? '+1 ' : '');
            return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
          }
          return null;
        }
        const normalizedNum = normalizePhoneNumber($('#phonenum')[0].value.trim());
        // quick valid phonenum check: correct # of digits, contains no letters
        if (!normalizedNum) {
          sweetAlert('Uh oh!', 'Please enter a valid phone number.', 'error');
          return;
        }
        console.log(normalizedNum);

        // make sure they even clicked the link the first time they confirm (reduces Redcap API requests)
        /*
        // Clicks sometimes don't register on mobile
        // https://stackoverflow.com/questions/28987034/button-not-working-on-mobile-devices-but-works-on-pc-bootstrap
        if (!$scope.waiverLinkClicked && !user.status.confirmed) {
          sweetAlert('Uh oh!', 'Please sign the waiver form!', 'error');
          return;
        }
        */

        // make sure they actually signed the waiver form using Redcap API (proxy through server)

        UserService
          .checkSignedWaiver()
          .success((data) => {
            // if signed form, proceed
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
                sweetAlert('Uh oh!', 'Something went wrong during confirmation.', 'error');
              });
          })
          .error((res) => {
            // if didn't sign form or filled out wrongly
            sweetAlert('Uh oh!', 'Please sign the waiver form completely and use your school email.', 'error');
          });
      }

      function _setupForm() {
        $('#waiverlink').click(() => {
          $scope.waiverLinkClicked = true;
          console.log('clicked');
          return true; // act normal
        });

        // default sms permission
        $scope.user.confirmation.smsPermission = true;

        // Semantic-UI form validation
        // @ts-ignore
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
            smsPermission: {
              identifier: 'smsPermission',
              rules: []
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
            waiversigned: {
              identifier: 'waiversigned',
              rules: [
                {
                  type: 'checked',
                  prompt: 'Please confirm that you have signed the waiver form.'
                }
              ]
            },
            lightningTalker: {
              identifier: 'lightningTalker',
              optional: true,
              rules: []
            },
            notes: {
              identifier: 'notes',
              optional: true,
              rules: [
                {
                  type: 'maxLength',
                  value: 500,
                  prompt: 'Your additional notes cannot be longer than 500 characters.'
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
