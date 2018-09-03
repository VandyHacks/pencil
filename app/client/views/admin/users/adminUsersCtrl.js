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

      function updatePage(data) {
        $scope.users = data.users;
        $scope.currentPage = data.page;
        $scope.pageSize = data.size;

        const p = [];
        for (let i = 0; i < data.totalPages; i++) {
          p.push(i);
        }
        $scope.pages = p;
      }

      UserService
        .getPage($stateParams.page, $stateParams.size, $stateParams.query)
        .success((data) => {
          updatePage(data);
        });

      $scope.$watch('queryText', (queryText) => {
        $stateParams.queryText = queryText;
        UserService
          .getPage($stateParams.page, $stateParams.size, $stateParams.queryText)
          .success((data) => {
            updatePage(data);
          });
      });
      $scope.$watch('pageNum', (pageNum) => {
        $stateParams.page = pageNum;
        UserService
          .getPage($stateParams.page, $stateParams.size, $stateParams.queryText)
          .success((data) => {
            updatePage(data);
          });
      });

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

      $scope.toggleCheckIn = function ($event, user, index) {
        $event.stopPropagation();

        if (!user.status.checkedIn) {
          swal({
            title: 'Whoa, wait a minute!',
            text: 'You are about to check in ' + user.profile.name + '!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, check them in.',
            closeOnConfirm: false
          },
            () => {
              UserService
                .checkIn(user._id)
                .success((user) => {
                  $scope.users[index] = user;
                  swal('Accepted', user.profile.name + ' has been checked in.', 'success');
                });
            }
          );
        } else {
          UserService
            .checkOut(user._id)
            .success((user) => {
              $scope.users[index] = user;
              swal('Accepted', user.profile.name + ' has been checked out.', 'success');
            });
        }
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
            text: 'Your account will be logged as having accepted this user. ' +
            'Remember, this power is a privilege.',
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

      $scope.initiateAcceptAll = function (users) {
        /*
        if (users.length > 10) {
          alert('Too many people to accept at once!');
          return;
        } */
        console.log($scope.users);
        const userEmailList = [];
        users.forEach(user => userEmailList.push(user.email));
        let userListString = '';

        const NUM_USERS_DISPLAYED = 5;
        userEmailList.slice(0, NUM_USERS_DISPLAYED).forEach(user => { userListString += user + '\n'; });

        const numusers = users.length;
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
            text: 'Your account will be logged as having accepted all of these users. ' +
            'Remember, this power is a privilege.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, accept this users.',
            closeOnConfirm: false
          }, () => {
            users.forEach(user => {
              UserService
                .admitUser(user._id)
                .success((user) => {
                  swal('Accepted has been admitted.', 'success');
                });
            });
          });
        });
      };

      function generateSections(user) {
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
                name: 'Checked In',
                value: formatTime(user.status.checkInTime) || 'N/A'
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
            name: 'Hosting',
            fields: [
              {
                name: 'Needs Hosting Friday',
                value: user.confirmation.hostNeededFri,
                type: 'boolean'
              }, {
                name: 'Needs Hosting Saturday',
                value: user.confirmation.hostNeededSat,
                type: 'boolean'
              }, {
                name: 'Gender Neutral',
                value: user.confirmation.genderNeutral,
                type: 'boolean'
              }, {
                name: 'Cat Friendly',
                value: user.confirmation.catFriendly,
                type: 'boolean'
              }, {
                name: 'Smoking Friendly',
                value: user.confirmation.smokingFriendly,
                type: 'boolean'
              }, {
                name: 'Hosting Notes',
                value: user.confirmation.hostNotes
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
                value: user.confirmation.address ? [
                  user.confirmation.address.line1,
                  user.confirmation.address.line2,
                  user.confirmation.address.city,
                  ',',
                  user.confirmation.address.state,
                  user.confirmation.address.zip,
                  ',',
                  user.confirmation.address.country
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
