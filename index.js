const express = require("express");
const app = express();
const port = 3001;
const fileUpload = require("express-fileupload");
const cors = require("cors");
const userRouter = require("./routers/usersRouter");
const patientsRouter = require("./routers/patientsRouter");
const filesRouter = require("./routers/filesRouter");
const drugsRouter = require("./routers/drugsRouter");
const visitRouter = require("./routers/visitRouter");
const bookingRouter = require("./routers/bookingRouter");
const invoiceRouter = require("./routers/invoiceRouter");
const expensesRouter = require("./routers/expensesRouter");
const checkAuth = require("./middleware");

app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.get("/", (req, res) => {
  res.send("Server is live");
});

app.use("/api/user", userRouter);
app.use("/api/patient", checkAuth, patientsRouter);
app.use("/api/visit", checkAuth, visitRouter);
app.use("/api/file", checkAuth, filesRouter);
app.use("/api/drug", checkAuth, drugsRouter);
app.use("/api/booking", checkAuth, bookingRouter);
app.use("/api/invoice", checkAuth, invoiceRouter);
app.use("/api/expenses", checkAuth, expensesRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
