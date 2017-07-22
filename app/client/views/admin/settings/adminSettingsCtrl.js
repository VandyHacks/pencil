angular.module('reg')
  .controller('AdminSettingsCtrl', [
    '$scope',
    '$sce',
    'SettingsService',
    function($scope, $sce, SettingsService) {
      $scope.settings = {};
      SettingsService
        .getPublicSettings()
        .success((settings) => {
          updateSettings(settings);
        });

      function updateSettings(settings) {
        $scope.loading = false;
         // Format the dates in settings.
        settings.timeOpen = new Date(settings.timeOpen);
        settings.timeClose = new Date(settings.timeClose);
        settings.timeConfirm = new Date(settings.timeConfirm);

        $scope.settings = settings;
      }

      // Whitelist --------------------------------------

      SettingsService
        .getWhitelistedEmails()
        .success((emails) => {
          $scope.whitelist = emails.join(', ');
        });

      $scope.updateWhitelist = function() {
        SettingsService
          .updateWhitelistedEmails($scope.whitelist.replace(/ /g, '').split(','))
          .success((settings) => {
            swal('Whitelist updated.');
            $scope.whitelist = settings.whitelistedEmails.join(', ');
          });
      };

      // Registration Times -----------------------------

      $scope.formatDate = function(date) {
        if (!date) {
          return 'Invalid Date';
        }

        // Hack for timezone
        return moment(date).format('dddd, MMMM Do YYYY, h:mm a') +
          ' ' + date.toTimeString().split(' ')[2];
      };

      // Take a date and remove the seconds.
      function cleanDate(date) {
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes()
        );
      }

      $scope.updateRegistrationTimes = function() {
        // Clean the dates and turn them to ms.
        const open = cleanDate($scope.settings.timeOpen).getTime();
        const close = cleanDate($scope.settings.timeClose).getTime();

        if (open < 0 || close < 0 || open === undefined || close === undefined) {
          return swal('Oops...', 'You need to enter valid times.', 'error');
        }
        if (open >= close) {
          swal('Oops...', 'Registration cannot open after it closes.', 'error');
          return;
        }

        SettingsService
          .updateRegistrationTimes(open, close)
          .success((settings) => {
            updateSettings(settings);
            swal('Looks good!', 'Registration Times Updated', 'success');
          });
      };

      // Confirmation Time -----------------------------

      $scope.updateConfirmationTime = function() {
        const confirmBy = cleanDate($scope.settings.timeConfirm).getTime();

        SettingsService
          .updateConfirmationTime(confirmBy)
          .success((settings) => {
            updateSettings(settings);
            swal('Sounds good!', 'Confirmation Date Updated', 'success');
          });
      };

      // Acceptance / Confirmation Text ----------------

      const converter = new showdown.Converter();

      $scope.markdownPreview = function(text) {
        return $sce.trustAsHtml(converter.makeHtml(text));
      };

      $scope.updateWaitlistText = function() {
        const text = $scope.settings.waitlistText;
        SettingsService
          .updateWaitlistText(text)
          .success((data) => {
            swal('Looks good!', 'Waitlist Text Updated', 'success');
            updateSettings(data);
          });
      };

      $scope.updateAcceptanceText = function() {
        const text = $scope.settings.acceptanceText;
        SettingsService
          .updateAcceptanceText(text)
          .success((data) => {
            swal('Looks good!', 'Acceptance Text Updated', 'success');
            updateSettings(data);
          });
      };

      $scope.updateConfirmationText = function() {
        const text = $scope.settings.confirmationText;
        SettingsService
          .updateConfirmationText(text)
          .success((data) => {
            swal('Looks good!', 'Confirmation Text Updated', 'success');
            updateSettings(data);
          });
      };
    }]);
