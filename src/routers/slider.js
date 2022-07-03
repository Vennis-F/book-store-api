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

  const { limit, page, publicDate, status } = req.query;
  const match = {};
  const options = {
    limit: 10,
    skip: 0,
  };

  //Product status
  if (status) {
    match.status = status === "true";
  }

  //Paging
  if (limit) options.limit = parseInt(limit);
  if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

  try {
    const sliders = await Slider.find(match, null, options);
    const count = await Slider.countDocuments();
    // console.log({ sliders, count });
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

//SECTION 1:
//Q1: 93
let total = 0;
for (let i = 3; i <= 30; i += 3) {
  total = total + i;
  i = i + 2;
}
console.log(total);

//Q2: 1001.8660608000002
const calcBalance = (years, start) => {
  let balance = start;
  for (let i = 1; i <= years; i++) {
    balance += i % 2 !== 0 ? balance * 0.2 : balance * 0.1;
  }
  return balance;
};
console.log(calcBalance(2, 100));

//Q3: [ 1, 2, 3, 8 ]
let greater = (it) => it * 2;
console.log([0, 1, 2, 3, 0, 8].filter(greater));

//Q4: https://unix.stackexchange.com/questions/656248/what-does-sudo-rm-rf-do
