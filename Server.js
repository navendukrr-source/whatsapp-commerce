require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const Razorpay = require("razorpay");

const app = express();
app.use(express.json());

// ✅ Razorpay setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
});

// ✅ Helper: Send WhatsApp message
async function sendWhatsApp(to, message) {
    await fetch(process.env.GETGABS_API, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GETGABS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            to: to,
            message: message
        })
    });
}

// ✅ Get product from Shopify
async function getProductDetails(variantId) {
    const url = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/variants/${variantId}.json`;

    const res = await fetch(url, {
        headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN
        }
    });

    const data = await res.json();
    return data.variant;
}

// ✅ Create Shopify Order
async function createOrder(variantId, quantity) {
    const url = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/orders.json`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN
        },
        body: JSON.stringify({
            order: {
                line_items: [
                    {
                        variant_id: variantId,
                        quantity: Number(quantity)
                    }
                ],
                financial_status: "pending"
            }
        })
    });

    return await res.json();
}

// ✅ Create Razorpay payment link
async function createPaymentLink(amount, phone) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: "WhatsApp Order Payment",
        customer: {
            contact: phone
        }
    });

    return link.short_url;
}

// ✅ MAIN WEBHOOK
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;

        console.log("Incoming:", data);

        // 🔐 Basic security
        if (!data || !data.from) {
            return res.sendStatus(400);
        }

        const phone = data.from;

        // ✅ PRODUCT MESSAGE (MOST IMPORTANT)
        if (data.productitems) {
            const item = data.productitems[0];

            const variantId = item.productretailerid;
            const quantity = item.quantity;

            console.log("Product ID:", variantId);

            // ✅ Step 1: Get product details
            const product = await getProductDetails(variantId);

            const price = parseFloat(product.price);
            const name = product.title;

            // ✅ Step 2: Create order in Shopify
            await createOrder(variantId, quantity);

            // ✅ Step 3: Create Razorpay link
            const paymentLink = await createPaymentLink(price, phone);

            // ✅ Step 4: Send WhatsApp message
            const message = `
✅ Order Created!

🛍️ Product: ${name}
💰 Price: ₹${price}

👉 Pay here:
${paymentLink}

Once payment is done, your order will be confirmed.
            `;

            await sendWhatsApp(phone, message);

        }

        // ✅ TEXT FALLBACK
        else if (data.text) {
            const text = data.text.toLowerCase();

            if (text.includes("order")) {
                await sendWhatsApp(phone,
                    "🛒 Please send the product from catalog to place order."
                );
            }
        }

        res.sendStatus(200);

    } catch (err) {
        console.error("ERROR:", err);
        res.sendStatus(500);
    }
});

app.listen(process.env.PORT, () => {
    console.log("Server running...");
});