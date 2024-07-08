const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/v1/all", async (req, res) => {
  try {
    let userId = req.headers.user.id;
    const bookings = await prisma.book.findMany({
      where: {
        userId: userId,
      },
      include: {
        patient: true,
      },
    });
    res.status(200).send(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send(error);
  }
});
router.post("/v1/create", async (req, res) => {
  try {
    let userId = req?.headers?.user?.id;
    let { patient, date, note = "" } = req.body;
    const p = await prisma.patient.upsert({
      where: { id: parseInt(patient?.id) || 0 },
      update: patient,
      create: { ...patient, userId: parseInt(userId) },
    });

    const book = await prisma.book.create({
      data: {
        date,
        note,
        userId: parseInt(userId),
        patientId: parseInt(p.id),
      },
    });
    res.status(200).send(book);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/v1/delete/:id", async (req, res) => {
  try {
    let { id } = req.params;
    const booking = await prisma.book.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(200).send(booking);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
