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
    "42147386949735": "Off-White Floral Print Cotton Shirt",
    "42147386982503": "Off-White Floral Print Cotton Shirt",
    "42147387015271": "Off-White Floral Print Cotton Shirt"
};

const linkMap = {
    "42147386949735": "https://yavastrah.com/products/off-white-floral-print-cotton-shirt"
};

/* ✅ SIZE MAP (FROM YOUR CATALOG) */
const sizeMap = {

    // ✅ Men's Purple Kurta with Abstract Print
    "42164560199783": "M",
    "42208950976615": "S",

    // ✅ Men's Teal Kurta with Intricate Print
    "42208951173223": "S",
    "42208951140455": "M",

    // ✅ Teal Green Multicolor Ethnic Motif Print Crop Top
    "42150803603559": "XL",
    "42150803505255": "S",
    "42150803538023": "M",
    "42150803570791": "L",
    "42150803472487": "XS",

    // ✅ Teal Blue Floral Printed Cotton Kurti
    "42152662007911": "L",
    "42152661975143": "M",
    "42152661909607": "XS",
    "42152662040679": "XL",
    "42152661942375": "S",

    // ✅ Ivory & Mustard Floral Printed Cotton Kurti
    "42170985840743": "XS",
    "42170985971815": "XL",
    "42170985939047": "L",
    "42170985873511": "S",
    "42170985906279": "M",

    // ✅ Sunshine Yellow Floral Printed Cotton Kurti
    "42150768509031": "M",
    "42150768574567": "XL",
    "42150768443495": "XS",
    "42150768541799": "L",
    "42150768476263": "S",

    // ✅ Mustard Yellow High-Low Kurti
    "42150795116647": "S",
    "42150795083879": "XS",
    "42150795182183": "L",
    "42150793150567": "S",
    "42150793183335": "M",
    "42150793117799": "XS",
    "42150795214951": "XL",
    "42150795149415": "M",

    // ✅ Rust Red Ethnic Motif Print Crop Top
    "42150804291687": "XL",
    "42150804258919": "L",
    "42150804226151": "M",
    "42150804193383": "S",
    "42150804160615": "XS",

    // ✅ Ruby Red High-Low Kurti
    "42150793150567": "S",
    "42150793183335": "M",
    "42150793117799": "XS",
    "42150793216103": "L",
    "42150793248871": "XL",

    // ✅ Navy Blue Ethnic Print Crop Top
    "42150804848743": "L",
    "42150804881511": "XL",
    "42150804783207": "S",
    "42150804815975": "M",
    "42208996982887": "XS",

    // ✅ Mustard Yellow multicolor paisley Angrakha Kurti
    "42150798393447": "S",
    "42150798458983": "L",
    "42150798360679": "XS",
    "42150798426215": "M",
    "42150798491751": "XL",

    // ✅ Mustard Yellow Printed Kurta Palazzo Set
    "42147500195943": "M",
    "42147500163175": "S",
    "42147500261479": "XL",
    "42147500228711": "L",
    "42147500130407": "XS",

    // ✅ Red Floral Ethnic Motif Print Crop Top
    "42150805307495": "XL",
    "42150805274727": "L",
    "42150805241959": "M",
    "42150805209191": "S",
    "42150805176423": "XS",

    // ✅ Blush Pink Floral Printed Cotton Kurti
    "42150755008615": "L",
    "42150755041383": "XL",
    "42150754975847": "M",
    "42150754943079": "S",
    "42150754484327": "XS",

    // ✅ Powder Blue Floral Printed Cotton Kurti
    "42150754549863": "M",
    "42150754517095": "S",
    "42150754615399": "XL",
    "42150754582631": "L",
    "42150754910311": "XS",

    // ✅ Red Printed Kurta Palazzo Set
    "42147507273831": "S",
    "42147507372135": "XL",
    "42147507306599": "M",
    "42147507339367": "L",
    "42147507241063": "XS",

    // ✅ Off-White Floral Print Cotton Shirt
    "42147386949735": "M",
    "42147387015271": "XL",
    "42147386982503": "L",

    // ✅ Ivory & Blush Pink Floral Printed Cotton Kurti
    "42170984300647": "XS",
    "42170984333415": "S",
    "42170984431719": "XL",
    "42170984366183": "M",
    "42170984398951": "L",

    // ✅ Maroon & Black Geometric Print A-Line Flare Dress
    "42150797738087": "XL",
    "42150797607015": "XS",
    "42150797705319": "L",
    "42150797639783": "S",
    "42150797672551": "M",

    // ✅ Teal Blue Ethnic Motif Print Crop Top
    "42150805864551": "S",
    "42150805962855": "XL",
    "42150805930087": "L",
    "42150805897319": "M",
    "42150805831783": "XS",

    // ✅ Rani Pink Paisley Angrakha Kurti
    "42150797377639": "M",
    "42150797312103": "XS",
    "42150797410407": "L",
    "42150797344871": "S",
    "42150797443175": "XL",

    // ✅ Mustard Green A-Line Flare Dress
    "42147434004583": "M",
    "42147433971815": "S",
    "42147434070119": "XL",
    "42147433939047": "XS",
    "42147434037351": "L",

    // ✅ Dark Green Printed Kurta Palazzo Set
    "42147412639847": "M",
    "42147412607079": "S",
    "42147412705383": "XL",
    "42147412574311": "XS",
    "42147412672615": "L",

    // ✅ Navy Blue Printed Kurta Palazzo Set
    "42210910699623": "XS",
    "42210910732391": "S",
    "42210910765159": "M",
    "42210910797927": "L",
    "42210910830695": "XL",

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

          const product = {
    id: item.product_retailer_id,
    price: item.item_price,
    name: metaData.name || nameMap[item.product_retailer_id] || "",
    size: sizeMap[item.product_retailer_id] || null,
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
            if (text.includes("1")) {

    await sendWhatsApp(phone,
`🛍️ ${session.name}
${session.size ? `📏 Size: ${session.size}\n` : ""}
💰 Price: ₹${session.price}

🛒 Buy here:
${session.link}`
    );

    delete userSession[phone];

            } else if (text === "2") {
                session.step = "address";
                session.payment = "online";
                await sendWhatsApp(phone,
`📦 Enter name & city:

For Example : Rahul - Jaipur`
                );

            } else if (text === "3" || text.includes("3")) {
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
