const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  protect,
  getMe,
  updateUser,
  updatePassword,
  getAllUsers,
  getUser,
  logout,
} = require("../controller/authController");

router.post("/signup", signup);

router.post("/login", login);

router.get("/me", protect, getMe);
router.get("/getUsers", protect, getAllUsers)
router.patch("/update/:id", protect, updateUser)
router.patch("/updatingPassword", protect, updatePassword)
router.get("/logout", logout);
router.get("/getUser/:id", protect, getUser);


module.exports = router;
