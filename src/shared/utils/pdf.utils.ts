import puppeteer from "puppeteer";
import fs from "fs";

/**
 * Render HTML thành file PDF
 * @param html HTML string
 * @param outPath Đường dẫn file PDF muốn lưu
 */
export async function htmlToPdfFile(html: string, outPath: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  // Đảm bảo thư mục tồn tại
  fs.mkdirSync(require("path").dirname(outPath), { recursive: true });

  fs.writeFileSync(outPath, pdfBuffer);

  return outPath; // trả về đường dẫn file
}
