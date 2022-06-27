const router = require("express").Router();

router.delete("/", async (req, res) => {
  try {
    console.log("Xóa session xong rồi");
    req.session.destroy();
    res.send();
  } catch (error) {
    res.status(500).send({ error });
  }
});

module.exports = router;
