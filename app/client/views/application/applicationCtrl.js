angular.module('app')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'MAJORS',
    'EMAILS_TO_SCHOOLS',
    'SCHOOLS',
    'settings',
    'Session',
    'UserService',
    function ($scope, $rootScope, $state, $http, currentUser, possibleMajors, emailsToSchools, possibleSchools, Settings, Session, UserService) {
      const sweetAlertButtonColor = '';

      // Set up the user
      $scope.user = currentUser.data;

      // Is the student from Vanderbilt?
      $scope.isVandyStudent = $scope.user.email.split('@')[1] === 'vanderbilt.edu';
      // $scope.user.email.split('@')[1] === 'vandyhacks.org' ||
      // $scope.user.profile.school === 'Vanderbilt University';

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
        'White or Euro-American': false,
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
        $scope.user.profile.majors = $('#majorsDropdown').dropdown('get value');
        if (!$scope.autoFilledSchool) $scope.user.profile.school = $('#schoolDropdown').dropdown('get value');

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
        const email = $scope.user.email.split('@')[1];

        if (emailsToSchools[email]) {
          $scope.user.profile.school = emailsToSchools[email].school;
          $scope.autoFilledSchool = true;
        }
      }

      function _setupForm() {
        // Initialize dropdowns
        $('#majorsDropdown').dropdown({
          fullTextSearch: 'exact',
          match: 'text',
          values: possibleMajors.map((major) => ({
            name: major,
            value: major
          })),
          maxSelections: 3
        });
        $('#schoolDropdown').dropdown({
          allowAdditions: true,
          fullTextSearch: 'exact',
          match: 'text',
          values: possibleSchools.map((school) => ({
            name: school,
            value: school
          }))
        });
        // Jank way to do data binding for semantic ui dropdown
        if ($scope.user.profile.majors) {
          const majors = $scope.user.profile.majors.split(',');
          $('#majorsDropdown').dropdown('set exactly', majors);
        }
        if (!$scope.autoFilledSchool && $scope.user.profile.school) {
          $('#schoolDropdown').dropdown('set selected', $scope.user.profile.school);
        }

        // Shitty file uploads
        const dropzoneEl = $('div#resume-upload');
        const updateDropzoneText = text => dropzoneEl.find('.upload-status').text(text);

        const defaultMsg = 'Drag file here or click to upload';
        const progressMsg = progress => `Uploading (${Math.floor(progress)}%)...`;
        const successMsg = 'Upload successful!';
        const failureMsg = 'Upload failed, please retry.';

        dropzoneEl.dropzone({
          url: `/api/users/${Session.getUserId()}/resume`,
          acceptedFiles: [
            'application/msword', // doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.oasis.opendocument.text', // odt
            'application/x-iwork-pages-sffpages', // pages
            'application/pdf' // pdf
          ].join(','),
          createImageThumbnails: false,
          maxFilesize: 2,
          uploadMultiple: false,
          addedfile: () => {},
          sending: function (file, xhr, formData) {
            xhr.setRequestHeader('x-access-token', Session.getToken());
          },
          uploadprogress: function (file, progress, bytes) {
            updateDropzoneText(progressMsg(progress));
          },
          success: function (file, msg) {
            // eslint-disable-next-line no-return-assign
            $scope.$apply(() => $scope.user.profile.lastResumeName = file.name);
            updateDropzoneText(successMsg);
            $('#resume-upload-wrapper').removeClass('error');
            setTimeout(() => updateDropzoneText(defaultMsg), 2000);
          },
          error: function (file, msg) {
            updateDropzoneText(failureMsg);
            setTimeout(() => updateDropzoneText(defaultMsg), 2000);
          }
        });
        updateDropzoneText(defaultMsg);

        // custom form validation rule
        $.fn.form.settings.rules.ethnicityChecked = value => Object.values($scope.ethnicities).some(ethnicity => {
          return ethnicity === true; // At least one must be checked
        });
        // Semantic-UI form validation
        // @ts-ignore
        $('.ui.form').form({
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                },
                {
                  type: 'maxLength',
                  value: 100
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                },
                {
                  type: 'maxLength',
                  value: 250
                }
              ]
            },
            year: {
              identifier: 'year',
              rules: [
                {
                  type: 'integer[2018..2022]',
                  prompt: 'Please select your graduation year.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender, or select "Prefer not to disclose".'
                }
              ]
            },
            ethnicity: {
              identifier: 'ethnicity',
              rules: [
                {
                  type: 'ethnicityChecked',
                  prompt: 'Please select an ethnicity, or select "Prefer not to disclose".'
                }
              ]
            },
            essay: {
              identifier: 'essay',
              optional: true,
              rules: [
                {
                  type: 'maxLength',
                  value: 2500,
                  prompt: 'Your response to the optional prompt cannot be longer than 2500 characters.'
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
            lastResumeName: {
              identifier: 'lastResumeName',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please upload a resume.'
                }
              ]
            },
            github: {
              identifier: 'github',
              optional: true,
              rules: [
                {
                  type: 'url',
                  prompt: 'Please enter a valid URL for your Github profile.'
                }
              ]
            },
            devpost: {
              identifier: 'devpost',
              optional: true,
              rules: [
                {
                  type: 'url',
                  prompt: 'Please enter a valid URL for your Devpost profile.'
                }
              ]
            },
            linkedin: {
              identifier: 'linkedin',
              optional: true,
              rules: [
                {
                  type: 'url',
                  prompt: 'Please enter a valid URL for your LinkedIn profile.'
                }
              ]
            },
            website: {
              identifier: 'website',
              optional: true,
              rules: [
                {
                  type: 'url',
                  prompt: 'Please enter a valid URL for your portfolio.'
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
            },
            volunteer: {
              identifier: 'volunteer',
              rules: []
            },
            mentor: {
              identifier: 'mentor',
              rules: []
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
