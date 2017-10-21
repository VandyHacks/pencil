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
        console.log(events);
        $scope.events = events;
        $scope.loading = false;
      });

    $scope.addEvent = function () {
      // Clean the dates and turn them to ms.
      const name = $scope.events.create.name;
      const open = $scope.events.create.open;

      if (!name) {
        return swal('Oops...', 'You need a name for this event, pal', 'error');
      }

      EventsService
        .addEvent(name, open)
        .success((event) => {
          $scope.events.push(event);
          swal('Looks good!', 'Added Event', 'success');
        });
    };

    $scope.selectEvent = function (event) {
      console.log(event);
      $scope.selectedEvent = event;

      EventsService
        .getAttendees(event._id)
        .success((event) => {
          console.log(event);
          $scope.users = event.attendees;
        });
    };
  }]);
