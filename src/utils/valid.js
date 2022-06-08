const isValidUpdate = (updates, allowUpdateds) => {
  //Check valid update
  const isValid = updates.every((update) => allowUpdateds.includes(update))
  if (!isValid) return false
  return true
}

module.exports = { isValidUpdate }
