angular.module('app')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'MAJORS',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, majors, Settings, Session, UserService) {
      const sweetAlertButtonColor = '';

      // Set up the user
      $scope.user = currentUser.data;

      // Is the student from Vanderbilt?
      $scope.isVandyStudent = $scope.user.email.split('@')[1] === 'vanderbilt.edu';

      // If so, default them to adult: true
      if ($scope.isVandyStudent) {
        $scope.user.profile.adult = true;
      }

      // Populate the school dropdown
      populateSchools();
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose;

      // -------------------------------
      // All this just for ethnicity checkboxes fml

      const ethnicities = {
        'Asian or Asian-American': false,
        'Black, Afro-Caribbean, or African-American': false,
        'Hispanic, Latino, or Spanish origin': false,
        'Middle Eastern or North African': false,
        'Native American or Alaska Native': false,
        'Native Hawaiian or Pacific Islander': false,
        'Non-Hispanic White or Euro-American': false,
        'None of the above': false,
        'Prefer not to disclose': false
      };

      if ($scope.user.profile.ethnicities) {
        $scope.user.profile.ethnicities.forEach((ethnicity) => {
          if (ethnicity in ethnicities) {
            ethnicities[ethnicity] = true;
          }
        });
      }

      $scope.ethnicities = ethnicities;

      function _updateUser(e) {
        // Get the ethnicities as an array
        const ethnicities = [];
        Object.keys($scope.ethnicities).forEach((key) => {
          if ($scope.ethnicities[key]) {
            ethnicities.push(key);
          }
        });
        $scope.user.profile.ethnicities = ethnicities;

        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .success((data) => {
            sweetAlert({
              title: 'Awesome!',
              text: 'Your application has been saved.',
              type: 'success',
              confirmButtonColor: sweetAlertButtonColor
            }, () => {
              $state.go('app.dashboard');
            });
          })
          .error((res) => {
            sweetAlert('Uh oh!', 'Something went wrong.', 'error');
          });
      }

      /**
       * TODO: JANK WARNING
       */
      function populateSchools() {
        $http
          .get('/assets/schools.json')
          .then((res) => {
            const schools = res.data;
            const email = $scope.user.email.split('@')[1];

            if (schools[email]) {
              $scope.user.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });
      }

      function _setupForm() {
        // Initialize majors dropdown
        $('.ui.dropdown').dropdown({
          values: majors.map((major) => ({
            name: major,
            value: major
          })),
          maxSelections: 3
        });
        // Semantic-UI form validation
        $('.ui.form').form({
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                }
              ]
            },
            year: {
              identifier: 'year',
              rules: [
                {
                  type: 'integer[2018..2021]',
                  prompt: 'Please select your graduation year.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            ethnicity: {
              identifier: 'ethnicity',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select an ethnicity.'
                }
              ]
            },
            major: {
              identifier: 'major',
              rules: [
                {
                  type: 'minCount',
                  value: 1,
                  prompt: 'Please select a major.'
                }
              ]
            },
            resume: {
              identifier: 'resume',
              rules: [
                {
                  type: 'url',
                  prompt: 'Please enter the URL of your resume.'
                }
              ]
            },
            signatureCodeOfConduct: {
              identifier: 'signatureCodeOfConduct',
              rules: [
                {
                  type: 'match',
                  value: 'name',
                  prompt: 'Your digital signature must match your full name.'
                }
              ]
            },
            adult: {
              identifier: 'adult',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must be an adult.'
                }
              ]
            }
          }
        });
      }

      $scope.submitForm = function() {
        $('.ui.form').form('validate form');
        if ($('.ui.form').form('is valid')) {
          console.log($scope.user.profile);
          _updateUser();
        } else {
          document.body.scrollTop = 0;
        }
      };
    }]);
