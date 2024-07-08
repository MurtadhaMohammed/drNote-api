const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const q = req.query.q || undefined;
    const range = req.query.range || "1";

    let dateFilter = {};
    const now = new Date();
    switch (range) {
      case "1":
        dateFilter = {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: now,
          },
        };
        break;
      case "2":
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = {
          date: {
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

    const expenses = await prisma.expense.findMany({
      skip,
      take,
      orderBy: {
        id: "desc",
      },
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
        ...dateFilter,
      },
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch expenses.");
  }
});

router.get("/v1/find/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!expense) {
      res.status(404).send("Expense not found.");
      return;
    }
    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).send("Failed to fetch expense.");
  }
});

router.post("/v1/create", async (req, res) => {
  try {
    const { name, amount, note, date } = req.body;
    const newExpense = await prisma.expense.create({
      data: {
        name,
        amount: parseFloat(amount),
        note,
        date,
      },
    });
    res.status(200).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).send("Failed to create expense.");
  }
});

router.put("/v1/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, note, date } = req.body;
    const updatedExpense = await prisma.expense.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        amount: parseFloat(amount),
        note,
        date,
      },
    });
    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).send("Failed to update expense.");
  }
});

router.delete("/v1/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await prisma.expense.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.status(200).json(deletedExpense);
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).send("Failed to delete expense.");
  }
});

module.exports = router;
