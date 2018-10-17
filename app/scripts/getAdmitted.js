// gets emails of all admitted people between two dates
// TODO: use actual mongo DB...

/*
Easier way: Go to mlab, go to Users collection, click on Tools tab --> go to 'commands', run straight from there!!

```
{
    "distinct": "users",
    "key": "email",
    "query": {
        "status.admitted": true
    }
}
```
*/
const User = require('../server/models/User');
const fs = require('fs');

const FILE_NAME = './admitted-emails.json';

function writeFile(err, result) {
  if (err) {
    console.error(err);
    return;
  };
  console.log(`Writing ${result.users.length} users to ${FILE_NAME}.`);
  fs.writeFile(FILE_NAME, JSON.stringify(result.users), (err) => {
    if (err) {
      console.error(err);
      return;
    };
    console.log(`Success.`);
  });
}

/**
 * Returns all admitted users after a certain date
 * @param {String} startdate
 * @param {Function} callback
 */
function getAdmitted(startdate, callback) {
  console.log('Executing...');
  const findQuery = {
    'status.admitted': true,
    'status.admittedOn': {
      $gt: startdate
    }
  };
  console.log(findQuery);
  User.find(findQuery, (err, data) => {
    if (err) {
      console.error(err);
      return callback(err, null);
    }
    console.log(data);
    const result = {
      users: data.map(u => u.email)
    };
    return callback(err, result);
  });
}

// execute
getAdmitted('1', writeFile);
