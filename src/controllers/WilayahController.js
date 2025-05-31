import path from "path";
import { readJSON } from "../utils/fileHelper.js";
import fs from "fs/promises";

const WILAYAH_CONFIG = {
  provinces: {
    folder: "province",
    allFile: "provinces.json",
    idLength: 2,
  },
  regencies: {
    folder: "regency",
    allFile: "regencies.json",
    parent: {
      folder: "regencies",
      type: "province",
      idLength: 2,
    },
    idLength: 4,
  },
  districts: {
    folder: "district",
    allFile: "districts.json",
    parent: {
      folder: "districts",
      type: "regency",
      idLength: 4,
    },
    idLength: 7,
  },
  villages: {
    folder: "village",
    allFile: "villages.json",
    parent: {
      folder: "villages",
      type: "district",
      idLength: 7,
    },
    idLength: 10,
  },
};

export default class WilayahController {
  constructor() {
    this.basePath = path.resolve("static");
    this.autoBindMethods();
  }

  autoBindMethods() {
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(
        (prop) => typeof this[prop] === "function" && prop !== "constructor"
      )
      .forEach((method) => {
        this[method] = this[method].bind(this);
      });
  }

  async getWilayah(req, res, next, type) {
    try {
      const config = WILAYAH_CONFIG[type];
      const { id } = req.params;

      const validationError = this.validateRequest(id, config);
      if (validationError) return next(validationError);

      const filePath = this.buildFilePath(id, config);
      const data = await readJSON(filePath);

      res.json({
        success: true,
        data,
        metadata: this.generateMetadata(type, id),
      });
    } catch (error) {
      next(this.handleFileError(error));
    }
  }

  validateRequest(id, config) {
    if (!id) return null;

    const isValidId =
      id.length === config.idLength ||
      (config.parent && id.length === config.parent.idLength);

    if (!isValidId) {
      return {
        status: 400,
        message:
          `ID harus ${config.idLength} karakter` +
          (config.parent ? ` atau ${config.parent.idLength} karakter` : ""),
      };
    }
    return null;
  }

  buildFilePath(id, config) {
    if (!id) {
      return path.join(this.basePath, config.allFile);
    }

    const isParentRequest =
      config.parent && id.length === config.parent.idLength;
    const targetFolder = isParentRequest ? config.parent.folder : config.folder;

    return path.join(this.basePath, targetFolder, `${id}.json`);
  }

  generateMetadata(type, id) {
    return {
      type,
      ...(id && { id }),
      timestamp: new Date().toISOString(),
    };
  }

  handleFileError(error) {
    if (error.code === "ENOENT") {
      return { status: 404, message: "Data tidak ditemukan" };
    }
    if (error instanceof SyntaxError) {
      return { status: 500, message: "Format data tidak valid" };
    }
    return error;
  }

  async getProvinces(req, res, next) {
    await this.getWilayah(req, res, next, "provinces");
  }

  async getRegencies(req, res, next) {
    await this.getWilayah(req, res, next, "regencies");
  }

  async getDistricts(req, res, next) {
    await this.getWilayah(req, res, next, "districts");
  }

  async getVillages(req, res, next) {
    await this.getWilayah(req, res, next, "villages");
  }

  async getWilayahByConcatenatedId(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return next({
          status: 400,
          message: 'Parameter query "q" diperlukan',
        });
      }

      // Validasi format ID
      if (!/^\d{10}$/.test(q)) {
        return next({
          status: 400,
          message: "ID harus berupa 10 digit angka",
        });
      }

      const ids = {
        province_id: q.substring(0, 2),
        regency_id: q.substring(0, 4),
        district_id: q.substring(0, 7),
        village_id: q,
      };

      // Ambil semua data terkait
      const [province, regency, district, village] = await Promise.all([
        this.getDataById("provinces", ids.province_id),
        this.getDataById("regencies", ids.regency_id),
        this.getDataById("districts", ids.district_id),
        this.getDataById("villages", ids.village_id),
      ]);

      res.json({
        success: true,
        data: {
          province,
          regency,
          district,
          village,
        },
        metadata: {
          ids,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDataById(type, id) {
    const config = WILAYAH_CONFIG[type];
    if (!config) return null;

    const filePath = path.join(this.basePath, config.folder, `${id}.json`);

    try {
      return await readJSON(filePath);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }
}
