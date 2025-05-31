export function validateConcatenatedId(req, res, next) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Parameter query "q" diperlukan',
    });
  }

  if (!/^\d{10}$/.test(q)) {
    return res.status(400).json({
      success: false,
      message: "ID harus berupa 10 digit angka",
    });
  }

  // Tambahkan decoded ID ke request untuk digunakan di controller
  req.decodedIds = {
    province_id: q.substring(0, 2),
    regency_id: q.substring(0, 4),
    district_id: q.substring(0, 7),
    village_id: q,
  };

  next();
}

export function validateIdParams(req, res, next) {
  const { id } = req.params;
  if (!id) return next();

  const pathMapping = {
    provinces: 2,
    regencies: 4,
    districts: 7,
    villages: 10,
  };

  const pathParts = req.path.split("/");
  const endpoint = pathParts[pathParts.length - 1];

  if (pathMapping[endpoint] && id.length !== pathMapping[endpoint]) {
    return res.status(400).json({
      success: false,
      message: `ID ${endpoint} harus ${pathMapping[endpoint]} karakter`,
    });
  }

  next();
}
