import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import path from "path";
// import { MainRoutes } from "./routes/main.routes";
import cors from "cors";
import fs from "fs";
import { generateCalendar } from "./helpers/pdf.helpers";
import {
  deleteFile,
  fetchFile,
  fetchImage,
  fetchImages,
  folderGuard,
  generateRandomString,
  tmpFolderGuard,
} from "./helpers/file.helpers";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// !

app.get("/", async (req: Request, res: Response) => {
  return res.status(200).json({ message: "hello world" });
});
app.post("/api/generate-calendar", async (req: Request, res: Response) => {
  const [images, order] = [req.body.images, req.body.order];
  const folderName = generateRandomString(10);
  tmpFolderGuard();
  folderGuard(folderName + "/images");
  folderGuard(folderName + "/pdf");
  await fetchImages(images, order, folderName);
  //
  const url = await generateCalendar(folderName);
  return res.json({
    url,
  });
});
app.get("/download", async (req: Request, res: Response) => {
  try {
    const url: string = req.query.url as string;
    const filePath = (await fetchFile("img_", url)) as string;
    // Ensure the file is fully written before sending it
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File doesn't exist`);
        return res.status(500).send("Error downloading file");
      }
      res.download(filePath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error downloading file");
        } else {
          console.log("done");
          deleteFile(filePath);
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error fetching image");
  }
});

app.use("/api/images", express.static(path.join(__dirname, "assets")));
app.use("/api/tmp/images", express.static(path.join(__dirname, "tmp")));

export { app };
