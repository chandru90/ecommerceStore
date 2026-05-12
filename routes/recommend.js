const tf = require("@tensorflow/tfjs");
const axios = require("axios");

// -----------------------------------
// FETCH ORDERS
// -----------------------------------

async function fetchOrders() {
  const response = await axios.get(
    "http://localhost:5000/api/orders/orders"
  );

  return response.data;
}

// -----------------------------------
// BUILD DATASET
// -----------------------------------

async function buildDataset() {
  const orders = await fetchOrders();

  const users = [];
  const items = [];
  const ratings = [];

  orders.forEach(order => {
    const userEmail = order.email;

    order.items.forEach(item => {
      users.push(userEmail);

      items.push(item.productId);

      // implicit rating
      let rating = 3;

      if (item.quantity >= 3) {
        rating = 5;
      } else if (item.quantity === 2) {
        rating = 4;
      }

      ratings.push(rating);
    });
  });

  return { users, items, ratings };
}

// -----------------------------------
// TRAIN MODEL
// -----------------------------------

async function trainModel(users, items, ratings) {
  const uniqueUsers = [...new Set(users)];
  const uniqueItems = [...new Set(items)];

  const userIndex = {};
  const itemIndex = {};

  uniqueUsers.forEach((u, i) => {
    userIndex[u] = i;
  });

  uniqueItems.forEach((i, j) => {
    itemIndex[i] = j;
  });

  const uTrain = users.map(u => userIndex[u]);
  const iTrain = items.map(i => itemIndex[i]);

  const numUsers = uniqueUsers.length;
  const numItems = uniqueItems.length;

  const latentDim = 8;

  const userEmbedding = tf.variable(
    tf.randomNormal([numUsers, latentDim])
  );

  const itemEmbedding = tf.variable(
    tf.randomNormal([numItems, latentDim])
  );

  const userBias = tf.variable(tf.zeros([numUsers]));
  const itemBias = tf.variable(tf.zeros([numItems]));

  const globalBias = tf.scalar(
    ratings.reduce((a, b) => a + b, 0) / ratings.length
  );

  function predict(userIdx, itemIdx) {
    return tf.tidy(() => {
      const userVector = userEmbedding.gather([userIdx]);
      const itemVector = itemEmbedding.gather([itemIdx]);

      const dotProduct = tf.sum(
        tf.mul(userVector, itemVector)
      );

      const ub = userBias.gather([userIdx]);
      const ib = itemBias.gather([itemIdx]);

      return dotProduct
        .add(ub)
        .add(ib)
        .add(globalBias);
    });
  }

  const optimizer = tf.train.adam(0.05);

  function trainStep() {
    optimizer.minimize(() => {
      const predictions = tf.stack(
        uTrain.map((u, idx) =>
          predict(u, iTrain[idx])
        )
      ).reshape([ratings.length]);

      const labels = tf.tensor1d(ratings);

      return tf.losses.meanSquaredError(
        labels,
        predictions
      );
    });
  }

  // training loop
  for (let epoch = 0; epoch < 100; epoch++) {
    trainStep();

    if (epoch % 20 === 0) {
      console.log(`Training Epoch ${epoch}`);
    }
  }

  // recommendation function
  function recommendProducts(userEmail, topN = 5) {
    const userIdx = userIndex[userEmail];

    if (userIdx === undefined) {
      return [];
    }

    const purchasedItems = items.filter(
      (_, idx) => users[idx] === userEmail
    );

    const recommendations = [];

    uniqueItems.forEach(itemId => {
      if (!purchasedItems.includes(itemId)) {
        const itemIdx = itemIndex[itemId];

        const score = predict(
          userIdx,
          itemIdx
        ).dataSync()[0];

        recommendations.push({
          productId: itemId,
          score: Number(score.toFixed(2)),
        });
      }
    });

    recommendations.sort(
      (a, b) => b.score - a.score
    );

    return recommendations.slice(0, topN);
  }

  return {
    recommendProducts,
  };
}

// -----------------------------------
// MAIN FUNCTION
// -----------------------------------

async function runRecommendation() {
  const { users, items, ratings } =
    await buildDataset();

  const model = await trainModel(
    users,
    items,
    ratings
  );

  const recommendations =
    model.recommendProducts(
      "newusr@gmail.com"
    );

  console.log(
    "\nRecommended Products:"
  );

  console.log(recommendations);
}

runRecommendation();