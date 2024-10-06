const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  logger: console,
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
  try {
    const { patientId } = req.body;
    const file = req.files.file;

    const result = await uploadToLinode(file.data, file?.name, 'drnote');

    console.log(result, 'res');

    const fileS = await prisma.file.create({
      data: {
        userId: parseInt(req?.headers?.user?.id),
        patientId: parseInt(patientId),
        name: result,
      },
    });
    res.status(200).send(fileS);
  } catch (error) {
    res.status(500).send(error);
  }
});

const uploadToLinode = async (fileBuffer, fileName, bucketName) => {
  if (!fileBuffer) {
    throw new Error("No file was uploaded.");
  }
  const objectName = fileName;
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: fileBuffer,
      ContentType: "image/webp",
      ACL: "public-read",
    });

    await s3Client.send(command);

    const fileUrl = objectName;
    console.log(`File uploaded successfully: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
};

router.get('/v1/image/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const command = new GetObjectCommand({
      Bucket: 'drnote',
      Key: key,
    });

    const response = await s3Client.send(command);

    console.log(response);

    res.set('Content-Type', response.ContentType);
    response.Body.pipe(res);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).send('Error retrieving image');
  }
});

router.delete("/v1/delete/:id", async function (req, res) {
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
