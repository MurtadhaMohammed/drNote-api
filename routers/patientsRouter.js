const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const q = req.query.q || undefined;
    const range = req.query.range;
    let dateFilter = {};
    const now = new Date();

    switch (range) {
      case "1":
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
          },
        };
        break;
      case "2":
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = {
          createdAt: {
            gte: lastWeek,
            lte: now,
          },
        };
        break;
      case "3":
      default:
        dateFilter = {};
        break;
    }

    const patients = await prisma.patient.findMany({
      where: {
        userId: req?.headers?.user?.id || undefined,
        active: true,
        name: {
          contains: q,
          mode: "insensitive",
        },
        ...dateFilter, // Incorporate the date filter here
      },
      skip,
      take,
      orderBy: {
        id: "desc",
      },
    });
    res.status(200).send(patients);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/v1/find/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        files: true,
      },
    });
    res.status(200).send(patient);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/create", async (req, res) => {
  try {
    const patient = await prisma.patient.create({
      data: { ...req.body, userId: req?.headers?.user?.id },
    });
    res.status(200).send(patient);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/v1/edit/:id", async (req, res) => {
  try {
    let { id } = req.params;
    const patient = await prisma.patient.update({
      where: {
        id: parseInt(id),
      },
      data: { ...req.body, userId: req?.headers?.user?.id },
    });
    res.status(200).send(patient);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/v1/delete/:id", async (req, res) => {
  try {
    let { id } = req.params;
    const patient = await prisma.patient.update({
      where: {
        id: parseInt(id),
      },
      data: { active: false },
    });
    res.status(200).send(patient);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
