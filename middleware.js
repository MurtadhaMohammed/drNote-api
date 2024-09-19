var jwt = require("jsonwebtoken");

async function checkAuth(req, res, next) {
  // let token = req.headers.authorization;
  // jwt.verify(token, "shhhhh", function (err, decoded) {
  //   if (decoded) {
  //     req.headers.user = decoded;
  //     next();
  //   } else res.status(401).send({ success: false, msg: "Unauthorized!" });
  // });
  next();
}

module.exports = checkAuth;
