require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const Razorpay = require("razorpay");

const app = express();
app.use(express.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
});

const productCache = {};
const userSession = {};

/* ✅ AUTOMATIC LIVE CATALOG SYNC ENGINE */
async function loadMetaProducts() {
    try {
        console.log("🔄 Syncing Meta Catalog...");
        const res = await fetch(`https://facebook.com{process.env.CATALOG_ID}/products?fields=name,variants{retailer_id,id,sku,variant_values}&limit=250&access_token=${process.env.META_TOKEN}`);
        const data = await res.json();
        
        if (data.error || !data.data) {
            console.error("❌ Meta Sync Failed, using baseline fallbacks.");
            return;
        }

        data.data.forEach(p => {
            if (!p.variants?.data) return;
            p.variants.data.forEach(v => {
                const rawId = v.retailer_id || v.sku || v.id;
                if (!rawId) return;
                const cleanId = String(rawId).trim();
                const sz = v.variant_values?.Size || v.variant_values?.size || v.variant_values?.SIZE || "M";
                productCache[cleanId] = { name: p.name, size: sz };
            });
        });
        console.log(`✅ Sync Complete: Loaded ${Object.keys(productCache).length} items.`);
    } catch (err) {
        console.log("⚠️ Meta Sync Engine offline.");
    }
}
loadMetaProducts();

async function sendWhatsApp(to, message) {
    try {
        await fetch(process.env.GETGABS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to, type: "text", messaging_product: "whatsapp",
                recipient_type: "individual", text: { body: message },
                api_key: process.env.GETGABS_TOKEN
            })
        });
    } catch (e) {
        console.error("WA Drop:", e);
    }
}

async function createPaymentLink(amount, phone, product) {
    const link = await razorpay.paymentLink.create({
        amount: Math.round(amount * 100), currency: "INR", description: `${product.name}`,
        customer: { contact: phone },
        notes: { Product: product.name, Size: product.size || "M", Price: `₹${product.price}`, Address: product.basic_info || "-" }
    });
    return link.short_url;
}

/* ✅ WEBHOOK ENDPOINT */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        if (!data.message_text && !data.text) return res.sendStatus(200);

        const phone = data.wa_id;
        let msgObj = null;
        try {
            if (data.message_text && data.message_text.startsWith("{")) msgObj = JSON.parse(data.message_text);
        } catch (e) {}

        /* 🛒 CASE 1: DIRECT CART ORDERS FROM CATALOG */
        if (data.message_type === "order" && msgObj?.order) {
            const productItemsArray = msgObj.order.product_items;
            if (!productItemsArray || productItemsArray.length === 0) return res.sendStatus(200);

            // Secure array unpacking mapping assignment 
            const item = productItemsArray[0]; 
            const retailerId = String(item.product_retailer_id || "").trim();
            const meta = productCache[retailerId] || {};

            // Dynamic Auto-Name Fallback if product item isn't cached yet
            const finalName = meta.name || "Yavastrah Collection Apparel";
            const finalSize = meta.size || "M";
            const finalLink = `https://yavastrah.com{retailerId}`;

            userSession[phone] = {
                id: retailerId, price: item.item_price, name: finalName, size: finalSize, link: finalLink
            };

            const msg = `🛍️ *${finalName}*\n\n📏 Size: ${finalSize}\n💰 Price: ₹${item.item_price}\n\n👉 How would you like to proceed?\n\n1️⃣ View on Website (Fastest)\n2️⃣ Pay Now (Razorpay-Secure 🔒)\n3️⃣ Cash on Delivery (COD)\n\n💬 Reply with *1, 2 or 3*`;
            await sendWhatsApp(phone, msg);

        } else {
            /* 💬 CASE 2: USER INPUT SELECTION STRINGS */
            let text = "";
            try {
                if (data.message_text && data.message_text.startsWith("{")) {
                    text = JSON.parse(data.message_text).text || "";
                } else if (typeof data.message_text === "string") {
                    text = data.message_text;
                }
            } catch (e) {}
            if (!text) text = data.text || "";
            text = text.trim();

            const session = userSession[phone];
            if (!session) return res.sendStatus(200);

            if (text.includes("1")) {
                await sendWhatsApp(phone, `🛍️ ${session.name}\n📏 Size: ${session.size}\n💰 Price: ₹${session.price}\n\n🛒 Buy here:\n${session.link}`);
                delete userSession[phone];
            } else if (text === "2") {
                session.step = "address"; session.payment = "online";
                await sendWhatsApp(phone, "📦 Enter name & city:\n\nFor Example : Rahul - Jaipur");
            } else if (text === "3" || text.includes("3")) {
                session.step = "address"; session.payment = "cod";
                await sendWhatsApp(phone, "📦 Enter name & city:\n\nRahul - Jaipur");
            } else if (session.step === "address") {
                session.basic_info = text;
                if (session.payment === "online") {
                    const link = await createPaymentLink(session.price, phone, session);
                    await sendWhatsApp(phone, `🛍️ ${session.name}\n📏 Size: ${session.size}\n💰 Amount: ₹${session.price}\n\n💳 Pay here:\n${link}\n\n✅ Secure Link generated.`);
                } else {
                    await sendWhatsApp(phone, `✅ Order Confirmed!\n\n🛍️ ${session.name}\n📏 Size: ${session.size}\n💰 ₹${session.price}\n📍 ${session.basic_info}\n\n📞 You will receive confirmation via call shortly`);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Active on port ${PORT}`));
