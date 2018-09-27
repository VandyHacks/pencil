angular.module('app')
  .factory('UserService', [
    '$http',
    'Session',
    function ($http, Session) {
      const users = '/api/users';
      const base = users + '/';

      return {

        // ----------------------
        // Basic Actions
        // ----------------------
        getCurrentUser: function () {
          return $http.get(base + Session.getUserId());
        },

        get: function (id) {
          return $http.get(base + id);
        },

        getAll: function () {
          return $http.get(base);
        },

        getPage: function (page, size, text, showUnsubmitted) {
          return $http.get(users + '?' + $.param(
            {
              text,
              showUnsubmitted,
              page: page || 0,
              size: size || 50
            })
          );
        },

        updateProfile: function (id, profile) {
          return $http.put(base + id + '/profile', {
            profile: profile
          });
        },

        updateConfirmation: function (id, confirmation) {
          return $http.put(base + id + '/confirm', {
            confirmation: confirmation
          });
        },

        declineAdmission: function (id) {
          return $http.post(base + id + '/decline');
        },

        // ------------------------
        // Team
        // ------------------------
        createTeam: function (code) {
          return $http.post(base + Session.getUserId() + '/team', {
            code: code
          });
        },

        joinTeam: function (code) {
          return $http.put(base + Session.getUserId() + '/team', {
            code: code
          });
        },

        leaveTeam: function () {
          return $http.delete(base + Session.getUserId() + '/team');
        },

        getMyTeammates: function () {
          return $http.get(base + Session.getUserId() + '/team');
        },

        // -------------------------
        // Admin Only
        // -------------------------

        getStats: function () {
          return $http.get(base + 'stats');
        },

        admitUser: function (id) {
          return $http.post(base + id + '/admit');
        },

        admitAll: function (querytext) {
          return $http.post(base + 'admitall', JSON.stringify({ querytext: querytext }));
        },

        checkIn: function (id) {
          return $http.post(base + id + '/checkin');
        },

        sendQrCode: function (id) {
          return $http.post(base + id + '/sendqrcode');
        },

        checkOut: function (id) {
          return $http.post(base + id + '/checkout');
        }

      };
    }
  ]);
