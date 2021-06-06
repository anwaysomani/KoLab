const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

const auth = admin.auth();

module.exports.getAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const arr = [];
    admin.firestore().collection('users').where("designation", "==", req.body.designation)
      .get().then((data) => {
      for (var i in data.docs) {
        arr.push(data.docs[i].data());
      }
      res.send(arr);
    });
  });
});

/* add new user */
module.exports.addUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    auth.listUsers().then((userRecords) => {
      const uid = "JCP" + (userRecords["users"].length + 1);
      auth.createUser({
        uid: uid,
        email: req.body.email,
        displayName: req.body.name,
        password: req.body.name.split(" ")[0].toLowerCase() + "123",
      }).then(() => {
        admin.firestore().doc(`/users/${uid}`).set({
          designation: req.body.designation,
          activeSite: "",
          sites: [],
          uid: uid,
          email: req.body.email,
          name: req.body.name,
          isNewLogin: true,
          disable: true,
          attendance: [],
          currentStatus: 'Sign Out',
        }).then(() => {
          res.sendStatus(200);
        }, () => {
          res.sendStatus(409);
        });
      }, (error) => {
        res.statusMessage('Duplicate record entry attempted');
        res.sendStatus(412);
        res.send();
      });
    });
  });
});
