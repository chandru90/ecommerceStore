
const express = require("express");
const Order = require("../models/Order");

const router = express.Router();


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
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/orders/stats", async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          uniqueUsers: { $addToSet: "$email" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          userCount: { $size: "$uniqueUsers" },
        },
      },
    ]);

    res.json(
      stats[0] || { totalRevenue: 0, userCount: 0 }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




// router.get("/orders/user-stats", async (req, res) => {
//   try {
//     const userOrders = await Order.aggregate([
//       {
//         $group: {
//           _id: "$email",

//           // total orders by user
//           totalOrders: { $sum: 1 },

//           // total spent by user
//           totalSpent: { $sum: "$totalAmount" },

//           // all orders
//           orders: {
//             $push: {
//               orderId: "$_id",
//               totalAmount: "$totalAmount",
//               products: "$products",
//               createdAt: "$createdAt",
//             },
//           },
//         },
//       },

//       {
//         $project: {
//           _id: 0,
//           email: "$_id",
//           totalOrders: 1,
//           totalSpent: 1,
//           orders: 1,
//         },
//       },

//       // highest spender first
//       {
//         $sort: { totalSpent: -1 },
//       },
//     ]);

//     res.json(userOrders);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });




// routes/orderRoutes.js

router.get("/orders/user-stats", async (req, res) => {
  try {
    const userOrders = await Order.aggregate([
      {
        $group: {
          _id: "$email",

          // total orders by user
          totalOrders: { $sum: 1 },

          // total amount spent
          totalSpent: { $sum: "$totalAmount" },

          // all orders
          orders: {
            $push: {
              orderId: "$_id",
              totalAmount: "$totalAmount",

              // products array
              products: {
                $map: {
                  input: "$products",
                  as: "p",
                  in: {
                    name: {
                      $ifNull: [
                        "$$p.name",
                        {
                          $ifNull: [
                            "$$p.title",
                            {
                              $ifNull: [
                                "$$p.productName",
                                "Unknown Product",
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    quantity: "$$p.quantity",
                  },
                },
              },

              createdAt: "$createdAt",
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          email: "$_id",
          totalOrders: 1,
          totalSpent: 1,
          orders: 1,
        },
      },

      {
        $sort: { totalSpent: -1 },
      },
    ]);

    res.json(userOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});












router.get("/orders/:email", async (req, res) => {
  const { email } = req.params;
  console.log(email);

  try {
    const orders = await Order.find({ email: email });

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

module.exports = router;
