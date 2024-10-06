const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const { uploadFile } = require("@uploadcare/upload-client");
const {
  deleteFile,
  UploadcareSimpleAuthSchema,
} = require("@uploadcare/rest-client");

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: process.env.PUBLICKEY,
  secretKey: "a3148c26b4f95c3c577b",
});


const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "EIY10XXI3SVFYW5QEF4D",
    secretAccessKey: "4VprTapVdABKFsPf8re8dUEdRiA0jyKGrEERE6JT",
  },
  endpoint: "https://drlab.us-east-1.linodeobjects.com",
  forcePathStyle: true,
});


router.get("/v1/all", async (req, res) => {
  try {
    const take = parseInt(req.query.take) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const q = req.query.q || undefined;
    const range = req.query.range || "3";
    let dateFilter = {};

    const now = new Date();
    switch (range) {
      case "1":
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: now,
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
        ...dateFilter,
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
  const { patientId } = req.body;
  const file = req.file?.file?.data;

  if (!file) {
    res.status(500).send('no file detected');
  }

  try {
    const uniqueFileName = req.files.file.name;

    const uploadParams = {
      Bucket: "drnote",
      Key: uniqueFileName,
      Body: file,
      ACL: "public-read",
    };

    const result = await s3Client.send(new PutObjectCommand(uploadParams));

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
