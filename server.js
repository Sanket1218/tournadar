var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();


const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });



const app = express();
app.use(cors());
app.use(bodyParser.json());

//  Fix: Middleware should come BEFORE any routes
app.use(express.urlencoded(true));
app.use(express.json()); // add this too if needed in future

app.use(fileuploader());
app.use(express.static("public"));

// Start server
app.listen(2005, function () {
  console.log("Server Started at Port no: 2005");
});
// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Route: Send Welcome Email on Signup ---
app.post("/send-welcome", (req, res) => {
  const { email, name } = req.body;

  const mailOptions = {
    from: `"Tournadar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Tournadar!",
    html: `<h3>Hello ${name || "Player"},</h3>
           <p>🎉 Welcome to Tournadar – your gateway to every game!</p>
           <p>We're excited to have you onboard.</p>`,
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email send failed:", err);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Welcome email sent:", info.response);
      res.send("Welcome email sent!");
    }
  });
});
// --- Route: Send OTP on Login ---
app.post("/send-otp", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  const mailOptions = {
    from: `"Tournadar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for Login",
    html: `<p>Your One-Time Password (OTP) is:</p><h2>${otp}</h2><p>This is valid for 5 minutes.</p>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("OTP email failed:", err);
      res.status(500).send("OTP email failed");
    } else {
      console.log("OTP email sent:", info.response);
      res.json({ message: "OTP sent!", otp });
    }
  });
});

//for forgot password
app.post("/send-otp2", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  const mailOptions = {
    from: `"Tournadar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for Changing password",
    html: `<p>Your One-Time Password (OTP) is:</p><h2>${otp}</h2><p>This is valid for 5 minutes.</p>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("OTP email failed:", err);
      res.status(500).send("OTP email failed");
    } else {
      console.log("OTP email sent:", info.response);
      res.json({ message: "OTP sent!", otp });
    }
  });
});



// GET: index page
app.get("/", function (req, resp) {
  let path = __dirname + "/public/index.html";
  resp.sendFile(path);
});

//  POST: Signup
app.post("/signup-user", function (req, resp) {
  var email = req.body.txtEmail;
  var pwd = req.body.txtPwd;
  var utype = req.body.txtUtype;

  // Step 1: Check if email already exists
  var checkSql = "SELECT * FROM users WHERE email = ?";
  mySqlVen.query(checkSql, [email], function (err, result) {
    if (err) {
      console.error("Error checking existing email:", err);
      resp.send("Error: " + err.message);
      return;
    }

    if (result.length > 0) {
      // Email already exists
      resp.send("already_registered");
      return;
    }

    // Step 2: Insert new record
    var insertSql = "INSERT INTO users (email, password, utype, status, dos) VALUES (?, ?, ?, 1, current_date())";
    mySqlVen.query(insertSql, [email, pwd, utype], function (err2) {
      if (err2 == null) {
        resp.send("registered_success");
      } else {
        resp.send("Error: " + err2.message);
      }
    });
  });
});


//login
app.post("/login-user", function (req, resp) {
  var email = req.body.txtLoginEmail;
  var pwd = req.body.txtLoginPwd;

  var sql = "SELECT * FROM users WHERE email = ? AND password = ?";

  mySqlVen.query(sql, [email, pwd], function (err, result) {
    if (err) {
      resp.send("Error: " + err.message);
    } else if (result.length == 0) {
      resp.send("Invalid");
    } else {
      if (result[0].status == 0) {
        resp.send("Blocked");
      } else {
        resp.send(result[0].utype);
      }
    }
  });
});
app.post("/submit-org-details", async function (req, resp) {
  let picurl = "";
  
  if (req.files != null) {
    let fName = req.files.profilePic.name;
    let fullPath = __dirname + "/public/uploads/" + fName;

    // Save file locally first
    await req.files.profilePic.mv(fullPath);

    // Upload to Cloudinary
    await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
      picurl = picUrlResult.url;
      console.log("Uploaded to Cloudinary:", picurl);
    });
  } else {
    picurl = "nopic.jpg";
  }

  // Extract form fields
  let emailid = req.body.txtEmail;
  let orgName = req.body.orgName;
  let regNumber = req.body.regNumber;
  let city = req.body.city;
  let contact = req.body.contact;
  let head = req.body.head;
  let address = req.body.address;
  let sports = req.body.sports;
  let website = req.body.website;
  let insta = req.body.insta;
  let otherInfo = req.body.otherInfo;

  // Insert into MySQL
  mySqlVen.query(
    "INSERT INTO organizerdetails2025 (emailid, orgName, regNumber, city, contact, head, address, sports, website, insta, otherInfo, picurl, regdate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,current_date())",
    [emailid, orgName, regNumber, city, contact, head, address, sports, website, insta, otherInfo, picurl],
    function (errKuch) {
      if (errKuch == null)
        resp.send("Organizer Record Saved Successfully...");
      else
        resp.send(errKuch);
    }
  );
});
app.post("/update-org-details", async function (req, resp) {
  let picurl = "";

  // If a new profile pic is uploaded
  if (req.files != null) {
    let fName = req.files.profilePic.name;
    let fullPath = __dirname + "/public/uploads/" + fName;
    await req.files.profilePic.mv(fullPath);

    await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
      picurl = picUrlResult.url;
      console.log("Updated pic uploaded to Cloudinary:", picurl);
    });
  } else {
    // If no new pic, retain old pic URL from hidden field
    picurl = req.body.hdn;
  }

  // Get updated form fields
  let emailid = req.body.txtEmail;
  let orgName = req.body.orgName;
  let regNumber = req.body.regNumber;
  let city = req.body.city;
  let contact = req.body.contact;
  let head = req.body.head;
  let address = req.body.address;
  let sports = req.body.sports;
  let website = req.body.website;
  let insta = req.body.insta;
  let otherInfo = req.body.otherInfo;

  // Update query
  mySqlVen.query(
    "UPDATE organizerdetails2025 SET orgName=?, regNumber=?, city=?, contact=?, head=?, address=?, sports=?, website=?, insta=?, otherInfo=?, picurl=? WHERE emailid=?",
    [
      orgName,
      regNumber,
      city,
      contact,
      head,
      address,
      sports,
      website,
      insta,
      otherInfo,
      picurl,
      emailid,
    ],
    function (errKuch, result) {
      if (errKuch == null) {
        if (result.affectedRows == 1)
          resp.send("Organizer details updated successfully ");
        else resp.send("Invalid Email ID — No record updated ");
      } else {
        resp.send("Error: " + errKuch.message);
      }
    }
  );
});
app.get("/get-org-one", function (req, resp) {
  mySqlVen.query(
    "SELECT * FROM organizerdetails2025 WHERE emailid=?",
    [req.query.txtEmail],
    function (err, allRecords) {
      if (err) {
        resp.send(err.message);
      } else {
        resp.json(allRecords); // can be empty []
      }
    }
  );
});
app.get("/chk-email", function(req, resp) {
    mySqlVen.query("select * from organizerdetails2025 where emailid=?", [req.query.txtEmail], function(err, allRecords) {
        if (allRecords.length == 0)
            resp.send("Available...");
        else
            resp.send("Already Taken...");
    });
});
app.post("/post-tournament", function (req, resp) {
  let emailid = req.body.txtEmail;
  let title = req.body.title;
  let eventDate = req.body.eventDate;
  let eventTime = req.body.eventTime;
  let city = req.body.city;
  let address = req.body.address;
  let category = req.body.category;
  let minAge = req.body.minAge;
  let maxAge = req.body.maxAge;
  let lastDate = req.body.lastDate;
  let fee = req.body.fee;
  let prizeMoney = req.body.prizeMoney;
  let contactPerson = req.body.contactPerson;

  let sql = "INSERT INTO tournaments2025 (emailid, title, eventDate, eventTime, city, address, category, minAge, maxAge, lastDate, fee, prizeMoney, contactPerson, postDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,current_date())";

  mySqlVen.query(sql, [emailid, title, eventDate, eventTime, city, address, category, minAge, maxAge, lastDate, fee, prizeMoney, contactPerson], function (err) {
    if (err == null)
      resp.send("Tournament posted successfully!");
    else
      resp.status(500).send(err.message);
  });
});
// Fetch Tournaments by Email ID
app.get("/fetch-tournaments-by-email", function (req, resp) {
    let emailid = req.query.emailidKuch;

    mySqlVen.query("SELECT * FROM tournaments2025 WHERE emailid = ?", [emailid], function (err, records) {
        if (err)
            resp.send(err);
        else
            resp.send(records);
    });
});

// Delete Tournament by ID
app.get("/delete-tournament", function (req, resp) {
    let id = req.query.idKuch;

    mySqlVen.query("DELETE FROM tournaments2025 WHERE id = ?", [id], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("Tournament Deleted Successfully.");
            else
                resp.send("Invalid Tournament ID");
        } else {
            resp.send(errKuch);
        }
    });
});
app.post("/upload-player-profile", async function (req, resp) {
  let aadharUrl = "nopic.jpg";
  let profileUrl = "nopic.jpg";

  try {
    if (req.files?.aadhar_pic) {
      let aadharFName = req.files.aadhar_pic.name;
      let fullAadharPath = __dirname + "/public/uploads/" + aadharFName;
      await req.files.aadhar_pic.mv(fullAadharPath);
      let result = await cloudinary.uploader.upload(fullAadharPath);
      aadharUrl = result.url;
    }

    if (req.files?.profile_pic) {
      let profileFName = req.files.profile_pic.name;
      let fullProfilePath = __dirname + "/public/uploads/" + profileFName;
      await req.files.profile_pic.mv(fullProfilePath);
      let result = await cloudinary.uploader.upload(fullProfilePath);
      profileUrl = result.url;
    }

    let { emailid, name, dob, gender, address, contact, games_you_play, other_info } = req.body;

    mySqlVen.query(
      "INSERT INTO player_profiles2025 VALUES (?,?,?,?,?,?,?,?,?,?)",
      [emailid, aadharUrl, profileUrl, name, dob, gender, address, contact, games_you_play, other_info],
      function (errKuch) {
        if (errKuch == null)
          resp.send("Player Profile Saved Successfully!");
        else
          resp.status(500).send(errKuch.message);
      }
    );

  } catch (err) {
    console.log(err);
    resp.status(500).send("Error: " + err.message);
  }
});


//------------------ Modify/Update Player Profile
app.post("/modify-player-profile", async function (req, resp) {
  let aadharUrl = req.body.oldAadharUrl || "nopic.jpg";
  let profileUrl = req.body.oldProfileUrl || "nopic.jpg";

  try {
    if (req.files?.aadhar_pic) {
      let aadharFName = req.files.aadhar_pic.name;
      let fullAadharPath = __dirname + "/public/uploads/" + aadharFName;
      await req.files.aadhar_pic.mv(fullAadharPath);
      let result = await cloudinary.uploader.upload(fullAadharPath);
      aadharUrl = result.url;
    }

    if (req.files?.profile_pic) {
      let profileFName = req.files.profile_pic.name;
      let fullProfilePath = __dirname + "/public/uploads/" + profileFName;
      await req.files.profile_pic.mv(fullProfilePath);
      let result = await cloudinary.uploader.upload(fullProfilePath);
      profileUrl = result.url;
    }

    let { emailid, name, dob, gender, address, contact, games_you_play, other_info } = req.body;

    mySqlVen.query(
      `UPDATE player_profiles2025 SET 
        aadhar_pic = ?, 
        profile_pic = ?, 
        name = ?, 
        dob = ?, 
        gender = ?, 
        address = ?, 
        contact = ?, 
        games_you_play = ?, 
        other_info = ? 
      WHERE emailid = ?`,
      [
        aadharUrl,
        profileUrl,
        name,
        dob,
        gender,
        address,
        contact,
        games_you_play,
        other_info,
        emailid
      ],
      function (errKuch, result) {
        if (errKuch == null) {
          if (result.affectedRows == 1)
            resp.send("Player Profile Updated Successfully!");
          else
            resp.send("Invalid Email ID");
        } else {
          resp.status(500).send(errKuch.message);
        }
      }
    );

  } catch (err) {
    console.log(err);
    resp.status(500).send("Error: " + err.message);
  }
});

//------------------ Fetch One Profile by Email
app.get("/fetch-player-profile", function (req, resp) {
  mySqlVen.query(
    "SELECT * FROM player_profiles2025 WHERE emailid=?",
    [req.query.txtEmail],
    function (err, allRecords) {
      if (err) {
        resp.send(err.message);
      } else {
        resp.json(allRecords); // can be empty []
      }
    }
  );
});
// Fetch all users
app.get("/fetch-all-users", function (req, resp) {
  mySqlVen.query("SELECT email, utype, status FROM users", function (err, records) {
    if (err)
      resp.status(500).send(err.message);
    else
      resp.json(records);
  });
});

// Block user
app.get("/block-user", function (req, resp) {
  let email = req.query.email;
  mySqlVen.query("UPDATE users SET status = 0 WHERE email = ?", [email], function (err, result) {
    if (err)
      resp.status(500).send("Error: " + err.message);
    else if (result.affectedRows === 0)
      resp.send("No user found with that email.");
    else
      resp.send("User blocked successfully.");
  });
});
//delete user in admin control panel
app.get("/delete-user", function (req, resp) {
  let email = req.query.email;

  mySqlVen.query("DELETE FROM users WHERE email = ?", [email], function (err, result) {
    if (err)
      resp.status(500).send("Error: " + err.message);
    else if (result.affectedRows === 0)
      resp.send("No user found with that email.");
    else
      resp.send("User deleted successfully.");
  });
});

// Unblock user
app.get("/unblock-user", function (req, resp) {
  let email = req.query.email;
  mySqlVen.query("UPDATE users SET status = 1 WHERE email = ?", [email], function (err, result) {
    if (err)
      resp.status(500).send("Error: " + err.message);
    else if (result.affectedRows === 0)
      resp.send("No user found with that email.");
    else
      resp.send("User unblocked successfully.");
  });
});
// Fetch distinct cities
app.get("/fetch-cities", (req, res) => {
  mySqlVen.query("SELECT DISTINCT city FROM tournaments2025", (err, result) => {
    if (err) return res.status(500).send([]);
    res.send(result.map(row => row.city));
  });
});

// Fetch tournaments matching city and sport
app.get("/find-tournaments", (req, res) => {
  const city = req.query.city;
  const sport = req.query.sport;

  const sql = "SELECT id, title AS name, city, category AS sports, eventDate AS date, '' AS banner FROM tournaments2025 WHERE city = ? AND category = ?";
  mySqlVen.query(sql, [city, sport], (err, result) => {
    if (err) return res.status(500).send([]);
    res.send(result);
  });
});

//for getting tournament details in model
app.get("/get-tournament-details", (req, res) => {
  const id = req.query.id;
  const sql = " SELECT id, emailid, title AS name, eventDate, eventTime, city, address,category AS sports, minAge, maxAge, lastDate, fee, prizeMoney, contactPerson, postDate FROM tournaments2025 WHERE id = ?";

  mySqlVen.query(sql, [id], (err, result) => {
    if (err || result.length === 0) return res.status(500).send({});
    res.json(result[0]);
  });
});

//for updating setting password
app.post("/update-password", (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  mySqlVen.query("SELECT * FROM users WHERE email=? AND password=?", [email, oldPassword], (err, rows) => {
    if (err || rows.length === 0) return res.json({ success: false });

    mySqlVen.query("UPDATE users SET password=? WHERE email=?", [newPassword, email], (err2) => {
      if (err2) return res.json({ success: false });
      res.json({ success: true });
    });
  });
});
//for forgot password
app.post("/update-password2", (req, res) => {
  const { email, newPassword } = req.body;

  const updateQuery = "UPDATE users SET password=? WHERE email=?";
  mySqlVen.query(updateQuery, [newPassword, email], (err, result) => {
    if (err) {
      console.error("Update error:", err);
      return res.json({ success: false });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "Email not found" });
    }

    res.json({ success: true });
  });
});


// Fetch organizer by email from admin
app.get("/fetch-organizer-by-email", function (req, resp) {
    let emailid = req.query.emailidKuch;

    mySqlVen.query("SELECT * FROM organizerdetails2025 WHERE emailid = ?", [emailid], function (err, records) {
        if (err)
            resp.send(err);
        else
            resp.send(records);
    });
});

// Delete organizer by email from admin
app.get("/delete-organizer", function (req, resp) {
    let emailid = req.query.emailidKuch;

    mySqlVen.query("DELETE FROM organizerdetails2025 WHERE emailid = ?", [emailid], function (err, result) {
        if (err)
            resp.send(err);
        else if (result.affectedRows === 0)
            resp.send("No record found to delete.");
        else
            resp.send("Organizer record deleted successfully.");
    });
});
// Fetch all players admin
app.get("/fetch-all-players", function (req, res) {
  const sql = "SELECT emailid, aadhar_pic, profile_pic, name, dob, gender, address, contact, games_you_play, other_info FROM player_profiles2025";

  mySqlVen.query(sql, function (err, result) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send([]);
    }
    res.send(result);
  });
});

// Delete player by email admin
app.get("/delete-player", function (req, res) {
  const emailid = req.query.emailid;
  const sql = "DELETE FROM player_profiles2025 WHERE emailid = ?";

  mySqlVen.query(sql, [emailid], function (err, result) {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).send("Failed to delete player.");
    }

    if (result.affectedRows === 0)
      return res.send("No matching player found.");
    else
      return res.send("Player deleted successfully.");
  });
});
//Aadhar ai read
app.post("/read-aadhar-ai", async function (req, resp) {
    if (req.files != null && req.files.aadharPic != null) {
        let file = req.files.aadharPic;
        let locationToSave = __dirname + "/public/uploads/" + file.name;

        try {
            await file.mv(locationToSave);

            await cloudinary.uploader.upload(locationToSave).then(async function (result) {
                const imageResp = await fetch(result.secure_url).then((res) => res.arrayBuffer());

                const prompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string.";

                const aiResult = await model.generateContent([
                    {
                        inlineData: {
                            data: Buffer.from(imageResp).toString("base64"),
                            mimeType: "image/jpeg",
                        },
                    },
                    prompt
                ]);

                const rawText = aiResult.response.text().replace(/```json|```/g, "").trim();
                const jsonData = JSON.parse(rawText);

                resp.send(jsonData);
            });
        } catch (err) {
            console.log(err);
            resp.send({ error: err.message });
        }
    } else {
        resp.send({ error: "No file uploaded" });
    }
});








// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MySQL setup
const dbConfig = process.env.MYSQL_URI;
const mySqlVen = mysql2.createConnection(dbConfig);

mySqlVen.connect(function (errKuch) {
  if (errKuch == null)
    console.log("AiVen Connected Successfully!");
  else
    console.log(errKuch.message);
});
