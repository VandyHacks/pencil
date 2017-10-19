angular.module('app')
.factory('EventsService', [
  '$http',
  function ($http) {
    const base = '/api/events/';

    return {
      getEvents: function () {
        return $http.get(base);
      },
      addEvent: function (name, open) {
        return $http.post(base, {
          name,
          open
        });
      },
      getAttendees: function (eventId) {
        return $http.get(base + eventId);
      }
    };
  }
]);
