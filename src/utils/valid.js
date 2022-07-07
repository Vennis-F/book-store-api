const isValidUpdate = (updates, allowUpdateds) => {
  //Check valid update
  const isValid = updates.every((update) => allowUpdateds.includes(update));
  if (!isValid) return false;
  return true;
};

const updatesFilter = (allowedObj) => {
  let updates = Object.keys(allowedObj);
  if (updates.includes("briefInformation")) {
    updates = [...updates, ...Object.keys(allowedObj.briefInformation)];
  }
  updates = updates.filter((u) => u !== "briefInformation");
  return updates;
};

module.exports = {
  isValidUpdate,
  updatesFilter,
};
