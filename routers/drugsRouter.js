const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

let colors = [
  "#F44336",
  "#536DFE",
  "#00BCD4",
  "#FFC107",
  "#4CAF50",
  "#FF4081",
  "#673AB7",
  "#CDDC39",
];

router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const q = req.query.q || undefined;
    const drugs = await prisma.drug.findMany({
      where: {
        userId: req?.headers?.user?.id || undefined,
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      skip,
      take,
    });
    res.status(200).send(drugs);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/create", async (req, res) => {
  try {
    const { name } = req.body;
    const drug = await prisma.drug.create({
      data: {
        userId: req?.headers?.user?.id || undefined,
        name,
        color:
          colors[Math.floor(Math.random() * (colors.length - 1 - 0 + 1) + 0)],
      },
    });
    res.status(200).send(drug);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/v1/upsert", async (req, res) => {
  try {
    let { name } = req.body;
    const drug = await prisma.drug.findUnique({
      where: { name },
    });
    if (drug) res.status(200).send(drug);
    else {
      let drug = await prisma.drug.create({
        data: {
          name,
          userId: req?.headers?.user?.id,
          color:
            colors[Math.floor(Math.random() * (colors.length - 1 - 0 + 1) + 0)],
        },
      });
      res.status(200).send(drug);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/v1/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await prisma.drug.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.status(200).send(drug);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
