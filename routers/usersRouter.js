const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const generateOtp = require("../helper/generateOtp");
var jwt = require("jsonwebtoken");
const dateDiff = require("../helper/dateDiff");
const prisma = new PrismaClient();

router.get("/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const users = await prisma.user.findMany({
      skip,
      take,
    });
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/create", async (req, res) => {
  try {
    let { name, phone, username } = req.body;
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        username,
      },
    });
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/login", async (req, res) => {
  try {
    let { phone } = req.body;
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        shortCode: generateOtp(),
        shortCodeInit: new Date().toISOString(),
      },
      create: { phone, shortCode: generateOtp() },
    });
    if (!user.active)
      res.status(401).send({ success: false, err: "User not valid!" });
    else res.status(200).send({ success: true, shortCode: user.shortCode });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/verifyCode", async (req, res) => {
  try {
    let { phone, shortCode } = req.body;
    const user = await prisma.user.findFirst({
      where: { phone, shortCode },
    });
    console.log(dateDiff(Date.now(), user.shortCodeInit, "second"));
    if (!user)
      res.status(401).send({ success: false, err: "Login not verified!" });
    else if (dateDiff(Date.now(), user.shortCodeInit, "minute") > 5)
      res.status(401).send({ success: false, err: "Otp Expired!" });
    else {
      let token = jwt.sign(user, "shhhhh", { expiresIn: "1h" });
      res.status(200).send({ success: true, token });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
