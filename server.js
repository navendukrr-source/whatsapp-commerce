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

/* ✅ FALLBACK MAPS */
const nameMap = {
    "42147387015271": "Off-White Floral Print Cotton Shirt"
};

const linkMap = {
    "42147386949735": "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
};

/* ✅ SIZE MAP (FROM YOUR CATALOG) */
const sizeMap = {
    /* … your size mappings … */
};

/* ✅ META CACHE */
const productCache = {};

/* ✅ LOAD META PRODUCTS */
async function loadMetaProducts() {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${process.env.CATALOG_ID}/products?fields=name,variants{retailer_id,variant_values}&access_token=${process.env.META_TOKEN}`
        );

        const data = await res.json();

        if (!data.data) return;

        data.data.forEach(p => {
            const productName = p.name;
            if (!p.variants?.data) return;

            p.variants.data.forEach(variant => {
                const id = variant.retailer_id;
                const size =
                    variant.variant_values?.Size ||
                    variant.variant_values?.size ||
                    variant.variant_values?.SIZE;

                productCache[id] = {
                    name: productName,
                    size: size || null
                };
            });
        });

        console.log("✅ Meta products + variants loaded");

    } catch (err) {
        console.log("⚠️ Meta load failed — fallback working");
    }
}
/* ✅ LOAD ON START */
loadMetaProducts();

/* ✅ Send WhatsApp */
async function sendWhatsApp(to, message) {
    await fetch(process.env.GETGABS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            to,
            type: "text",
            messaging_product: "whatsapp",
            recipient_type: "individual",
            text: { body: message },
            api_key: process.env.GETGABS_TOKEN
        })
    });
}

/* ✅ Razorpay */
async function createPaymentLink(amount, phone, product) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: `${product.name}`,
        customer: { contact: phone },
        notes: {
            Product: product.name,
            Size: product.size || "N/A",
            Price: `₹${product.price}`,
            Address: product.basic_info || "-"
        }
    });
    return link.short_url;
}

/* ✅ SESSION */
const userSession = {};

/* ✅ WEBHOOK */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;

        if (!data.message_text && !data.text) {
            return res.sendStatus(200);
        }

        const phone = data.wa_id;
        let messageText = null;

        try {
            if (data.message_text && data.message_text.startsWith("{")) {
                messageText = JSON.parse(data.message_text);
            }
        } catch (err) {
            // ignore parse errors
        }

        /* ✅ PRODUCT RECEIVED */
        if (data.message_type === "order" && messageText?.order) {
            const item = messageText.order.product_items[0];
            const metaData = productCache[item.product_retailer_id] || {};

            const productName =
                metaData.name ||
                nameMap[item.product_retailer_id] ||
                "Product";

            const product = {
                id: item.product_retailer_id,
                price: item.item_price,
                name: productName,
                size:
                    sizeMap[item.product_retailer_id] ||
                    metaData.size ||
                    null,
                link: linkMap[item.product_retailer_id] || "https://yavastrah.com"
            };

            userSession[phone] = product;

            const nameText = product.name ? `🛍️ *${product.name}*\n\n` : "";

            await sendWhatsApp(phone,
`${nameText}${product.size ? `📏 Size: ${product.size}\n` : ""}
💰 Price: ₹${product.price}

👉 How would you like to proceed?

1️⃣ View on Website (Fastest)
2️⃣ Pay Now (Razorpay-Secure 🔒)  
3️⃣ Cash on Delivery (COD)

💬 Reply with *1, 2 or 3*`
            );

        } else {
            /* ✅ USER INPUT */
            let text = "";

            try {
                if (data.message_text && data.message_text.startsWith("{")) {
                    const parsed = JSON.parse(data.message_text);
                    text = parsed.text || "";
                } else if (typeof data.message_text === "string") {
                    text = data.message_text;
                }
            } catch (err) {
                // ignore parse errors
            }

            if (!text) {
                text = data.text || "";
            }
            text = (text || "").trim();

            console.log("User text:", text);

            const session = userSession[phone];
            if (!session) return res.sendStatus(200);

            /* ✅ OPTIONS */
            if (text === "1") {
                await sendWhatsApp(phone, `👉 Buy here:\n${session.link}`);
                delete userSession[phone];

            } else if (text === "2") {
                session.step = "address";
                session.payment = "online";
                await sendWhatsApp(phone,
`📦 Enter name & city:

For Example : Rahul - Jaipur`
                );

            } else if (text === "3") {
                session.step = "address";
                session.payment = "cod";
                await sendWhatsApp(phone,
`📦 Enter name & city:

Rahul - Jaipur`
                );

            } else if (session.step === "address") {
                session.basic_info = data.message_text;

                if (session.payment === "online") {
                    const link = await createPaymentLink(
                        session.price,
                        phone,
                        session
                    );

                    await sendWhatsApp(phone,
`🛍️ ${session.name}
${session.size ? `📏 Size: ${session.size}` : ""}
💰 Amount: ₹${session.price}

💳 Pay here:
${link}

✅ You will receive confirmation after payment via SMS/WhatsApp`
                    );

                } else {
                    await sendWhatsApp(phone,
`✅ Order Confirmed!

🛍️ ${session.name}
${session.size ? `📏 Size: ${session.size}` : ""}
💰 ₹${session.price}

📍 ${session.basic_info}

📞 You will receive confirmation via call/SMS shortly`
                    );
                    delete userSession[phone];
                }
            }
        }

        res.sendStatus(200);

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/* ✅ START */
app.listen(process.env.PORT, () => {
    console.log("Server running...");
});
