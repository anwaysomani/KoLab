const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
admin.initializeApp();

const auth = admin.auth();

// const employeeHours = 1; /* constant employee hours */

const clientName = "KoLab";

const mailConfig = {
  mail: "",
  pass: "",
  fromConf: "Anway Somani <anwaysomani@gmail.com>",
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    type: "LOGIN",
    user: mailConfig.mail,
    pass: mailConfig.pass,
  },
});

/* get user listing */
module.exports.getAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const arr = [];
    // eslint-disable-next-line max-len
    admin
      .firestore()
      .collection("users")
      .where("designation", "==", req.body.designation)
      .get()
      .then((data) => {
        // eslint-disable-next-line guard-for-in
        for (const i in data.docs) {
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
      auth
        .createUser({
          uid: uid,
          email: req.body.email,
          displayName: req.body.name,
          password: req.body.name.split(" ")[0].toLowerCase() + "123",
        })
        .then(
          () => {
            admin
              .firestore()
              .doc(`/users/${uid}`)
              .set({
                designation: req.body.designation,
                activeSite: {
                  site: "",
                  client: "",
                  address: "",
                  pincode: "",
                },
                sites: [],
                uid: uid,
                email: req.body.email,
                name: req.body.name,
                mobile: req.body.mobile,
                isNewLogin: true,
                attendance: [],
                currentStatus: "Sign Out",
                totalTimeToday: 0,
              })
              .then(
                () => {
                  auth
                    .generatePasswordResetLink(req.body.email)
                    .then((link) => {
                      transporter.sendMail(
                        {
                          from: mailConfig.fromConf,
                          to: req.body.email,
                          subject: "Reset your password for " + clientName,
                          // eslint-disable-next-line max-len
                          html:
                            "<p>You can reset password using the following link:</p><a>" +
                            link +
                            "</a>",
                        },
                        (erro, info) => {
                          if (erro) {
                            res.sendStatus(400);
                          }
                          res.sendStatus(200);
                        }
                      );
                    });
                },
                () => {
                  res.sendStatus(409);
                }
              );
          },
          (error) => {
            res.sendStatus(412);
          }
        );
    });
  });
});

/* revert status of all employees to sign out and change descrepancy and approve flag*/
module.exports.attendanceRegularize = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    admin
      .firestore()
      .collection("users")
      .get()
      .then((data) => {
        const currDateTime = new Date();
        const datadocs = data.docs;
        const time = currDateTime.getHours() + ":" + currDateTime.getMinutes();
        for (const i in datadocs) {
          if (datadocs[i].data().currentStatus === "Sign In") {
            const missPunchdate =
              data.docs[i].data().attendance[
                data.docs[i].data().attendance.length - 1
              ].date;
            if (missPunchdate == currDateTime.getDate()) {
              const discrepant = true;
              const isApproved = false;
              const x = {
                date: currDateTime.getDate(),
                time,
                site: datadocs[i].data().activeSite,
                status: "Sign Out",
                reason: "",
                discrepant: discrepant,
                isApproved: isApproved,
              };
              var attendance = datadocs[i].data().attendance;
              attendance[attendance.length - 1].status = "Sign Out";
              attendance.push(x);
              datadocs[i].ref
                .update({
                  attendance: attendance,
                  currentStatus: "Sign Out",
                })
                .then(() => {
                  res.send(200, {
                    message: "Document successfully updated",
                  });
                })
                .catch((error) => {
                  res.send(500, {
                    message: "Error updating document:",
                    error,
                  });
                });
            }
          }
          if (datadocs[i].data().currentStatus === "On Leave") {
            data.docs[i].ref.update({
              currentStatus: "Sign Out",
            });
          }
          //if (datadocs[i].data().currentStatus === "Sign Out") {}
        }
        res.sendStatus(200);
      });
  });
});

/* revert status of all employees to sign out */
module.exports.signOutAllEmployees = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    admin
      .firestore()
      .collection("users")
      .get()
      .then((data) => {
        const currTime = new Date();
        const time = currTime.getHours() + ":" + currTime.getMinutes();
        for (const i in data.docs) {
          if (data.docs[i].data().currentStatus === "Sign In") {
            // eslint-disable-next-line max-len
            const lastSignInRecordTime = data.docs[i]
              .data()
              .attendance[data.docs[i].data().attendance.length - 1].time.split(
                ":"
              )[0];
            const currentTime = new Date().getHours();
            // eslint-disable-next-line max-len
            const calcTime =
              data.docs[i].data().totalTimeToday +
              (currentTime - lastSignInRecordTime);
            const x = {
              date: currTime.getDate(),
              time,
              site: data.docs[i].data().activeSite,
              status: "Sign Out",
              reason: "",
            };

            data.docs[i].data().attendance.push(x);
            data.docs[i].ref.update({
              totalTimeToday: calcTime,
              attendance: data.docs[i].data().attendance,
            });
          }
        }
      });
  });
});

module.exports.supervisorReports = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let employee = {};
    let sites = [];
    var allEmployees = [];
    admin
      .firestore()
      .collection("users")
      .get()
      .then((data) => {
        /* var allEmployees = []; */
        // eslint-disable-next-line guard-for-in
        for (const i in data.docs) {
          var emp = data.docs[i].data();
          employee = emp.attendance.filter((item) => {
            return (
              item.date == req.body.date &&
              item.site.site == req.body.site &&
              item.site.client == req.body.client
            );
          });
          let clientsCollection = admin.firestore().collection("clients");
          clientsCollection.get().then((client) => {
            for (const j in client.docs) {
              sites = client.docs[j].data().sites.filter((site) => {
                return site;
              });
            }
          });
          var contractors = sites.filter((data) => {
            return data.contractors;
          });
          var visitors = sites.filter((data) => {
            return data.visitors;
          });
          if (employee.length > 0) {
            allEmployees.push({
              name: emp.name,
              attendance: employee,
              designation: emp.designation
            });
          }
        }

        let reportsCollection = admin.firestore().collection("reports");
        reportsCollection.add({
          siteName: req.body.site,
          date: req.body.date,
          clientName: req.body.client,
          reportType: "A",
          data: {
            employee: allEmployees.filter((data) => {
              return data.designation == "Employee";
            }),
            supervisor: allEmployees.filter((data) => {
              return data.designation == "Supervisor";
            }),
            contractor: contractors,
            visitor: visitors,
            workProgress: [],
            material: [],
          },
        });
        /* res.send(allEmployees); */
        res.sendStatus(405);
      })
      .catch((error) => {
        res.sendStatus(412);
        console.log("Error getting documents: ", error);
      });
  });
});
