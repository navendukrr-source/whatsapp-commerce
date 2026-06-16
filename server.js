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

/* ✅ PRODUCT NAME MAP */
const nameMap = {
    "42147386949735": "Off-White Floral Print Cotton Shirt"
};

/* ✅ PRODUCT LINK MAP */
const linkMap = {
    "42147386949735": "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
};

/* ✅ Send WhatsApp message */
async function sendWhatsApp(to, message) {
    await fetch(process.env.GETGABS_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            to: to,
            type: "text",
            messaging_product: "whatsapp",
            recipient_type: "individual",
            text: { body: message },
            api_key: process.env.GETGABS_TOKEN
        })
    });
}

/* ✅ Create Razorpay payment link */
async function createPaymentLink(amount, phone, product) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: `${product.name || `Product ₹${product.price}`}`,
        customer: { contact: phone },
        notes: {
            product_id: product.id,
            product_name: product.name,
            size: product.size,
            basic_info: product.basic_info
        }
    });

    return link.short_url;
}

/* ✅ TEMP STORAGE */
const userSession = {};

/* ✅ WEBHOOK */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        const phone = data.wa_id;

        let messageText = null;

        try {
            if (data.message_text && data.message_text.startsWith("{")) {
                messageText = JSON.parse(data.message_text);
            }
        } catch {}

        /* ✅ STEP 1: PRODUCT RECEIVED */
        if (data.message_type === "order" && messageText?.order) {

            const item = messageText.order.product_items[0];

            const product = {
                id: item.product_retailer_id,
                price: item.item_price,
                name: nameMap[item.product_retailer_id] || "",
                link: linkMap[item.product_retailer_id] || "https://yavastrah.com"
            };

            userSession[phone] = product;

            const nameText = product.name ? `🛍️ *${product.name}*\n\n` : "";

            await sendWhatsApp(phone,
`${nameText}💰 Price: ₹${product.price}

📏 Please select size:
S / M / L / XL`
            );
        }

        /* ✅ HANDLE USER INPUT */
        else {

           let text = "";

// ✅ Case 1: JSON message
if (data.message_text && data.message_text.startsWith("{")) {
    try {
        const parsed = JSON.parse(data.message_text);
        text = parsed.text || "";
    } catch {}
}

// ✅ Case 2: plain text ("1", "2", "M", etc.)
else if (typeof data.message_text === "string") {
    text = data.message_text;
}

// ✅ Case 3: fallback (very important)
if (!text && data.text) {
    text = data.text;
}

text = (text || "").toUpperCase().trim();

console.log("User text:", text);

            const session = userSession[phone];
            if (!session) return res.sendStatus(200);

            /* ✅ STEP 2: SIZE */
            if (!session.size && ["S","M","L","XL"].includes(text)) {

                session.size = text;

                const nameText = session.name ? `🛍️ *${session.name}*\n\n` : "";

                await sendWhatsApp(phone,
`${nameText}📏 Size: ${session.size}
💰 Price: ₹${session.price}

👉 Choose how you want to order:

1️⃣ Buy on Website (fastest ✅)  
2️⃣ Quick Checkout (WhatsApp)  
3️⃣ Cash on Delivery`
                );
            }

            /* ✅ OPTION 1 — WEBSITE */
            else if (text === "1") {

                const nameText = session.name ? `🛍️ *${session.name}*\n\n` : "";

                await sendWhatsApp(phone,
`${nameText}✅ Continue on Website:

👉 ${session.link}`
                );

                delete userSession[phone];
            }

            /* ✅ OPTION 2 — PAY NOW */
            else if (text === "2") {

                session.step = "address";
                session.payment = "online";

                await sendWhatsApp(phone,
`📦 Please share your name & city:

Example:
Rahul - Jaipur ✅`
                );
            }

            /* ✅ OPTION 3 — COD */
            else if (text === "3") {

                session.step = "address";
                session.payment = "cod";

                await sendWhatsApp(phone,
`📦 Please share your name & city:

Example:
Rahul - Jaipur ✅`
                );
            }

            /* ✅ ADDRESS STEP */
            else if (session.step === "address") {

                session.basic_info = data.message_text;

                if (session.payment === "online") {

                    const paymentLink = await createPaymentLink(session.price, phone, session);

                    await sendWhatsApp(phone,
`💳 Pay here:
${paymentLink}`
                    );
                }

                else {

                    await sendWhatsApp(phone,
`✅ *Order Confirmed!*

📏 Size: ${session.size}
📍 ${session.basic_info}

📞 Our team will contact you to confirm delivery details

🚚 Payment: Cash on Delivery

Thank you for shopping with us ❤️`
);
                }

                delete userSession[phone];
            }
        }

        res.sendStatus(200);

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/* ✅ START SERVER */
app.listen(process.env.PORT, () => {
    console.log("Server running...");
});
