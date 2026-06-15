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
    try {
        const res = await fetch(process.env.GETGABS_API, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GETGABS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                number: to,
                text: message
            })
        });

        const data = await res.text();
        console.log("Response:", data);

    } catch (err) {
        console.error("Error sending message:", err);
    }
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
    "42147386949735": {
        name: "Off-White Floral Print Cotton Shirt",
        price: 850,
        link: "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
    }
};


/* ✅ TEMP STORAGE (USER → PRODUCT) */
const userSession = {};

/* ✅ WEBHOOK */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        console.log("Incoming:", data);

        if (!data || !data.wa_id) {
            return res.status(200).json({ success: true });
        }

        const phone = data.wa_id;

        /* ✅ STEP 1: USER SENT PRODUCT */
        let messageText = null;

try {
    messageText = data.message_text ? JSON.parse(data.message_text) : null;
    console.log("Parsed messageText:", messageText);
} catch (e) {
    console.log("Parse error:", e);
}

if (data.message_type === "order" && messageText && messageText.order) {

   const item = messageText.order.product_items[0];
const productId = item.product_retailer_id;

    console.log("Product ID:", productId);

    const product = productMap[productId];

    if (!product) {
        await sendWhatsApp(phone, "❌ Product not configured.");
        return res.status(200).json({ success: true });
    }

    userSession[phone] = product;

    await sendWhatsApp(phone,
`🛍️ *${product.name}*

📏 Please confirm your size:
Reply with S / M / L / XL`
    );
}

        /* ✅ STEP 2: USER SELECTS SIZE */
      else if (data.message_type === "text") {

    let textMessage = "";

    try {
        const parsed = JSON.parse(data.message_text);
        textMessage = parsed.text ? parsed.text.toUpperCase() : "";
    } catch (e) {
        textMessage = data.message_text.toUpperCase();
    }

    const text = textMessage.trim();
    const product = userSession[phone];

    if (product && ["S", "M", "L", "XL"].includes(text)) {

        const paymentLink = await createPaymentLink(product.price, phone);

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
