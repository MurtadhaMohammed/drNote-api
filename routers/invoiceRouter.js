const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const userId = req.headers.user.id;
    const invoices = await prisma.invoice.findMany({
      skip,
      take,
      orderBy: {
        id: "desc",
      },
      where: {
        patient: {
          userId: parseInt(userId),
        },
      },
      include: {
        patient: true,
      },
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch invoices.");
  }
});

router.get("/v1/find/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        patient: true,
      },
    });
    if (!invoice) {
      res.status(404).send("Invoice not found.");
      return;
    }
    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).send("Failed to fetch invoice.");
  }
});

router.post("/v1/create", async (req, res) => {
  try {
    const { amount, service, note, patientId } = req.body;
    const newInvoice = await prisma.invoice.create({
      data: {
        amount: parseFloat(amount),
        service,
        note,
        patientId: parseInt(patientId),
      },
      include: {
        patient: true,
      },
    });
    res.status(200).json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).send("Failed to create invoice.");
  }
});

router.put("/v1/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, service, note, patientId } = req.body;
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: parseInt(id),
      },
      data: {
        amount: parseFloat(amount),
        service,
        note,
        patientId: parseInt(patientId),
      },
      include: {
        patient: true,
      },
    });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).send("Failed to update invoice.");
  }
});

router.delete("/v1/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await prisma.invoice.delete({
      where: {
        id: parseInt(id),
      },
      include: {
        patient: true,
      },
    });
    res.status(200).json(deletedInvoice);
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).send("Failed to delete invoice.");
  }
});

module.exports = router;
