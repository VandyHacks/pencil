// gets list of phone nums of people that we can notify via SMS:
/*
Easier way: Go to mlab, go to Users collection, click on Tools tab --> go to 'commands', run straight from there!!

```
{
    "distinct": "users",
    "key": "confirmation.phoneNumber",
    "query": {
        "status.confirmed": true,
        "confirmation.smsPermission": true
    }
}
```
*/
