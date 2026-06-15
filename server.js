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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                to: to,
                type: "text",
                messaging_product: "whatsapp",
                recipient_type: "individual",
                text: {
                    body: message,
                    preview_url: true
                },
                api_key: process.env.GETGABS_TOKEN
            })
        });

        const data = await res.text();
        console.log("Getgabs response:", data);

    } catch (err) {
        console.error("Send error:", err);
    }
}

/* ✅ Create Razorpay payment link */
async function createPaymentLink(amount, phone, product) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: `${product.name} - ₹${product.price}`,

        customer: {
            contact: phone
        },

        notes: {
            product_id: product.id,
            product_name: product.name,
            size: product.size || "Selected",
            price: product.price,
            address: product.address || ""
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
        console.log("Incoming:", data);

        if (!data || !data.wa_id) {
            return res.status(200).json({ success: true });
        }

        const phone = data.wa_id;

        /* ✅ Parse message */
        let messageText = null;

        try {
            if (data.message_text && data.message_text.startsWith("{")) {
                messageText = JSON.parse(data.message_text);
            }
        } catch (e) {
            console.log("Parse error:", e);
        }

        /* ✅ STEP 1: PRODUCT RECEIVED */
        if (data.message_type === "order" && messageText && messageText.order) {

            const item = messageText.order.product_items[0];

       const product = {
    id: item.product_retailer_id,
    price: item.item_price,
    name: item.product_name || `Product ₹${item.item_price}`,
    size: "Selected",
    link: "https://yavastrah.com"
};
            console.log("Full item:", item);

            userSession[phone] = product;

            await sendWhatsApp(phone,
`🛍️ *${product.name}*

💰 Price: ₹${product.price}

👉 Choose an option:

1️⃣ Buy on Website (Recommended)  
2️⃣ Pay Now (Quick Checkout)  
3️⃣ Cash on Delivery`
            );
        }

        /* ✅ HANDLE USER INPUT */
        else {

            let text = "";

            try {
                if (data.message_text) {
                    const parsed = JSON.parse(data.message_text);
                    text = parsed.text ? parsed.text.toUpperCase() : "";
                }
            } catch (e) {
                text = data.message_text ? data.message_text.toUpperCase() : "";
            }

            text = text.trim();
            console.log("User text:", text);

            const session = userSession[phone];

            if (!session) {
                return res.status(200).json({ success: true });
            }

            /* ✅ OPTION 1 → WEBSITE */
            if (text === "1") {

                await sendWhatsApp(phone,
`✅ *Continue on Website*

🛍️ ${session.name}

👉 Click below:
${session.link}
`
                );

                delete userSession[phone];
            }

            /* ✅ OPTION 2 → PAY NOW */
            else if (text === "2") {

                session.step = "address";
                session.payment = "online";

                await sendWhatsApp(phone,
`📦 Please enter your delivery details:

Name, Address, City, PIN`
                );
            }

            /* ✅ OPTION 3 → COD */
            else if (text === "3") {

                session.step = "address";
                session.payment = "cod";

                await sendWhatsApp(phone,
`📦 Please enter your delivery details:

Name, Address, City, PIN`
                );
            }

            /* ✅ ADDRESS COLLECTION */
            else if (session.step === "address") {

                session.address = data.message_text;

                /* ✅ ONLINE PAYMENT */
                if (session.payment === "online") {

                    const paymentLink = await createPaymentLink(session.price, phone, session);

                    await sendWhatsApp(phone,
`🛍️ *${session.name}*

📦 Address: ${session.address}

💳 Pay here:
${paymentLink}`
                    );
                }

                /* ✅ COD CONFIRMATION */
                else if (session.payment === "cod") {

                    await sendWhatsApp(phone,
`✅ *Order Confirmed!*

🛍️ ${session.name}
📦 ${session.address}

🚚 Payment: Cash on Delivery

📦 Your order will be shipped soon!`
                    );
                }

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
