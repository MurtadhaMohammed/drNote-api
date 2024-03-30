const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadFile } = require("@uploadcare/upload-client");
const {
  deleteFile,
  UploadcareSimpleAuthSchema,
} = require("@uploadcare/rest-client");

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: process.env.PUBLICKEY,
  secretKey: "a3148c26b4f95c3c577b",
});

router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const q = req.query.q || undefined;
    const files = await prisma.file.findMany({
      where: {
        patient: {
          userId: req?.headers?.user?.id || undefined,
          active: true,
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
      skip,
      take,
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    });
    res.status(200).send(files);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/v1/create", async function (req, res) {
  //save on server (uplaodcare.com)
  try {
    const { patientId } = req.body;
    const result = await uploadFile(req.files.file.data, {
      publicKey: process.env.PUBLICKEY,
      store: "auto",
      metadata: {
        subsystem: "uploader",
        pet: "cat",
      },
    });
    const file = await prisma.file.create({
      data: {
        userId: parseInt(req?.headers?.user?.id),
        patientId: parseInt(patientId),
        name: result.uuid,
      },
    });
    res.status(200).send(file);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/v1/delete/:id", async function (req, res) {
  //save on server (uplaodcare.com)
  try {
    const { id } = req.params;
    const file = await prisma.file.delete({
      where: {
        id: parseInt(id),
      },
    });

    const result = await deleteFile(
      {
        uuid: file?.name,
      },
      { authSchema: uploadcareSimpleAuthSchema }
    );

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
