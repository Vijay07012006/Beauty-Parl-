import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SessionContext {
  messages: ChatMessage[];
}

@Injectable()
export class AiChatService {
  private hf: HfInference | null = null;
  private sessionHistory = new Map<string, SessionContext>();
  private readonly SYSTEM_PROMPT = `You are Beauty Parlé AI assistant, a friendly expert in cosmetics, skincare, haircare and beauty products. Answer customer questions concisely, help with product recommendations, skin concerns, ingredients, order status inquiries, loyalty program questions, and general beauty tips. Keep answers under 150 words. If user asks about order/cart/account without providing ID, politely ask for details.`;
  private readonly MODEL_NAME = 'microsoft/Phi-3-mini-4k-instruct';
  private readonly MAX_HISTORY = 5;
  // Cap the number of in-memory sessions to prevent memory-flood via arbitrary sessionIds
  private readonly MAX_SESSIONS = 500;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    if (apiKey) {
      this.hf = new HfInference(apiKey);
    }
  }

  async sendMessage(
    message: string,
    userId?: string,
    sessionId?: string,
  ): Promise<{ reply: string; modelUsed: string }> {
    const sid = sessionId || `sess_${Date.now()}`;
    const ctx = this.getContext(sid);

    ctx.messages.push({ role: 'user', content: message });
    while (ctx.messages.length > this.MAX_HISTORY) {
      ctx.messages.shift();
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: this.SYSTEM_PROMPT },
      ...ctx.messages,
    ];

    let reply = '';
    let modelUsed = 'rule-based-fallback';

    if (this.hf) {
      try {
        const result = await this.hf.chatCompletion({
          model: this.MODEL_NAME,
          messages: messages as any,
          max_tokens: 300,
          temperature: 0.7,
        });
        if (result?.choices?.[0]?.message?.content) {
          reply = result.choices[0].message.content.trim();
          modelUsed = this.MODEL_NAME;
        }
      } catch (err) {
        console.warn('HuggingFace chatCompletion failed, falling back to rule-based:', (err as any)?.message || err);
      }
    }

    if (!reply) {
      reply = this.ruleBasedFallback(message);
      modelUsed = 'rule-based-fallback';
    }

    ctx.messages.push({ role: 'assistant', content: reply });
    while (ctx.messages.length > this.MAX_HISTORY) {
      ctx.messages.shift();
    }

    return { reply, modelUsed };
  }

  private getContext(sessionId: string): SessionContext {
    if (!this.sessionHistory.has(sessionId)) {
      // Reject new sessions once the cap is reached — old ones are dropped LRU-style
      if (this.sessionHistory.size >= this.MAX_SESSIONS) {
        const oldest = this.sessionHistory.keys().next().value;
        if (oldest !== undefined) this.sessionHistory.delete(oldest);
      }
      this.sessionHistory.set(sessionId, { messages: [] });
    }
    return this.sessionHistory.get(sessionId)!;
  }

  private ruleBasedFallback(message: string): string {
    const q = message.toLowerCase().trim();

    const greetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'good morning', 'good evening', 'good afternoon'];
    if (greetings.some((g) => q.includes(g))) {
      return '🌸 Hi there! Welcome to Beauty Parlé! I can help you with product recommendations, skincare tips, lipstick shades, moisturizer/sunscreen picks, order status, loyalty points, and referrals. What would you like to know?';
    }

    const thanks = ['thank', 'thanks', 'thx', 'ty'];
    if (thanks.some((t) => q.includes(t))) {
      return 'You are so welcome! 💖 If you need anything else – product suggestions, help with an order, or beauty tips – just ask. Have a beautiful day!';
    }

    const byes = ['bye', 'goodbye', 'see you', 'cya', 'later'];
    if (byes.some((b) => q.includes(b))) {
      return 'Goodbye! 👋 Thanks for chatting with Beauty Parlé. Come back anytime for personalized recommendations and beauty tips. Stay gorgeous! ✨';
    }

    if (q.includes('loyalty') || q.includes('point') || q.includes('reward')) {
      return '💎 Our loyalty program lets you earn points on every purchase, reviews, and referrals. Earn 1 point per $1 spent, redeem 100 points for $5 off. Tier perks: Silver (200+ pts), Gold (500+ pts) with free samples, Platinum (1000+ pts) with free shipping! Check your dashboard for balance.';
    }

    if (q.includes('referral') || q.includes('refer') || q.includes('invite')) {
      return '🎁 Refer a friend and you both get $10 off! Share your unique referral link from the "Refer & Earn" page. When they make their first $30+ purchase, both credits apply instantly. Start sharing to earn rewards!';
    }

    if (q.includes('order') || q.includes('track') || q.includes('status') || q.includes('delivery')) {
      if (/\d{4,}/.test(q) || q.includes('id') || q.includes('number')) {
        return '📦 Thanks for sharing your order details! You can track real-time status by logging in → My Account → Orders. There you will find the tracking link, estimated delivery date, and invoice PDF. Need help with a specific item? Tell me more!';
      }
      return '📦 To check your order status, could you please share your order ID or the email used at checkout? With those details I can help you find tracking info, delivery ETA, and past order history.';
    }

    if (q.includes('cart')) {
      return '🛒 Your cart items and subtotal are available in the top-right cart icon. Promo codes can be applied at checkout. If something was removed, it may be out of stock. Need help adding a specific product? Just let me know the name!';
    }

    if (q.includes('account') || q.includes('profile') || q.includes('login') || q.includes('password')) {
      if (/\d+|@/.test(q)) {
        return '🔐 For account help with your registered email/ID, please log in → My Account where you can update passwords, saved addresses, and payment methods. If you are locked out, use the "Forgot Password" link for a reset email.';
      }
      return '🔐 To help with your account, could you share the email address or phone number associated with your Beauty Parlé profile? I can guide you on password resets, address updates, and profile changes.';
    }

    if (q.includes('lipstick') || q.includes('lip') || q.includes('shade')) {
      return '💄 Top lipstick picks by skin tone:\n• Fair: Soft pinks (Rose Petal), peachy nudes (Peach Fuzz)\n• Medium: Warm berries (Raspberry Kiss), MLBB mauves (Mauve Dream)\n• Deep: Rich reds (Ruby Glam), plummy browns (Chocolate Noir)\n• All skin tones: Classic red (Bold Scarlet) & dusty rose (Velvet Rose). Try our virtual try-on tool!';
    }

    if (q.includes('moisturizer') || q.includes('cream')) {
      return '🧴 Best moisturizer by skin type:\n• Dry: Hydra Rich Cream with shea butter + hyaluronic acid (deep 48h hydration)\n• Oily: Oil-Free Matte Gel with niacinamide (pore-minimizing, non-greasy)\n• Combination: Balancing Moisture Fluid (T-zone matte, cheeks hydrated)\n• Sensitive: Calming Barrier Cream with centella + ceramides (fragrance-free, tested for irritation)\nAll are dermatologist-tested & cruelty-free!';
    }

    if (q.includes('sunscreen') || q.includes('sun') || q.includes('spf')) {
      return '☀️ Sunscreen essentials we love:\n• Daily wear: SPF 50+ Lightweight Fluid (no white cast, under-makeup friendly)\n• Sensitive skin: Mineral SPF 50 with zinc oxide (100% physical, reef-safe)\n• Body: SPF 30 Quick-Dry Spray (water-resistant 80 min)\nPro tip: Reapply every 2 hours outdoors, 15 min before sun exposure. Remember lips too – use SPF 15+ balm! 💋';
    }

    if (q.includes('skincare') || q.includes('skin') || q.includes('acne') || q.includes('pimple') || q.includes('aging') || q.includes('wrinkle') || q.includes('dark spot') || q.includes('pigment')) {
      let tip = '✨ Simple 5-step routine: Cleanse → Tone → Serum → Moisturize → SPF (morning).';
      if (q.includes('acne') || q.includes('pimple')) {
        tip += ' For acne: Use salicylic acid cleanser + niacinamide serum, spot-treat with benzoyl peroxide gel. Avoid heavy creams!';
      } else if (q.includes('aging') || q.includes('wrinkle')) {
        tip += ' For anti-aging: Add retinol serum at night (start 2x/week) + vitamin C serum in the morning. Pair with peptides cream!';
      } else if (q.includes('dark spot') || q.includes('pigment')) {
        tip += ' For dark spots/pigmentation: Use vitamin C + tranexamic acid serum daily, AHA/BHA peel 1x/week. Always SPF 50+!';
      } else {
        tip += ' Match serums to your concern: vitamin C (brightening), hyaluronic acid (hydration), retinol (texture), niacinamide (pores).';
      }
      tip += ' Consistency is key – stick to your routine 4–6 weeks for visible results! 🌟';
      return tip;
    }

    if (q.includes('hair') || q.includes('shampoo') || q.includes('conditioner') || q.includes('haircare')) {
      return '💇‍♀️ Haircare picks:\n• Damage repair: Bond repair shampoo + keratin mask (transforms heat/color-damaged hair in 3 uses)\n• Frizzy/curly: Sulfate-free curl cream + argan oil serum (enhances pattern, tames frizz)\n• Oily scalp: Clarifying shampoo 2x/week + lightweight conditioner (apply only on ends)\n• Thin/fine: Volumizing biotin shampoo + root-lifting spray (body without weighing down)\nTry our hair quiz in the "Hair Care" tab for personalized picks!';
    }

    if (q.includes('recommend') || q.includes('suggest') || q.includes('product') || q.includes('best')) {
      return '🌟 Tell me your skin type (dry/oily/combo/sensitive), hair concern, or what you are shopping for (e.g., "night serum for acne" or "vegan lipstick") and I will tailor recommendations! Popular sets: Glow Essentials ($49 – cleanser + vitamin C + SPF) and Hydration Heroes ($55 – serum + cream + eye treatment).';
    }

    if (q.includes('price') || q.includes('offer') || q.includes('discount') || q.includes('deal') || q.includes('sale') || q.includes('coupon')) {
      return '💰 Current offers:\n• Welcome 15% off first order: code BEAUTY15\n• Spend $75+ → free 4pc gift set (auto-added to cart)\n• Loyalty members: exclusive 10% off flash sale Wednesdays\n• Bundle & save up to 30% on skincare kits\nNew drops get early access for Gold/Platinum tiers!';
    }

    if (q.includes('return') || q.includes('refund') || q.includes('exchange')) {
      return '↩️ Easy 15-day return policy for unopened, unused products in original packaging. Contact support@beautyparle.com with your order ID for a prepaid return label. Refunds process within 5–7 business days after receipt. Opened skincare? Still reach out – we want you happy! 💝';
    }

    if (q.includes('shipping') || q.includes('delivery time') || q.includes('deliver')) {
      return '🚚 Shipping info:\n• Standard (5–7 days): Free on orders $50+, otherwise $5.99\n• Express (2–3 days): $12.99, free for Platinum members\n• Same-day (select cities): $19.99, order by 2pm\nOrder processing: 1 business day. You will get tracking via email/SMS once it ships! 📬';
    }

    if (q.includes('ingredient') || q.includes('vegan') || q.includes('cruelty') || q.includes('organic') || q.includes('natural')) {
      return '🌿 All Beauty Parlé products are cruelty-free (never tested on animals 🐰) and most are vegan (look for the 🌱 badge). Key clean ingredients we love: hyaluronic acid, niacinamide, centella asiatica, ceramides, vitamin C/E, retinol (plant-derived squalane base). Paraben-free, sulfate-free, phthalate-free. Full ingredient lists on each product page!';
    }

    if (q.includes('human') || q.includes('agent') || q.includes('support') || q.includes('person')) {
      return '👩‍💼 I can connect you to a human agent! A representative has been notified and will reply within a few minutes. In the meantime, feel free to share more details about your question or concern so they can help faster. ✨';
    }

    return '🤔 Good question! If you need help with product suggestions, share your skin type or hair concern. For order help, provide your order ID or email. Otherwise, type "agent" to chat with a human. I am here for beauty tips, skincare routines, lipstick shade matching, SPF picks, and loyalty program info! 💄✨';
  }
}
