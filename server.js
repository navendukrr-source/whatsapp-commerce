require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const Razorpay = require("razorpay");

const app = express();
app.use(express.json());

/* ✅ Razorpay setup */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
});

/* ✅ Send WhatsApp message */
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

/* ✅ Create Razorpay payment link */
async function createPaymentLink(amount, phone) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: "Order Payment",
        customer: {
            contact: phone
        }
    });

    return link.short_url;
}

/* ✅ PRODUCT MAP (ADD YOUR PRODUCTS HERE) */
const productMap = {
    "42147387015271": {
        name: "Off-White Floral Print Cotton Shirt",
        price: 1699,
        link: "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
    },

    // 👉 ADD MORE PRODUCTS LIKE THIS
    /*
    "ANOTHER_ID": {
        name: "Product Name",
        price: 999,
        link: "https://yavastrah.com/products/..."
    }
    */
};

/* ✅ TEMP STORAGE (USER → PRODUCT) */
const userSession = {};

/* ✅ WEBHOOK */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        console.log("Incoming:", data);

        if (!data || !data.from) {
            return res.status(200).json({ success: true });
        }

        const phone = data.from;

        /* ✅ STEP 1: USER SENT PRODUCT */
        let messageText = null;

try {
    messageText = data.message_text ? JSON.parse(data.message_text) : null;
} catch (e) {
    console.log("Parse error:", e);
}

if (messageText && messageText.order && messageText.order.product_items) {

            const item = messageText.order.product_items[0];
const productId = item.product_retailer_id;

            console.log("Product ID:", productId);

            const product = productMap[productId];

            if (!product) {
                await sendWhatsApp(phone, "❌ Product not configured.");
                return res.status(200).json({ success: true });
            }

            /* ✅ SAVE PRODUCT IN SESSION */
            userSession[phone] = product;

            /* ✅ ASK SIZE */
            await sendWhatsApp(phone,
`🛍️ *${product.name}*

📏 Please confirm your size:
Reply with S / M / L / XL`
            );
        }

        /* ✅ STEP 2: USER SELECTS SIZE */
        else if (data.text) {

            const text = data.text.trim().toUpperCase();
            const product = userSession[phone];

            if (product && ["S", "M", "L", "XL"].includes(text)) {

                /* ✅ Create payment link */
                const paymentLink = await createPaymentLink(product.price, phone);

                /* ✅ FINAL MESSAGE (YOUR REQUIRED FORMAT ✅) */
                const message = `
🛍️ *${product.name}*

📏 Size: ${text}

💰 Price: ₹${product.price}

✅ Buy on website:
${product.link}

💳 Pay here:
${paymentLink}
                `;

                await sendWhatsApp(phone, message);

                /* ✅ clear session */
                delete userSession[phone];
            }
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("ERROR:", err);
        return res.status(500).json({ error: true });
    }
});

/* ✅ START SERVER */
app.listen(process.env.PORT, () => {
    console.log("Server running...");
});
``
