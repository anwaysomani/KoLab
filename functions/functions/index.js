const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const auth = admin.auth();

const getAllUsers = (req, res) => {
  // const maxResults = 1; // optional arg.

  // console.log(req);
  auth.listUsers().then((userRecords) => {
    //   auth.createUser({
    //     uid: '9193',
    //     email: 'aksar11@mail.com',
    //     displayName: 'Aksar 011',
    //     password: 'anway123',
    //     designation: 'Sub-Contractor'
    //   });

    const arr = [];
    userRecords.users.forEach((user) => {
      // console.log(user.uid);
    });
    res.send(arr);
    // res.send('Hellow');
  }).catch((error) => console.log(error));
};

/* get count of all users */
const getAllUserCount = function() {
  let le = 0;
  auth.listUsers().then((userRecords) => {
    le = userRecords.length;
    return le;
  });
  return le;
};

const addUser = function(req, res) {
  // params: email, displayName, designation
  // generator: pass will be generated from first displayName and 123 later
  // resetPassword in user database will be set to true. User when logged in
  // from app should reset password if this flag is true

  // designation will be stored to firestore database
  auth.createUser({
    uid: "JCP" + (getAllUserCount() + 1),
    email: req.body.email,
    displayName: req.body.name,
    password: req.body.name.split(" ")[0] + "123",
    designation: req.body.designation,
  });

  res.send("User added successfully");
  res.sendStatus(200);
};

// for first time user login, passwordReset will call firebase function
//
// const resetPassword = function (req, res) {
//   // params: userId, newPass
// };

module.exports = {
  // app.route('/ur').post(getAllUsers);
  run: functions.https.onRequest(getAllUsers),
  api: functions.https.onRequest(getAllUsers),
  addUser: functions.https.onRequest(addUser),
};
