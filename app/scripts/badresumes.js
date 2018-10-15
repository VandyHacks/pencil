/*
Gets emails of everyone that send sketchy resumes

// works by finding email names that don't contain last name or first name

{
    "distinct": "users",
    "key": "email",
    "query": {
        "status.admitted": true
    }
}

*/
