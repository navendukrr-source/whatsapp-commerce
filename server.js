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

/* ✅ FALLBACK MAPS (IMPORTANT) */
const nameMap = {
    "42147386949735": "Off-White Floral Print Cotton Shirt"
};

const linkMap = {
    "42147386949735": "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
};

/* ✅ META CACHE */
const productCache = {};

/* ✅ LOAD META PRODUCTS (SAFE INIT) */
async function loadMetaProducts() {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${process.env.CATALOG_ID}/products?fields=variants{retailer_id,variant_values}&access_toke=${process.env.META_TOKEN}`
        );

        const data = await res.json();

        if (!data.data) return;

        data.data.forEach(p => {
            productCache[p.retailer_id] = {
                name: p.name
            };
        });

        console.log("✅ Meta products loaded");
    } catch (err) {
        console.log("⚠️ Meta load failed — fallback active");
    }
}
async function loadVariants() {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${process.env.CATALOG_ID}/products?fields=variants{retailer_id,variant_values}&access_token=${process.env.META_TOKEN}`
        );

        const data = await res.json();

        if (!data.data) return;

        data.data.forEach(product => {

            if (!product.variants?.data) return;

            product.variants.data.forEach(variant => {

                const id = variant.retailer_id;
                const size =
    variant.variant_values?.Size ||
    variant.variant_values?.size ||
    variant.variant_values?.SIZE;

                if (!productCache[id]) {
                    productCache[id] = {};
                }

                productCache[id].size = size;
            });
        });

        console.log("✅ Variant sizes loaded");

    } catch (err) {
        console.log("⚠️ Variant fetch failed");
    }
}

/* ✅ CALL ON START */
(async () => {
    await loadMetaProducts();
    await loadVariants();
})();

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

/* ✅ Create Razorpay */
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
        } catch {}

        /* ✅ PRODUCT RECEIVED */
        if (data.message_type === "order" && messageText?.order) {

            const item = messageText.order.product_items[0];

            const metaData = productCache[item.product_retailer_id] || {};

            const product = {
                id: item.product_retailer_id,
                price: item.item_price,
                name: metaData.name || nameMap[item.product_retailer_id] || "",
                size: metaData.size || null,
                link: linkMap[item.product_retailer_id] || "https://yavastrah.com"
            };

            userSession[phone] = product;

            const nameText = product.name ? `🛍️ *${product.name}*\n\n` : "";

            await sendWhatsApp(phone,
`${nameText}${product.size ? `📏 Size: ${product.size}\n` : ""}
💰 Price: ₹${product.price}

👉 Choose:

1️⃣ Website  
2️⃣ Pay Now  
3️⃣ COD`
            );

        } else {

            /* ✅ USER INPUT */

            let text = "";

            if (data.message_text && data.message_text.startsWith("{")) {
                try {
                    const parsed = JSON.parse(data.message_text);
                    text = parsed.text || "";
                } catch {}
            } else if (typeof data.message_text === "string") {
                text = data.message_text;
            }

            if (!text && data.text) {
                text = data.text;
            }

            text = (text || "").toUpperCase().trim();

            console.log("User text:", text);

            const session = userSession[phone];
            if (!session) return res.sendStatus(200);

            /* ✅ OPTIONS */

            if (text === "1") {

                await sendWhatsApp(phone,
`👉 Buy here:
${session.link}`
                );

                delete userSession[phone];

            } else if (text === "2") {

                session.step = "address";
                session.payment = "online";

                await sendWhatsApp(phone,
`📦 Enter name & city:

Rahul - Jaipur`
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
`💳 Pay:
${link}`
                    );

                } else {

                    await sendWhatsApp(phone,
`✅ Order Confirmed!

📏 ${session.size || ""}
📍 ${session.basic_info}

We will contact you ✅`
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

       /* ✅ PRODUCT RECEIVED */
if (data.message_type === "order" && messageText?.order) {

    const item = messageText.order.product_items[0];

    const metaData = productCache[item.product_retailer_id] || {};

    const product = {
        id: item.product_retailer_id,
        price: item.item_price,
        name: metaData.name || nameMap[item.product_retailer_id] || "",
        size: metaData.size || null,
        link: linkMap[item.product_retailer_id] || "https://yavastrah.com"
    };

    userSession[phone] = product;

    const nameText = product.name ? `🛍️ *${product.name}*\n\n` : "";

await sendWhatsApp(phone,
`${nameText}${product.size ? `📏 Size: ${product.size}\n` : ""}
💰 Price: ₹${product.price}

👉 Choose:

1️⃣ Website (Fastest)
2️⃣ Pay Now (Razorpay-secure) 
3️⃣ COD (Cash on delivery)`
);
}
else {

    /* ✅ USER INPUT */

    let text = "";

    if (data.message_text && data.message_text.startsWith("{")) {
        try {
            const parsed = JSON.parse(data.message_text);
            text = parsed.text || "";
        } catch {}
    } else if (typeof data.message_text === "string") {
        text = data.message_text;
    }

    if (!text && data.text) {
        text = data.text;
    }

    text = (text || "").toUpperCase().trim();

    console.log("User text:", text);

    const session = userSession[phone];
    if (!session) return res.sendStatus(200);
}

            /* ✅ SIZE */
            if (!session.size && ["S","M","L","XL"].includes(text)) {

                session.size = text;

                const nameText = session.name ? `🛍️ *${session.name}*\n\n` : "";

                await sendWhatsApp(phone,
`${nameText}📏 Size: ${session.size}
💰 Price: ₹${session.price}

👉 Choose:

1️⃣ Website  
2️⃣ Pay Now  
3️⃣ COD`
                );
            }

            /* ✅ WEBSITE */
            else if (text === "1") {

                await sendWhatsApp(phone,
`👉 Buy here:
${session.link}`
                );

                delete userSession[phone];
            }

            /* ✅ PAY */
            else if (text === "2") {

                session.step = "address";
                session.payment = "online";

                await sendWhatsApp(phone,
`📦 Enter name & city:

Rahul - Jaipur`
                );
            }

            /* ✅ COD */
            else if (text === "3") {

                session.step = "address";
                session.payment = "cod";

                await sendWhatsApp(phone,
`📦 Enter name & city:

Rahul - Jaipur`
                );
            }

            /* ✅ ADDRESS */
            else if (session.step === "address") {

                session.basic_info = data.message_text;

                if (session.payment === "online") {

                    const link = await createPaymentLink(session.price, phone, session);

                    await sendWhatsApp(phone,
`💳 Pay:
${link}`
                    );
                } else {

                    await sendWhatsApp(phone,
`✅ Order Confirmed!

📏 ${session.size}
📍 ${session.basic_info}

We will contact you ✅`
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

/* ✅ START */
app.listen(process.env.PORT, () => {
    console.log("Server running...");
});
``
