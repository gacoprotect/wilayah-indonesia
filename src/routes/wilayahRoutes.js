import { Router } from "express";
import WilayahController from "../controllers/WilayahController.js";
import { validateConcatenatedId } from "../middlewares/validationMiddleware.js";

const router = Router();
const wilayah = new WilayahController();

// Route yang sudah ada
router.get("/provinces/:id?", wilayah.getProvinces);
router.get("/regencies/:id?", wilayah.getRegencies);
router.get("/districts/:id?", wilayah.getDistricts);
router.get("/villages/:id?", wilayah.getVillages);

// Route baru untuk concatenated ID
router.get("/wilayah", 
  validateConcatenatedId,
  wilayah.getWilayahByConcatenatedId
);

export default router;