import axios from "axios";
import fs from "fs";
import path from "path";

const assetsDirectory = path.resolve(__dirname, "../assets/");
const tempDirectory = path.resolve(__dirname, "../tmp/");

export const generateRandomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
export const getFileName = (url: string) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  return fileName;
};
//
export const folderGuard = (directory: string) => {
  if (!fs.existsSync(path.resolve(tempDirectory, directory))) {
    fs.mkdirSync(path.resolve(tempDirectory, directory), { recursive: true });
  }
};
export const tmpFolderGuard = () => {
  if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, { recursive: true });
  }
};
export const fetchImages = async (
  images: string[],
  order: number[],
  folderName: string
) => {
  const promises = order.map(async (item, index) => {
    await fetchImage(folderName + "/images/img_", index, images[item - 1]);
  });
  await Promise.all(promises);
  // Code here will be executed after all images are fetched
  console.log("All images fetched successfully");
};
export const fetchImage = async (
  prefix: string,
  index: number,
  url: string
) => {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    if (!fs.existsSync(tempDirectory)) {
      fs.mkdirSync(tempDirectory, { recursive: true });
    }

    const fileName = prefix + "_" + index + ".png";
    const filePath = path.resolve(tempDirectory, fileName);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // console.log(`Image ${fileName} fetched successfully`);
    return fileName;
  } catch (error: any) {
    console.error(`Error fetching image: ${error.message}`);
    throw error;
  }
};
export const fetchFile = async (prefix: string, url: string) => {
  tmpFolderGuard();
  const response = await axios.get(url, { responseType: "stream" });
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`
    );
  }
  const fileName = prefix + "_" + generateRandomString(10) + ".pdf";
  const filePath = path.resolve(tempDirectory, fileName);
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
};

export const deleteFolder = (dir: string) => {
  fs.rm(
    path.resolve(tempDirectory, dir),
    { recursive: true, force: true },
    (err) => {
      if (err) {
        throw err;
      }
      console.log(`${dir} is deleted!`);
    }
  );
};
export const deleteFile = async (filename: string) => {
  console.log("deleting : " + path.resolve(tempDirectory, filename));
  fs.unlinkSync(path.resolve(tempDirectory, filename));
};
