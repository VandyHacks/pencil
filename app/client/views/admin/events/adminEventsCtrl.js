angular.module('app')
.controller('AdminEventsCtrl', [
  '$scope',
  '$sce',
  'EventsService',
  function ($scope, $sce, EventsService) {
    $scope.selectedEvent = null;

    EventsService
      .getEvents()
      .success((events) => {
        // console.log(events);
        $scope.events = events;
        $scope.loading = false;
      });

    EventsService
      .getTypes()
      .success((types) => {
        console.log(types);
        $scope.types = types;
      });

    $scope.addEvent = function () {
      // Clean the dates and turn them to ms.
      const name = $scope.create.name;
      const open = $scope.create.open;
      const type = $scope.create.eventType;

      if (!name) {
        return swal('Oops...', 'You need a name for this event, pal', 'error');
      }

      EventsService
        .addEvent(name, open, type)
        .success((event) => {
          $scope.events.push(event);
          swal('Looks good!', 'Added Event', 'success');
        });
    };

    $scope.selectEvent = function (event) {
      // console.log(event);
      $scope.selectedEvent = event;

      EventsService
        .getAttendees(event._id)
        .success((event) => {
          // console.log(event);
          $scope.users = event.attendees;
        });
    };
  }]);
