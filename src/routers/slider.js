const authorize = require("../middlewares/authorize");
const { auth } = require("../middlewares/auth");
const Slider = require("../models/slider");
const { isValidUpdate } = require("../utils/valid");
const router = require("express").Router();

// ---------------Common--------------
//GET /sliders
router.get("/", async (req, res) => {
  // console.log(req.query);
  try {
    const sliders = await Slider.find({ status: true });
    res.send(sliders);
  } catch (error) {
    res.status(500).send();
  }
});

// ---------------MARKETING--------------

//POST /sliders/marketing
router.post("/marketing/", auth, authorize("marketing"), async (req, res) => {
  const slider = new Slider({ ...req.body });
  try {
    const sliderSaved = await slider.save();
    res.status(201).send(sliderSaved);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error });
  }
});

//GET /sliders/marketing
//pagination:   ?limit=...&page=...
//filter:       ?status=...
router.get("/marketing/", auth, authorize("marketing"), async (req, res) => {
  try {
    const { limit, page, status } = req.query;
    const match = {};
    const options = {};

    //filter
    if (status) {
      match.status = status === "true";
    }

    //Paging
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const sliders = await Slider.find(match, null, options);
    const count = await Slider.count(match);
    console.log(match, options);
    res.status(200).send({ sliders, count });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

//GET /sliders/marketing/search?search=...
//search: title, backlink
//pagination:   ?limit=...&page=...
router.post(
  "/marketing/search",
  auth,
  authorize("marketing"),
  async (req, res) => {
    try {
      let { search, limit, page } = req.body;
      const options = {};

      //Paging
      if (limit) options.limit = parseInt(limit);
      else {
        limit = 5;
      }
      if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);
      else {
        page = 1;
        options.skip = parseInt(limit) * (parseInt(page) - 1);
      }

      //search
      const searchResult = [];
      const checkById = [];

      const title = new RegExp(search);
      const sliders = await Slider.find({ title: title }, null, options);
      for (const slider of sliders) {
        if (checkById.length >= limit) break;
        if (!checkById.includes(slider._id.toString())) {
          checkById.push(slider._id.toString());
          searchResult.push(slider);
        }
      }

      if (checkById < limit - 1) {
        const backlink = new RegExp(search);
        const sliders = await Slider.find({ backlink }, null, options);
        for (const slider of sliders) {
          if (checkById.length >= limit) break;
          if (!checkById.includes(slider._id.toString())) {
            checkById.push(slider._id.toString());
            searchResult.push(slider);
          }
        }
      }

      res.send(searchResult);
    } catch (error) {
      console.log(error);
      return res.status(500).send();
    }
  }
);

//GET /sliders/marketing/:id
router.get("/marketing/:id", auth, authorize("marketing"), async (req, res) => {
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

//PATCH /sliders/marketing/:id
router.patch(
  "/marketing/:id",
  auth,
  authorize("marketing"),
  async (req, res) => {
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
  }
);

//DELETE /sliders/marketing/:id
router.delete(
  "/marketing/:id",
  auth,
  authorize("marketing"),
  async (req, res) => {
    try {
      const slider = await Slider.findByIdAndDelete(req.params.id);
      if (!slider) return res.status(404).send();
      res.send(slider);
    } catch (error) {
      res.status(500).send();
    }
  }
);

module.exports = router;
