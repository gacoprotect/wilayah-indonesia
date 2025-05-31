import { Router } from "express";
import WilayahController from "../controllers/WilayahController.js";
import { validateConcatenatedId } from "../middlewares/validationMiddleware.js";

const router = Router();
const wilayah = new WilayahController();
const searchController = new SearchController();


router.get("/provinces/:id?", wilayah.getProvinces);
router.get("/regencies/:id?", wilayah.getRegencies);
router.get("/districts/:id?", wilayah.getDistricts);
router.get("/villages/:id?", wilayah.getVillages);

router.get("/wilayah", 
  validateConcatenatedId,
  wilayah.getWilayahByConcatenatedId
);
router.get("/search", searchController.searchWilayah.bind(searchController));


export default router;