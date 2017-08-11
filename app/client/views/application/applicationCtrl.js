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
    function($scope, $rootScope, $state, $http, currentUser, possibleMajors, Settings, Session, UserService) {
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

        // Jank way to do data binding for semantic ui dropdown
        $scope.user.profile.majors = $('.ui.dropdown').dropdown('get value');

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
          fullTextSearch: 'exact',
          match: 'text',
          values: possibleMajors.map((major) => ({
            name: major,
            value: major
          })),
          maxSelections: 3
        });
        // Jank way to do data binding for semantic ui dropdown
        if ($scope.user.profile.majors) {
          const majors = $scope.user.profile.majors.split(',');
          $('.ui.dropdown').dropdown('set selected', majors);
        }

        console.log('init dropzone - lastResumeName: ' + $scope.user.profile.lastResumeName);
        // Shitty file uploads
        window.resumeDropzone = $('div#resume-upload').dropzone({
          url: `/api/users/${Session.getUserId()}/resume`,
          acceptedFiles: [
            'application/msword', // doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.oasis.opendocument.text', // odt
            'application/x-iwork-pages-sffpages', // pages
            'application/pdf' // pdf
          ],
          createImageThumbnails: false,
          maxFilesize: 2,
          uploadMultiple: false,
          sending: function(file, xhr, formData) {
            xhr.setRequestHeader('x-access-token', window.localStorage.jwt);
            xhr.setRequestHeader('client-file-name')
          },
          success: function (file, successMsg) {
            console.log(file.name);
            $scope.user.profile.lastResumeName = file.name;
          }
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
            majors: {
              identifier: 'majors',
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
          _updateUser();
        }
      };
    }]);
