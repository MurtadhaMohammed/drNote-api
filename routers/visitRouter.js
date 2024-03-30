const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/v1/all/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const visits = await prisma.visit.findMany({
      where: {
        patientId: parseInt(patientId),
      },
      skip,
      take,
      orderBy: {
        id: "desc",
      },
    });
    res.status(200).send(visits);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/v1/find/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await prisma.visit.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    res.status(200).send(visit);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/create", async (req, res) => {
  try {
    const { note, drugs, patientId, id = 0 } = req.body;
    let userId = req?.headers?.user?.id;
    const visit = await prisma.visit.upsert({
      where: { id: parseInt(id) },
      update: {
        note,
        drugs,
        userId,
        patientId: parseInt(patientId),
      },
      create: { note, drugs, userId, patientId: parseInt(patientId) },
    });
    res.status(200).send(visit);
  } catch (error) {
    res.status(500).send(error);
  }
});

// router.put("/v1/edit/:id", async (req, res) => {
//   try {
//     let { id } = req.params;
//     const patient = await prisma.patient.update({
//       where: {
//         id: parseInt(id),
//       },
//       data: { ...req.body, userId: req?.headers?.user?.id },
//     });
//     res.status(200).send(patient);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// router.delete("/v1/delete/:id", async (req, res) => {
//   try {
//     let { id } = req.params;
//     const patient = await prisma.patient.update({
//       where: {
//         id: parseInt(id),
//       },
//       data: { active: false },
//     });
//     res.status(200).send(patient);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

module.exports = router;
