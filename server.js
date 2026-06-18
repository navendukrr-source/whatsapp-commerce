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

/* ✅ GLOBAL CATALOG DIRECTORY MAP 
   👉 Add your own products here exactly using this layout formatting:
   "YOUR_VARIANT_ID": { name: "Product Name String", size: "Size Code" },
*/
const catalogDirectory = {
    // 🛍️ Men's Purple Kurta with Abstract Print
    "42164560199783": { name: "Men's Purple Kurta with Abstract Print", size: "M", link: "https://yavastrah.com" },
    "42208950976615": { name: "Men's Purple Kurta with Abstract Print", size: "S", link: "https://yavastrah.com" },

    // 🛍️ Men's Teal Kurta with Intricate Print
    "42208951173223": { name: "Men's Teal Kurta with Intricate Print", size: "S", link: "https://yavastrah.com" },
    "42208951140455": { name: "Men's Teal Kurta with Intricate Print", size: "M", link: "https://yavastrah.com" },

    // 🛍️ Teal Green Multicolor Ethnic Motif Print Crop Top
    "42150803603559": { name: "Teal Green Multicolor Ethnic Motif Print Crop Top", size: "XL", link: "https://yavastrah.com" },
    "42150803505255": { name: "Teal Green Multicolor Ethnic Motif Print Crop Top", size: "S", link: "https://yavastrah.com" },
    "42150803538023": { name: "Teal Green Multicolor Ethnic Motif Print Crop Top", size: "M", link: "https://yavastrah.com" },
    "42150803570791": { name: "Teal Green Multicolor Ethnic Motif Print Crop Top", size: "L", link: "https://yavastrah.com" },
    "42150803472487": { name: "Teal Green Multicolor Ethnic Motif Print Crop Top", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Teal Blue Floral Printed Cotton Kurti
    "42152662007911": { name: "Teal Blue Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    "42152661975143": { name: "Teal Blue Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },
    "42152661909607": { name: "Teal Blue Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },
    "42152662040679": { name: "Teal Blue Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
    "42152661942375": { name: "Teal Blue Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },

    // 🛍️ Ivory & Mustard Floral Printed Cotton Kurti
    "42170985840743": { name: "Ivory & Mustard Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },
    "42170985971815": { name: "Ivory & Mustard Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
    "42170985939047": { name: "Ivory & Mustard Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    "42170985873511": { name: "Ivory & Mustard Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },
    "42170985906279": { name: "Ivory & Mustard Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },

    // 🛍️ Sunshine Yellow Floral Printed Cotton Kurti
    "42150768509031": { name: "Sunshine Yellow Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },
    "42150768574567": { name: "Sunshine Yellow Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
    "42150768443495": { name: "Sunshine Yellow Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },
    "42150768541799": { name: "Sunshine Yellow Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    "42150768476263": { name: "Sunshine Yellow Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },

    // 🛍️ Mustard Yellow High-Low Kurti
    "42150795116647": { name: "Mustard Yellow High-Low Kurti", size: "S", link: "https://yavastrah.com" },
    "42150795083879": { name: "Mustard Yellow High-Low Kurti", size: "XS", link: "https://yavastrah.com" },
    "42150795182183": { name: "Mustard Yellow High-Low Kurti", size: "L", link: "https://yavastrah.com" },
    "42150795214951": { name: "Mustard Yellow High-Low Kurti", size: "XL", link: "https://yavastrah.com" },
    "42150795149415": { name: "Mustard Yellow High-Low Kurti", size: "M", link: "https://yavastrah.com" },

    // 🛍️ Rust Red Ethnic Motif Print Crop Top
    "42150804291687": { name: "Rust Red Ethnic Motif Print Crop Top", size: "XL", link: "https://yavastrah.com" },
    "42150804258919": { name: "Rust Red Ethnic Motif Print Crop Top", size: "L", link: "https://yavastrah.com" },
    "42150804226151": { name: "Rust Red Ethnic Motif Print Crop Top", size: "M", link: "https://yavastrah.com" },
    "42150804193383": { name: "Rust Red Ethnic Motif Print Crop Top", size: "S", link: "https://yavastrah.com" },
    "42150804160615": { name: "Rust Red Ethnic Motif Print Crop Top", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Ruby Red High-Low Kurti
    "42150793150567": { name: "Ruby Red High-Low Kurti", size: "S", link: "https://yavastrah.com" },
    "42150793183335": { name: "Ruby Red High-Low Kurti", size: "M", link: "https://yavastrah.com" },
    "42150793117799": { name: "Ruby Red High-Low Kurti", size: "XS", link: "https://yavastrah.com" },
    "42150793216103": { name: "Ruby Red High-Low Kurti", size: "L", link: "https://yavastrah.com" },
    "42150793248871": { name: "Ruby Red High-Low Kurti", size: "XL", link: "https://yavastrah.com" },

    // 🛍️ Navy Blue Ethnic Print Crop Top
    "42150804848743": { name: "Navy Blue Ethnic Print Crop Top", size: "L", link: "https://yavastrah.com" },
    "42150804881511": { name: "Navy Blue Ethnic Print Crop Top", size: "XL", link: "https://yavastrah.com" },
    "42150804783207": { name: "Navy Blue Ethnic Print Crop Top", size: "S", link: "https://yavastrah.com" },
    "42150804815975": { name: "Navy Blue Ethnic Print Crop Top", size: "M", link: "https://yavastrah.com" },
    "42208996982887": { name: "Navy Blue Ethnic Print Crop Top", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Mustard Yellow multicolor paisley Angrakha Kurti
    "42150798393447": { name: "Mustard Yellow Multicolor Paisley Angrakha Kurti", size: "S", link: "https://yavastrah.com" },
    "42150798458983": { name: "Mustard Yellow Multicolor Paisley Angrakha Kurti", size: "L", link: "https://yavastrah.com" },
    "42150798360679": { name: "Mustard Yellow Multicolor Paisley Angrakha Kurti", size: "XS", link: "https://yavastrah.com" },
    "42150798426215": { name: "Mustard Yellow Multicolor Paisley Angrakha Kurti", size: "M", link: "https://yavastrah.com" },
    "42150798491751": { name: "Mustard Yellow Multicolor Paisley Angrakha Kurti", size: "XL", link: "https://yavastrah.com" },

    // 🛍️ Mustard Yellow Printed Kurta Palazzo Set
    "42147500195943": { name: "Mustard Yellow Printed Kurta Palazzo Set", size: "M", link: "https://yavastrah.com" },
    "42147500163175": { name: "Mustard Yellow Printed Kurta Palazzo Set", size: "S", link: "https://yavastrah.com" },
    "42147500261479": { name: "Mustard Yellow Printed Kurta Palazzo Set", size: "XL", link: "https://yavastrah.com" },
    "42147500228711": { name: "Mustard Yellow Printed Kurta Palazzo Set", size: "L", link: "https://yavastrah.com" },
    "42147500130407": { name: "Mustard Yellow Printed Kurta Palazzo Set", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Red Floral Ethnic Motif Print Crop Top
    "42150805307495": { name: "Red Floral Ethnic Motif Print Crop Top", size: "XL", link: "https://yavastrah.com" },
    "42150805274727": { name: "Red Floral Ethnic Motif Print Crop Top", size: "L", link: "https://yavastrah.com" },
    "42150805241959": { name: "Red Floral Ethnic Motif Print Crop Top", size: "M", link: "https://yavastrah.com" },
    "42150805209191": { name: "Red Floral Ethnic Motif Print Crop Top", size: "S", link: "https://yavastrah.com" },
    "42150805176423": { name: "Red Floral Ethnic Motif Print Crop Top", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Blush Pink Floral Printed Cotton Kurti
    "42150755008615": { name: "Blush Pink Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    "42150755041383": { name: "Blush Pink Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
    "42150754975847": { name: "Blush Pink Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },
    "42150754943079": { name: "Blush Pink Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },
    "42150754484327": { name: "Blush Pink Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Powder Blue Floral Printed Cotton Kurti
    "42150754549863": { name: "Powder Blue Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },
    "42150754517095": { name: "Powder Blue Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },
    "42150754615399": { name: "Powder Blue Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
    "42150754582631": { name: "Powder Blue Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    "42150754910311": { name: "Powder Blue Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Red Printed Kurta Palazzo Set
    "42147507273831": { name: "Red Printed Kurta Palazzo Set", size: "S", link: "https://yavastrah.com" },
    "42147507372135": { name: "Red Printed Kurta Palazzo Set", size: "XL", link: "https://yavastrah.com" },
    "42147507306599": { name: "Red Printed Kurta Palazzo Set", size: "M", link: "https://yavastrah.com" },
    "42147507339367": { name: "Red Printed Kurta Palazzo Set", size: "L", link: "https://yavastrah.com" },
    "42147507241063": { name: "Red Printed Kurta Palazzo Set", size: "XS", link: "https://yavastrah.com" },

    // 🛍️ Off-White Floral Print Cotton Shirt
"42147386949735": { name: "Off-White Floral Print Cotton Shirt", size: "M", link: "yavastrah.com" },
"42147386982503": { name: "Off-White Floral Print Cotton Shirt", size: "L", link: "yavastrah.com" },
"42147387015271": { name: "Off-White Floral Print Cotton Shirt", size: "XL", link: "yavastrah.com" },
    
// 🛍️ Ivory & Blush Pink Floral Printed Cotton Kurti
"42170984300647": { name: "Ivory & Blush Pink Floral Printed Cotton Kurti", size: "XS", link: "https://yavastrah.com" },
"42170984333415": { name: "Ivory & Blush Pink Floral Printed Cotton Kurti", size: "S", link: "https://yavastrah.com" },
"42170984431719": { name: "Ivory & Blush Pink Floral Printed Cotton Kurti", size: "XL", link: "https://yavastrah.com" },
"42170984366183": { name: "Ivory & Blush Pink Floral Printed Cotton Kurti", size: "M", link: "https://yavastrah.com" },
"42170984398951": { name: "Ivory & Blush Pink Floral Printed Cotton Kurti", size: "L", link: "https://yavastrah.com" },
    
// 🛍️ Maroon & Black Geometric Print A-Line Flare Dress
"42150797738087": { name: "Maroon & Black Geometric Print A-Line Flare Dress", size: "XL", link: "https://yavastrah.com" },
"42150797607015": { name: "Maroon & Black Geometric Print A-Line Flare Dress", size: "XS", link: "https://yavastrah.com" },
"42150797705319": { name: "Maroon & Black Geometric Print A-Line Flare Dress", size: "L", link: "https://yavastrah.com" },
"42150797639783": { name: "Maroon & Black Geometric Print A-Line Flare Dress", size: "S", link: "https://yavastrah.com" },
"42150797672551": { name: "Maroon & Black Geometric Print A-Line Flare Dress", size: "M", link: "https://yavastrah.com" },
    
// 🛍️ Teal Blue Ethnic Motif Print Crop Top
"42150805864551": { name: "Teal Blue Ethnic Motif Print Crop Top", size: "S", link: "https://yavastrah.com" },
"42150805962855": { name: "Teal Blue Ethnic Motif Print Crop Top", size: "XL", link: "https://yavastrah.com" },
"42150805930087": { name: "Teal Blue Ethnic Motif Print Crop Top", size: "L", link: "https://yavastrah.com" },
"42150805897319": { name: "Teal Blue Ethnic Motif Print Crop Top", size: "M", link: "https://yavastrah.com" },
"42150805831783": { name: "Teal Blue Ethnic Motif Print Crop Top", size: "XS", link: "https://yavastrah.com" },
    
// 🛍️ Rani Pink Paisley Angrakha Kurti
"42150797377639": { name: "Rani Pink Paisley Angrakha Kurti", size: "M", link: "https://yavastrah.com" },
"42150797312103": { name: "Rani Pink Paisley Angrakha Kurti", size: "XS", link: "https://yavastrah.com" },
"42150797410407": { name: "Rani Pink Paisley Angrakha Kurti", size: "L", link: "https://yavastrah.com" },
"42150797344871": { name: "Rani Pink Paisley Angrakha Kurti", size: "S", link: "https://yavastrah.com" },
"42150797443175": { name: "Rani Pink Paisley Angrakha Kurti", size: "XL", link: "https://yavastrah.com" },
    
// 🛍️ Mustard Green A-Line Flare Dress
"42147434004583": { name: "Mustard Green A-Line Flare Dress", size: "M", link: "https://yavastrah.com" },
"42147433971815": { name: "Mustard Green A-Line Flare Dress", size: "S", link: "https://yavastrah.com" },
"42147434070119": { name: "Mustard Green A-Line Flare Dress", size: "XL", link: "https://yavastrah.com" },
"42147433939047": { name: "Mustard Green A-Line Flare Dress", size: "XS", link: "https://yavastrah.com" },
"42147434037351": { name: "Mustard Green A-Line Flare Dress", size: "L", link: "https://yavastrah.com" },
    
// 🛍️ Dark Green Printed Kurta Palazzo Set
"42147412639847": { name: "Dark Green Printed Kurta Palazzo Set", size: "M", link: "https://yavastrah.com" },
"42147412607079": { name: "Dark Green Printed Kurta Palazzo Set", size: "S", link: "https://yavastrah.com" },
"42147412705383": { name: "Dark Green Printed Kurta Palazzo Set", size: "XL", link: "https://yavastrah.com" },
"42147412574311": { name: "Dark Green Printed Kurta Palazzo Set", size: "XS", link: "https://yavastrah.com" },
"42147412672615": { name: "Dark Green Printed Kurta Palazzo Set", size: "L", link: "https://yavastrah.com" },
    
// 🛍️ Navy Blue Printed Kurta Palazzo Set
"42210910699623": { name: "Navy Blue Printed Kurta Palazzo Set", size: "XS", link: "https://yavastrah.com" },
"42210910732391": { name: "Navy Blue Printed Kurta Palazzo Set", size: "S", link: "https://yavastrah.com" },
"42210910765159": { name: "Navy Blue Printed Kurta Palazzo Set", size: "M", link: "https://yavastrah.com" },
"42210910797927": { name: "Navy Blue Printed Kurta Palazzo Set", size: "L", link: "https://yavastrah.com" },
"42210910830695": { name: "Navy Blue Printed Kurta Palazzo Set", size: "XL", link: "https://yavastrah.com" }
};


const userSession = {};

/* ✅ SEND WHATSAPP MESSAGE API ENGINE */
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
        console.error("WhatsApp messaging engine fault:", e);
    }
}

/* ✅ SECURE RAZORPAY PAYMENT LINK ENGINE */
async function createPaymentLink(amount, phone, product) {
    const paymentData = await razorpay.paymentLink.create({
        amount: Math.round(amount * 100), currency: "INR", description: `${product.name}`,
        customer: { contact: phone },
        notes: { Product: product.name, Size: product.size || "M", Price: `₹${product.price}`, Address: product.basic_info || "-" }
    });
    return paymentData.short_url;
}

/* ✅ WEBHOOK CONTROLLER ENDPOINT */
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        if (!data.message_text && !data.text) return res.sendStatus(200);

        const phone = data.wa_id;
        let msgObj = null;
        try {
            if (data.message_text && data.message_text.startsWith("{")) msgObj = JSON.parse(data.message_text);
        } catch (e) {}

        /* 🛒 CASE 1: DIRECT CATALOG CART PAYLOAD RECEIVER */
        if (data.message_type === "order" && msgObj?.order) {
            const productItemsArray = msgObj.order.product_items;
            if (!productItemsArray || productItemsArray.length === 0) return res.sendStatus(200);

            // FIX: Safely extract index zero to break out from array envelope container wrapper!
            let totalPrice = 0;
let productText = "";

productItemsArray.forEach(item => {
    const retailerId = String(item.product_retailer_id || "").trim();
    const localProduct = catalogDirectory[retailerId];

    const name = localProduct?.name || `Product ${retailerId}`;
    const size = localProduct?.size || "M";
    const price = item.item_price;

    totalPrice += price;

    productText += `🛍️ ${name}\n📏 Size: ${size}\n💰 ₹${price}\n\n`;
});
            
            // Look up from local database directory maps

        userSession[phone] = {
    products: productItemsArray,
    total: totalPrice
};

const msg = `${productText}💰 *Total Amount: ₹${totalPrice}*

👉 How would you like to proceed?

1️⃣ View on Website (Fastest)
2️⃣ Pay Now (Razorpay-Secure 🔒)
3️⃣ Cash on Delivery (COD)

💬 Reply with *1, 2 or 3*`;
            await sendWhatsApp(phone, msg);

        } else {
            /* 💬 CASE 2: CONVERSATIONAL USER INPUT RESPONSE INTERCEPTOR */
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

            /* ✅ CHECKOUT CONFIGURATION ROUTER USER CHOICE LOGIC */
            if (text.includes("1")) {

    let productText = "";
    
    session.products.forEach(item => {
        const retailerId = String(item.product_retailer_id || "").trim();
        const localProduct = catalogDirectory[retailerId];

        const name = localProduct?.name || `Product ${retailerId}`;
        const size = localProduct?.size || "M";

        productText += `🛍️ ${name}\n📏 Size: ${size}\n\n`;
    });

    // ✅ CART LINK GENERATION (THIS IS THE NEW PART)
    let cartLink = "https://yavastrah.com/cart/";

    const items = session.products.map(item => {
        return `${item.product_retailer_id}:1`;
    });

    cartLink += items.join(",");

    await sendWhatsApp(phone,
`${productText}
💰 Total: ₹${session.total}

🛒 Buy here:
${cartLink}`);

    delete userSession[phone];
}
else if (text === "2") {
                session.step = "address"; session.payment = "online";
                await sendWhatsApp(phone, "📦 Enter name & city:\n\nFor Example : Rahul - Jaipur");
            } else if (text === "3" || text.includes("3")) {
                session.step = "address"; session.payment = "cod";
                await sendWhatsApp(phone, "📦 Enter name & city:\n\nRahul - Jaipur");
            } else if (session.step === "address") {
                session.basic_info = text;
                if (session.payment === "online") {
                    const paymentLink = await createPaymentLink(session.total, phone, session);
                    let productText = "";

session.products.forEach(item => {
    const retailerId = String(item.product_retailer_id || "").trim();
    const localProduct = catalogDirectory[retailerId];

    const name = localProduct?.name || `Product ${retailerId}`;
    const size = localProduct?.size || "M";

    productText += `🛍️ ${name}\n📏 Size: ${size}\n\n`;
});

const link = await createPaymentLink(session.total, phone, session);

await sendWhatsApp(phone,
`${productText}💰 Amount: ₹${session.total}

💳 Pay here:
${paymentLink}

✅ Secure Checkout generated successfully, 📞 You will receive all communication shortly post payment confirmation.`
);
} else {
                   let productText = "";

session.products.forEach(item => {
    const retailerId = String(item.product_retailer_id || "").trim();
    const localProduct = catalogDirectory[retailerId];

    const name = localProduct?.name || `Product ${retailerId}`;
    const size = localProduct?.size || "M";

    productText += `🛍️ ${name}\n📏 Size: ${size}\n\n`;
});

await sendWhatsApp(phone,
`✅ Order Confirmed!

${productText}💰 ₹${session.total}

📍 ${session.basic_info}

📞 You will receive confirmation shortly`
);
delete userSession[phone];
                }
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error("System crash trace log intercepted:", err);
        res.sendStatus(500);
    }
});

/* ✅ ACTIVE PORT INITIALIZATION LISTENER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`System cleanly running on port ${PORT}`));
