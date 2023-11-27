import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import {
  deleteFile,
  deleteFolder,
  folderGuard,
  generateRandomString,
} from "./file.helpers";
import { uploadFileToFirebase } from "../services/firebase.services";

const assetsDirectory = path.resolve(__dirname, "../assets/");
const tempDirectory = path.resolve(__dirname, "../tmp/");

export const generateCalendar = async (output_folder: string) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Set the size of the page to match the size of your PDF
  await page.setViewport({
    width: 2339,
    height: 1654,
  });
  // Loop to generate 12 pages
  for (let i = 0; i < 12; i++) {
    const imgData = fs
      .readFileSync(path.resolve(assetsDirectory, i + ".png"))
      .toString("base64");
    const bgData = fs
      .readFileSync(
        path.resolve(
          tempDirectory,
          output_folder + "/images",
          "img__" + i + ".png"
        )
      )
      .toString("base64");
    await page.setContent(`
      <body
        style="
          margin: 0;
          padding: 0;
          background-image: url(data:image/png;base64,${bgData});
          background-repeat: no-repeat;
          background-size: cover;
          position: relative;
        "
      >
        <div
          style="
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            background-color: white;
            opacity: 0.5;
          "
        ></div>
        <img
          src="data:image/png;base64,${imgData}"
          style="width: 100%; height: 100%"
        />
      </body>
    `);

    // Generate the PDF for each page
    await page.pdf({
      path: path.resolve(
        tempDirectory,
        output_folder + "/pdf",
        `output_page_${i}.pdf`
      ),
      width: 2339,
      height: 1654,
      printBackground: true,
    });
  }
  await browser.close();
  const pdfPaths = Array.from({ length: 12 }, (_, i) =>
    path.resolve(tempDirectory, output_folder + "/pdf", `output_page_${i}.pdf`)
  );

  const result = await mergePDFs(pdfPaths);
  deleteFolder(output_folder);
  const result_url = await uploadFileToFirebase("/results/" + result);
  deleteFile("results/" + result);
  console.log(result_url);
  return result_url;
};

async function mergePDFs(pdfPaths: any) {
  const mergedPdf = await PDFDocument.create();
  for (const pdfPath of pdfPaths) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices()
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const filename = generateRandomString(10);
  const mergedPdfBytes = await mergedPdf.save();
  folderGuard("results");
  fs.writeFileSync(
    path.resolve(tempDirectory, "results", filename + ".pdf"),
    mergedPdfBytes
  );
  return filename + ".pdf";
}
