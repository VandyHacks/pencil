angular.module('app')
  .controller('AdminUsersCtrl', [
    '$scope',
    '$state',
    '$stateParams',
    'UserService',
    function ($scope, $state, $stateParams, UserService) {
      $scope.pages = [];
      $scope.users = [];

      // Semantic-UI moves modal content into a dimmer at the top level.
      // While this is usually nice, it means that with our routing will generate
      // multiple modals if you change state. Kill the top level dimmer node on initial load
      // to prevent this.
      $('.ui.dimmer').remove();
      // Populate the size of the modal for when it appears, with an arbitrary user.
      $scope.selectedUser = {};
      $scope.selectedUser.sections = generateSections({
        status: '',
        confirmation: {
          dietaryRestrictions: []
        },
        profile: ''
      });

      $scope.$watch('queryText', (queryText) => {
        $stateParams.queryText = queryText;
        refreshPage();
      });
      $scope.$watch('showUnsubmitted', (val) => {
        $stateParams.showUnsubmitted = val;
        refreshPage();
      });
      $scope.$watch('showAdmitted', (val) => {
        $stateParams.showAdmitted = val;
        refreshPage();
      });
      $scope.$watch('pageNum', (pageNum) => {
        $stateParams.page = pageNum - 1; // convert to zero-index
        refreshPage();
      });

      function refreshPage() {
        function updatePageData(data) {
          $scope.users = data.users;
          $scope.currentPage = data.page;
          $scope.pageSize = data.size;
          $scope.totalNumUsers = data.count;
          $scope.pages = data.totalPages;
        }
        const showUnsubmitted = $stateParams.showUnsubmitted || false;
        const showAdmitted = $stateParams.showAdmitted || false;
        UserService
          .getPage($stateParams.page, $stateParams.size, $stateParams.queryText, showUnsubmitted, showAdmitted)
          .success((data) => {
            updatePageData(data);
          });
      }
      // initial page refresh
      refreshPage();

      $scope.goToPage = function (page) {
        $state.go('app.admin.users', {
          page: page,
          size: $stateParams.size || 50
        });
      };

      $scope.goUser = function ($event, user) {
        $event.stopPropagation();

        $state.go('app.admin.user', {
          id: user._id
        });
      };

      $scope.acceptUser = function ($event, user, index) {
        $event.stopPropagation();

        swal({
          title: 'Whoa, wait a minute!',
          text: 'You are about to accept ' + user.profile.name + '!',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, accept them.',
          closeOnConfirm: false
        }, () => {
          swal({
            title: 'Are you sure?',
            text: 'This action cannot be undone, and will be logged.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, accept this user.',
            closeOnConfirm: false
          }, () => {
            UserService
              .admitUser(user._id)
              .success((user) => {
                $scope.users[index] = user;
                swal('Accepted', user.profile.name + ' has been admitted.', 'success');
              })
              .error(() => {
                swal('Error', 'User has not submitted an application.', 'error');
              });
          });
        });
      };

      $scope.initiateAcceptAll = function (users) {
        const userEmailList = [];
        users.forEach(user => userEmailList.push(user.email));
        let userListString = '';

        const NUM_USERS_DISPLAYED = 5;
        userEmailList.slice(0, NUM_USERS_DISPLAYED).forEach(user => { userListString += user + '\n'; });

        const numusers = $scope.totalNumUsers;
        if (numusers === 0) {
          // sanity check
          return;
        }
        if (numusers > NUM_USERS_DISPLAYED) {
          userListString += `... ${numusers - NUM_USERS_DISPLAYED} more \n`;
        }

        swal({
          title: 'Whoa, wait a minute!',
          text: `You are about to accept ${numusers} people!\n` + userListString,
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, accept them.',
          closeOnConfirm: false
        }, () => {
          swal({
            title: 'Are you sure?',
            text: 'This action cannot be undone, and will be logged.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, accept these users.',
            closeOnConfirm: false
          }, () => {
            UserService
              .admitAll($stateParams.queryText)
              .success(() => {
                swal('All people in search have been accepted.');
              });
          });
        });
      };

      $scope.sendQrCode = function ($event, user, index) {
        $event.stopPropagation();

        swal({
          title: 'Whoa, wait a minute!',
          text: 'You are about to send a QR code to  ' + user.profile.name + '!',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, send a code.',
          closeOnConfirm: false
        }, () => {
          UserService
            .sendQrCode(user._id)
            .success((user) => {
              $scope.users[index] = user;
              swal('Sent', user.profile.name + ' has been sent a QR code.', 'success');
            });
        });
      };

      function formatTime(time) {
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.rowClass = function (user) {
        if (user.admin) {
          return 'admin';
        }
        if (user.status.confirmed) {
          return 'positive';
        }
        if (user.status.admitted && !user.status.confirmed) {
          return 'warning';
        }
      };

      function selectUser(user) {
        $scope.selectedUser = user;
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }

      function generateSections(user) {
        const address = user.confirmation.address;
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Created On',
                value: formatTime(user.timestamp)
              }, {
                name: 'Last Updated',
                value: formatTime(user.lastUpdated)
              }, {
                name: 'Confirm By',
                value: formatTime(user.status.confirmBy) || 'N/A'
              }, {
                name: 'Email',
                value: user.email
              }, {
                name: 'Team',
                value: user.teamCode || 'None'
              }
            ]
          }, {
            name: 'Profile',
            fields: [
              {
                name: 'Name',
                value: user.profile.name
              }, {
                name: 'Gender',
                value: user.profile.gender
              }, {
                name: 'School',
                value: user.profile.school
              }, {
                name: 'Graduation Year',
                value: user.profile.graduationYear
              }, {
                name: 'Description',
                value: user.profile.description
              }, {
                name: 'Essay',
                value: user.profile.essay
              }, {
                name: 'Majors',
                value: user.profile.majors
              }, {
                name: 'Github',
                value: user.profile.github,
                type: 'link'
              }, {
                name: 'LinkedIn',
                value: user.profile.linkedin,
                type: 'link'
              }, {
                name: 'DevPost',
                value: user.profile.devpost,
                type: 'link'
              }, {
                name: 'Resume link',
                value: user.profile.resumePath,
                type: 'link'
              }
            ]
          }, {
            name: 'Confirmation',
            fields: [
              {
                name: 'Phone Number',
                value: user.confirmation.phoneNumber
              }, {
                name: 'Dietary Restrictions',
                value: user.confirmation.dietaryRestrictions.join(', ')
              }, {
                name: 'Shirt Size',
                value: user.confirmation.shirtSize
              }, {
                name: 'Needs Hardware',
                value: user.confirmation.needsHardware,
                type: 'boolean'
              }, {
                name: 'Hardware Requested',
                value: user.confirmation.hardware
              }
            ]
          }, {
            name: 'Travel',
            fields: [
              {
                name: 'Needs Reimbursement',
                value: user.confirmation.needsReimbursement,
                type: 'boolean'
              }, {
                name: 'Received Reimbursement',
                value: user.confirmation.needsReimbursement && user.status.reimbursementGiven
              }, {
                name: 'Address',
                value: address ? [
                  address.line1,
                  address.line2,
                  address.city,
                  ',',
                  address.state,
                  address.zip,
                  ',',
                  address.country
                ].join(' ') : ''
              }, {
                name: 'Additional Notes',
                value: user.confirmation.notes
              }
            ]
          }
        ];
      }

      $scope.selectUser = selectUser;
    }]);
