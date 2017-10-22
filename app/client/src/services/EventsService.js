angular.module('app')
.factory('EventsService', [
  '$http',
  function ($http) {
    const base = '/api/events/';

    return {
      getEvents: function () {
        return $http.get(base);
      },
      getTypes: function () {
        return $http.get(base + 'types');
      },
      addEvent: function (name, open, type) {
        return $http.post(base, {
          name,
          open,
          type
        });
      },
      toggleOpen: function (event) {
        return $http.put(base + event._id + '/open', {
          open: event.open
        });
      },
      getAttendees: function (eventId) {
        return $http.get(base + eventId);
      }
    };
  }
]);
