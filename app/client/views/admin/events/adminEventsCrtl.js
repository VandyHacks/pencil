angular.module('app')
.controller('AdminEventsCtrl', [
  '$scope',
  '$sce',
  'EventsService',
  function ($scope, $sce, EventsService) {
    $scope.settings = {};

    EventsService
      .getEvents()
      .success((events) => {
        $scope.events = events;
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
        .success((settings) => {
          // TODO:: add event to local
          swal('Looks good!', 'Added Event', 'success');
        });
    };
  }]);
