const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const nodemailer = require("nodemailer");

admin.initializeApp();
const auth = admin.auth();

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
    admin.firestore().collection("users")
      .where("designation", "==", req.body.designation)
      .get()
      .then((data) => {
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
                totalAttendance: []
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
          let dx = data.docs[i].data();
          if (dx.currentStatus === "Sign In") {
            const lastSignInRecordTime = dx.attendance[dx.attendance.length - 1].time.split(":")[0];
            const currentTime = new Date().getHours();
            const calcTime = dx.totalTimeToday + (currentTime - lastSignInRecordTime);
            const x = {
              date: currTime.getDate(),
              time,
              site: dx.activeSite,
              status: "Sign Out",
              reason: "",
            };
            dx.attendance.push(x);
            data.docs[i].ref.update({
              totalTimeToday: calcTime,
              attendance: dx.attendance,
            });
          }

          dx.totalAttendance.push({
            date: currTime.getDate(),
            totalTime: dx.totalTimeToday
          });

          data.docs[i].ref.update({
            totalAttendance: dx.totalAttendance
          });
        }
      });
  });
});

module.exports.supervisorReports = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    admin
      .firestore()
      .collection("reports")
      .where("siteName", "==", req.body.site)
      .where("clientName", "==", req.body.client)
      .where("date", "==", req.body.date)
      .get()
      .then((data) => {
        if (data.size === 1) {
          res.status(302);
          res.send("Report already exists");
        }
        let employee = {},
          sites = [];
        var allEmployees = [];
        var contractors = [];
        var visitors = [];

        admin
          .firestore()
          .collection("users")
          .get()
          .then((data) => {
            for (const i in data.docs) {
              var emp = data.docs[i].data();
              employee = emp.attendance.filter((item) => {
                return (
                  item.date === req.body.date &&
                  item.site.site === req.body.site &&
                  item.site.client === req.body.client
                );
              });
              if (employee.length > 0) {
                allEmployees.push({
                  name: emp.name,
                  attendance: employee,
                  designation: emp.designation,
                });
              }
            }
            let clientsCollection = admin.firestore().collection("clients")
              .where("name", "==", req.body.client);
            clientsCollection.get().then((client) => {
              sites = client.docs[0].data().sites.filter((site) => {
                return site.name === req.body.site;
              });
              contractors = sites[0].contractors.filter((data) => {
                return data.date === req.body.date;
              });
              visitors = sites[0].visitors.filter((data) => {
                return data.date === req.body.date;
              });
              let reportsCollection = admin.firestore().collection("reports");
              reportsCollection.add({
                siteName: req.body.site,
                date: req.body.date,
                clientName: req.body.client,
                reportType: "A",
                data: {
                  employee: allEmployees.filter((data) => {
                    return data.designation === "Employee";
                  }),
                  supervisor: allEmployees.filter((data) => {
                    return data.designation === "Supervisor";
                  }),
                  contractor: contractors,
                  visitor: visitors,
                  workProgress: [],
                  material: [],
                },
              });
              res.sendStatus(405);
            });
            /* res.sendStatus(200); */
          })
          .catch((error) => {
            res.sendStatus(412);
            return res.send(error.message);
          });
      });
  });
});

/* generate report for attendance */
module.exports.generateMonthAttendanceReport = functions.https.onRequest(
	(req, res) => {
		cors(req, res, () => {
			admin
				.firestore()
				.collection("reports")
				.where("startDate", "==", req.body.startDate)
				.where("endDate", "==", req.body.endDate)
				.get()
				.then((data) => {
					if (data.size === 1) {
						res.status(302);
						res.send("Report already exists");
					}
					let employeeList = [];
					admin
						.firestore()
						.collection("users")
						.get()
						.then((data) => {
							for (const i in data.docs) {
								let dx = data.docs[i].data();
								// you will get an array of objects for attendance(total)
								// simply attach your logic to that and return as required
								let employee = {};
								if (dx.totalAttendance != undefined) {
									employee = dx.totalAttendance.filter((item) => {
										return (
											item.date >= parseInt(req.body.startDate) &&
											item.date <= parseInt(req.body.endDate)
										);
									});
								}
								if (employee.length > 0) {
									employeeList.push({
										name: dx.name,
										totalAttendance: employee,
										designation: dx.designation,
									});
								}
							}
							let monthlyAttendanceReport = admin
								.firestore()
								.collection("reports");
							monthlyAttendanceReport.add({
								startDate: req.body.startDate,
								endDate: req.body.endDate,
								reportType: "B",
								data: {
									employee: employeeList.filter((data) => {
										return data.designation === "Employee";
									}),
									supervisor: employeeList.filter((data) => {
										return data.designation === "Supervisor";
									}),
								},
							});
							res.sendStatus(405);
						})
						.catch((error) => {
							console.log("error", error);
							res.sendStatus(412);
						});
				});
		});
	}
);
