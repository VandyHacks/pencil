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

const { convertMongoDumpToArray, writeUsersToFile } = require('./queryUtils');

let users = convertMongoDumpToArray('dump.json');
users = users.filter(u => u.status.admitted);
writeUsersToFile(users.map(u => u.email), 'admittedemails.csv');
