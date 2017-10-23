angular.module('app')
  .factory('Utils', [
    function () {
      return {
        isRegOpen: function (settings) {
          return Date.now() > settings.timeOpen && Date.now() < settings.timeClose;
        },
        isAfter: function (time) {
          return Date.now() > time;
        },
        formatTime: function (time, seconds) {
          if (!time) {
            return 'Invalid Date';
          }
          let fmtStr = 'dddd, MMMM Do YYYY, h:mm a';
          if (seconds) {
            fmtStr = 'dddd, MMMM Do YYYY, h:mm:ss a';
          }

          const date = new Date(time);
          // Hack for timezone
          return moment(date).format(fmtStr) +
            ' (' + date.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2] + ')';
        }
      };
    }
  ]);
