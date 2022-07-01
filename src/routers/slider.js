const Slider = require("../models/slider");
const { isValidUpdate } = require("../utils/valid");
const router = require("express").Router();

// ---------------MARKETING
//POST /sliders
//GET /sliders/:id
//GET /sliders/
//PATCH /sliders/:id

//POST /sliders
router.post("/", async (req, res) => {
  const slider = new Slider({ ...req.body });
  try {
    const sliderSaved = await slider.save();
    res.status(201).send(sliderSaved);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error });
  }
});

//GET /sliders
router.get("/", async (req, res) => {
  console.log(req.query);
  try {
    const sliders = await Slider.find({});
    const count = await Slider.countDocuments();
    res.status(200).send({ sliders, count });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

//GET /sliders/:id
router.get("/:id", async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    res.status(200).send(slider);
  } catch (error) {
    console.log(error);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send({ error });
  }
});

//PATCH /sliders/:id
router.patch("/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["title", "backlink", "notes", "status", "image"];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Update slider
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.sendStatus(404);
    updates.forEach((update) => (slider[update] = req.body[update]));

    //Save
    await slider.save({ validateModifiedOnly: true });
    res.send(slider);
  } catch (error) {
    if (error.name === "CastError" && error.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
