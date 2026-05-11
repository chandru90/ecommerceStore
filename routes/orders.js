
// const express = require("express");
// const Order = require("../models/Order");

// const router = express.Router();


// router.post("/checkout", async (req, res) => {
//   const { customerName, email, address, items, totalAmount } = req.body;

 
//   if (!customerName || !email || !address || !items || !totalAmount) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const newOrder = new Order({
//       customerName,
//       email,
//       address,
//       items,
//       totalAmount,
//     });

//     const savedOrder = await newOrder.save();
//     res.status(201).json(savedOrder);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.get("/orders/:email", async (req, res) => {
//   const { email } = req.params;
//   console.log(email);

//   try {
//     const orders = await Order.find({ email: email });

//     if (orders.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No orders found for this email" });
//     }

//     res.status(200).json(orders);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


const express = require("express");
const Order = require("../models/Order");
// const User = require("../models/User"); // Import User model

const router = express.Router();


// =======================
// Checkout Route
// =======================
router.post("/checkout", async (req, res) => {
  const { customerName, email, address, items, totalAmount } = req.body;

  if (!customerName || !email || !address || !items || !totalAmount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newOrder = new Order({
      customerName,
      email,
      address,
      items,
      totalAmount,
      status: "Placed", // default status
    });

    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================
// Get Orders By Email
// =======================
router.get("/orders/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const orders = await Order.find({ email });

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this email" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================
// Get Registered Users Count
// =======================
router.get("/users/count", async (req, res) => {
  try {
    const usersCount = await User.countDocuments();

    res.status(200).json({
      totalUsers: usersCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================
// Cancel Order
// =======================
router.put("/cancelorder/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Update order status
    order.status = "Cancelled";

    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;