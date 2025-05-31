import fs from 'fs/promises';
import path from 'path';

export async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    error.filePath = filePath; // Tambahkan info path ke error
    throw error;
  }
}

export async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}