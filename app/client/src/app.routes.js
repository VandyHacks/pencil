angular.module('app')
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    function(
      $stateProvider,
      $urlRouterProvider,
      $locationProvider) {
      // For any unmatched url, redirect to /state1
      $urlRouterProvider.otherwise('/404');

      // Set up de states
      $stateProvider
        .state('login', {
          url: '/login',
          templateUrl: 'views/login/login.html',
          controller: 'LoginCtrl',
          data: {
            requireLogin: false
          },
          resolve: {
            'settings': function(SettingsService) {
              return SettingsService.getPublicSettings();
            }
          }
        })
        .state('app', {
          views: {
            '': {
              templateUrl: 'views/base.html'
            },
            'sidebar@app': {
              templateUrl: 'views/sidebar/sidebar.html',
              controller: 'SidebarCtrl',
              resolve: {
                'settings': function(SettingsService) {
                  return SettingsService.getPublicSettings();
                }
              }

            }
          },
          data: {
            requireLogin: true
          }
        })
        .state('app.dashboard', {
          url: '/',
          templateUrl: 'views/dashboard/dashboard.html',
          controller: 'DashboardCtrl',
          resolve: {
            currentUser: function(UserService) {
              return UserService.getCurrentUser();
            },
            settings: function(SettingsService) {
              return SettingsService.getPublicSettings();
            }
          }
        })
        .state('app.application', {
          url: '/application',
          templateUrl: 'views/application/application.html',
          controller: 'ApplicationCtrl',
          resolve: {
            currentUser: function(UserService) {
              return UserService.getCurrentUser();
            },
            settings: function(SettingsService) {
              return SettingsService.getPublicSettings();
            }
          }
        })
        .state('app.confirmation', {
          url: '/confirmation',
          templateUrl: 'views/confirmation/confirmation.html',
          controller: 'ConfirmationCtrl',
          resolve: {
            currentUser: function(UserService) {
              return UserService.getCurrentUser();
            }
          }
        })
        .state('app.team', {
          url: '/team',
          templateUrl: 'views/team/team.html',
          controller: 'TeamCtrl',
          data: {
            requireVerified: true
          },
          resolve: {
            currentUser: function(UserService) {
              return UserService.getCurrentUser();
            },
            settings: function(SettingsService) {
              return SettingsService.getPublicSettings();
            }
          }
        })
        .state('app.admin', {
          views: {
            '': {
              templateUrl: 'views/admin/admin.html',
              controller: 'AdminCtrl'
            }
          },
          data: {
            requireAdmin: true
          }
        })
        .state('app.admin.stats', {
          url: '/admin',
          templateUrl: 'views/admin/stats/stats.html',
          controller: 'AdminStatsCtrl'
        })
        .state('app.admin.users', {
          url: '/admin/users?' +
            '&page' +
            '&size' +
            '&query',
          templateUrl: 'views/admin/users/users.html',
          controller: 'AdminUsersCtrl'
        })
        .state('app.admin.user', {
          url: '/admin/users/:id',
          templateUrl: 'views/admin/user/user.html',
          controller: 'AdminUserCtrl',
          resolve: {
            'user': function($stateParams, UserService) {
              return UserService.get($stateParams.id);
            }
          }
        })
        .state('app.admin.settings', {
          url: '/admin/settings',
          templateUrl: 'views/admin/settings/settings.html',
          controller: 'AdminSettingsCtrl'
        })
        .state('reset', {
          url: '/reset/:token',
          templateUrl: 'views/reset/reset.html',
          controller: 'ResetCtrl',
          data: {
            requireLogin: false
          }
        })
        .state('verify', {
          url: '/verify/:token',
          templateUrl: 'views/verify/verify.html',
          controller: 'VerifyCtrl',
          data: {
            requireLogin: false
          }
        })
        .state('404', {
          url: '/404',
          templateUrl: 'views/404.html',
          data: {
            requireLogin: false
          }
        });

      $locationProvider.html5Mode({
        enabled: true
      });
    }
  ]).run([
    '$document',
    '$rootScope',
    '$state',
    'Session',
    function(
      $document,
      $rootScope,
      $state,
      Session) {
      $rootScope.$on('$stateChangeSuccess', () => {
        $document[0].body.scrollTop = $document[0].documentElement.scrollTop = 0;
      });

      $rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
        const requireLogin = toState.data.requireLogin;
        const requireAdmin = toState.data.requireAdmin;
        const requireVerified = toState.data.requireVerified;

        if (requireLogin && !Session.getToken()) {
          event.preventDefault();
          $state.go('login');
        }

        if (requireAdmin && !Session.getUser().admin) {
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if (requireVerified && !Session.getUser().verified) {
          event.preventDefault();
          $state.go('app.dashboard');
        }
      });
    }
  ]);
