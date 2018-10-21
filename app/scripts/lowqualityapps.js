/*
Gets emails of everyone that may have low quality applications

*/

const { convertMongoDumpToArray } = require('./queryUtils');

const FILENAME = './2018-10-15_users.json';

// flags all submitted users that satisfy all following qualities
const config = {
  genericResumeName: true, // resumes that don't contain some form of owner's name
  badEssayCharLimit: 20 // all essays w/ less than this char count will be flagged, set to -1 to disable
};

// Define to JSON type
const users = convertMongoDumpToArray(FILENAME);
console.log(users.length + ' total users');

// filter
let badusers = users.filter(e => {
  if (!e.status.completedProfile) { return false; }
  if (config.badEssayCharLimit >= 0) {
    if (e.profile.essay && e.profile.essay.trim().length > config.badEssayCharLimit) { return false; }
  }
  const namewords = e.profile.name.trim().toLowerCase().split(' ');
  const resumename = e.profile.lastResumeName.toLowerCase();
  let goodname = false;
  namewords.forEach(word => {
    if (resumename.includes(word)) { goodname = true; }
  });
  if (!goodname) {
    // console.log(namewords, resumename)
    return true;
  }
  return false;
});
badusers = badusers.map(u => u.email);
console.log(badusers.length + ' filtered users.');
console.log(config);
console.log(badusers);
