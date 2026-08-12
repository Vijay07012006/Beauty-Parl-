import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { User } from '../auth/user.entity';
import { UserRole } from '../auth/user.entity';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiGeneration } from './entities/ai-generation.entity';

// OpenRouter currently serves this model and it supports OpenAI-style tool calling.
// (meta-llama/llama-3-70b-instruct and mistralai/mistral-7b-instruct are both retired from the catalog.)
const DEFAULT_MODEL = 'mistralai/mistral-small-3.2-24b-instruct';

@Injectable()
export class AiAssistantService implements OnModuleInit {
  private openai!: OpenAI;
  private isConfigured = false;

  private isAdmin(role: string | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  // Strict whitelist of all pages JARVIS is allowed to navigate to.
  // This prevents open-redirect attacks — nothing outside this set will be accepted.
  private static readonly ALLOWED_PAGES = new Set([
    'profile', 'orders', 'cart', 'wishlist', 'addresses', 'checkout',
    'beauty-box', 'loyalty', 'referral', 'gamification', 'preferences',
    'quiz', 'routine-builder', 'skin-analysis', 'virtual-try-on',
    'subscriptions', 'ai-history',
    'products', 'categories', 'compare', 'looks', 'clean-beauty', 'live-shopping',
    'about', 'contact', 'faq', 'blog', 'booking', 'shipping', 'returns', 'privacy', 'terms',
    'admin/dashboard', 'admin/products', 'admin/orders', 'admin/users',
    'admin/coupons', 'admin/reviews', 'admin/settings', 'admin/ugc',
    'admin/chat', 'admin/live-shopping',
  ]);

  private sanitizeRoute(page: string | undefined): string | null {
    if (!page || typeof page !== 'string') return null;
    // Strip any leading slashes and locale prefixes (e.g. /en/cart -> cart)
    const stripped = page.replace(/^\/+/, '').replace(/^[a-z]{2}\//i, '');
    // Only allow routes in the static whitelist
    if (AiAssistantService.ALLOWED_PAGES.has(stripped)) {
      return `/${stripped}`;
    }
    return null;
  }

  private tools: any[] = [
    {
      type: 'function',
      function: {
        name: 'get_products',
        description: 'Get products by category, search term, or price range. Use this when the user asks to see products, search items, suggest items, or show catalogs.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Product category like Makeup, Skincare, Haircare' },
            search: { type: 'string', description: 'Search term/keyword matching name or description' },
            minPrice: { type: 'number', description: 'Minimum price filter value' },
            maxPrice: { type: 'number', description: 'Maximum price filter value' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_sales_stats',
        description: 'Get sales statistics (total revenue, order count, and average order value) for a range. Useful to answer business queries.',
        parameters: {
          type: 'object',
          properties: {
            range: { type: 'string', description: 'Time range to filter sales', enum: ['today', 'week', 'month', 'year'] },
          },
          required: ['range'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_order_details',
        description: 'Get status and summary details of a specific order by its numeric ID.',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'number', description: 'Numeric order identifier' },
          },
          required: ['orderId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'navigate_to',
        description: 'Navigate the client browser to a specific page. Use ONLY the page slug values listed in the enum. Do NOT include /en/ prefix or locale — the frontend will add it. For user pages: profile, orders, cart, wishlist, addresses, checkout, beauty-box, loyalty, referral, gamification, preferences, quiz, routine-builder, skin-analysis, virtual-try-on, subscriptions. For product pages: products, categories, compare, looks, clean-beauty, live-shopping. For info pages: about, contact, faq, blog, shipping, returns, privacy, terms. For admin pages: admin/dashboard, admin/products, admin/orders, admin/users, admin/coupons, admin/reviews, admin/settings, admin/ugc, admin/chat, admin/live-shopping.',
        parameters: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              description: 'The page slug to navigate to (without locale prefix). Examples: "cart", "profile", "products", "orders", "admin/dashboard".',
              enum: [
                'profile', 'orders', 'cart', 'wishlist', 'addresses', 'checkout',
                'beauty-box', 'loyalty', 'referral', 'gamification', 'preferences',
                'quiz', 'routine-builder', 'skin-analysis', 'virtual-try-on',
                'subscriptions', 'ai-history',
                'products', 'categories', 'compare', 'looks', 'clean-beauty', 'live-shopping',
                'about', 'contact', 'faq', 'blog', 'booking', 'shipping', 'returns', 'privacy', 'terms',
                'admin/dashboard', 'admin/products', 'admin/orders', 'admin/users',
                'admin/coupons', 'admin/reviews', 'admin/settings', 'admin/ugc',
                'admin/chat', 'admin/live-shopping',
              ],
            },
          },
          required: ['page'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_chart',
        description: 'Generate config data to plot a bar, line, or pie chart for visual dashboard presentation.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Visualization plot type', enum: ['bar', 'line', 'pie'] },
            title: { type: 'string', description: 'Headline title of the chart card' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Names for the coordinates labels array' },
            values: { type: 'array', items: { type: 'number' }, description: 'Numeric data points list' },
          },
          required: ['type', 'title', 'labels', 'values'],
        },
      },
    },
  ];

  constructor(
    private config: ConfigService,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(AiConversation)
    private conversationRepo: Repository<AiConversation>,
    @InjectRepository(AiGeneration)
    private generationRepo: Repository<AiGeneration>,
  ) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('openrouterApiKey') || process.env.OPENROUTER_API_KEY;
    if (apiKey && apiKey !== 'placeholder_key') {
      const frontendUrl = this.config.get<string>('frontendUrl') || 'http://localhost:3000';
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': frontendUrl,
          'X-Title': 'Beauty Parlé',
        },
      });
      this.isConfigured = true;
      console.log('✅ OpenRouter AI Assistant initialized successfully.');
    } else {
      console.warn('⚠️ [AiAssistantService] OPENROUTER_API_KEY is missing. JARVIS AI will run in fallback rule-based mode.');
    }
  }

  async processMessage(userId: number, sessionId: string, messageText: string, role?: string) {
    if (!this.isConfigured) {
      return {
        reply: '🌸 Hello! I am in rule-based fallback mode because OPENROUTER_API_KEY is not configured yet. Please configure it in your environment variables!',
        sessionId,
      };
    }

    const modelId = this.config.get<string>('openrouterModel') || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    // 1. Fetch conversation history
    const dbMessages = await this.conversationRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    // 2. Prepare OpenAI messages structure
    const messages: any[] = [];
    messages.push({
      role: 'system',
      content: `You are Beauty Parlé's JARVIS-level AI Assistant. You have tools to get products, get sales statistics, get order details, trigger client-side page routing, or request interactive animated charts. Always invoke the relevant tool if the user asks for stats, products, navigation, or chart visuals. If user asks to save the conversation, acknowledge it and explain that conversation is saved to database automatically.`
    });

    for (const msg of dbMessages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content || '' });
      } else if (msg.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls ? [msg.toolCalls] : undefined,
        });
      } else if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          tool_call_id: msg.toolCalls?.id || `call_${msg.id}`,
          content: msg.content || '{}',
        });
      }
    }

    // Add current user prompt
    messages.push({ role: 'user', content: messageText });

    // Save user's question to database
    const userMessage = new AiConversation();
    userMessage.userId = userId;
    userMessage.sessionId = sessionId;
    userMessage.role = 'user';
    userMessage.content = messageText;
    await this.conversationRepo.save(userMessage);

    let response = await this.openai.chat.completions.create({
      model: modelId,
      messages,
      tools: this.tools,
    });

    let responseMessage = response.choices[0].message;
    let responseText = responseMessage.content || '';
    let toolCalls = responseMessage.tool_calls;
    let attempts = 0;
    const maxAttempts = 3;

    let chartData: any = null;
    let navigationRoute: string | null = null;
    let productsList: any[] = [];

    while (toolCalls && toolCalls.length > 0 && attempts < maxAttempts) {
      attempts++;

      // Append assistant's turn in local context (it may contain MULTIPLE tool calls)
      messages.push(responseMessage);

      for (const call of toolCalls as any[]) {
        const { name, arguments: rawArgs } = call.function;
        let toolArgs: any = {};
        try {
          toolArgs = JSON.parse(rawArgs);
        } catch (e) {
          console.error('Failed to parse tool call arguments', e);
        }

        // Save assistant's function call action to DB
        const assistantCallMessage = new AiConversation();
        assistantCallMessage.userId = userId;
        assistantCallMessage.sessionId = sessionId;
        assistantCallMessage.role = 'assistant';
        assistantCallMessage.toolCalls = {
          id: call.id,
          type: 'function',
          function: { name, arguments: rawArgs }
        };
        await this.conversationRepo.save(assistantCallMessage);

        let toolResult: any = null;

        try {
          if (name === 'get_products') {
            toolResult = await this.getProductsTool(toolArgs);
            productsList = productsList.concat(toolResult || []);
          } else if (name === 'get_sales_stats') {
            if (!this.isAdmin(role)) {
              toolResult = { error: 'Only admins can access sales statistics.' };
            } else {
              toolResult = await this.getSalesStatsTool(toolArgs);
            }
          } else if (name === 'get_order_details') {
            toolResult = await this.getOrderDetailsTool(toolArgs, userId, role);
          } else if (name === 'navigate_to') {
            // Use 'page' (new param name) with fallback to old 'route' for backward compat
            const rawPage = toolArgs.page || toolArgs.route;
            const sanitized = this.sanitizeRoute(rawPage);
            if (sanitized) {
              navigationRoute = sanitized;
              toolResult = { success: true, route: sanitized };
            } else {
              toolResult = { error: `Page '${rawPage}' is not a valid navigation destination.` };
            }
          } else if (name === 'generate_chart') {
            chartData = toolArgs;
            toolResult = { success: true, chart: toolArgs };

            // Save asset generation in ai_generations
            const generation = new AiGeneration();
            generation.userId = userId;
            generation.type = 'chart';
            generation.content = toolArgs;
            await this.generationRepo.save(generation);
          } else {
            console.warn('Unknown tool called: ' + name);
            toolResult = { error: 'Requested tool is not available.' };
          }
        } catch (err: any) {
          console.error('Error running tool ' + name, err);
          toolResult = { error: err.message || 'Tool execution error' };
        }

        // Save tool response data to DB
        const toolMessage = new AiConversation();
        toolMessage.userId = userId;
        toolMessage.sessionId = sessionId;
        toolMessage.role = 'tool';
        toolMessage.content = JSON.stringify(toolResult);
        toolMessage.toolCalls = { id: call.id, name };
        await this.conversationRepo.save(toolMessage);

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Get next turn after the whole tool batch has been resolved
      response = await this.openai.chat.completions.create({
        model: modelId,
        messages,
        tools: this.tools,
      });
      responseMessage = response.choices[0].message;
      responseText = responseMessage.content || '';
      toolCalls = responseMessage.tool_calls;
    }

    // Save final assistant message to DB
    const finalAssistantMessage = new AiConversation();
    finalAssistantMessage.userId = userId;
    finalAssistantMessage.sessionId = sessionId;
    finalAssistantMessage.role = 'assistant';
    finalAssistantMessage.content = responseText;
    await this.conversationRepo.save(finalAssistantMessage);

    return {
      reply: responseText,
      products: productsList.length > 0 ? productsList : undefined,
      chart: chartData,
      navigation: navigationRoute,
      sessionId,
    };
  }

  async getUserHistory(userId: number) {
    return this.conversationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // == Database query tools implementations ==

  private async getProductsTool(args: any) {
    const { category, search, minPrice, maxPrice } = args;
    const query = this.productRepo.createQueryBuilder('product');

    if (category) {
      query.andWhere('LOWER(product.category) LIKE :category', { category: `%${category.toLowerCase()}%` });
    }
    if (search) {
      query.andWhere('(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)', { search: `%${search.toLowerCase()}%` });
    }
    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    return query.take(6).getMany();
  }

  private async getSalesStatsTool(args: any) {
    const { range } = args;
    let days = 1;
    if (range === 'week') days = 7;
    else if (range === 'month') days = 30;
    else if (range === 'year') days = 365;

    const query = this.orderRepo.createQueryBuilder('order');
    if (range !== 'today') {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      query.where('order.createdAt >= :dateLimit', { dateLimit });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.where('order.createdAt >= :today', { today });
    }

    const orders = await query.getMany();
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      range,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      orderCount,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
    };
  }

  private async getOrderDetailsTool(args: any, userId: number, role?: string) {
    const { orderId } = args;
    // Non-admins may only inspect their own orders (prevents order-data leakage)
    if (!Number.isInteger(Number(orderId))) {
      return { error: 'A valid numeric order ID is required.' };
    }
    const order = await this.orderRepo.findOne({ where: { id: Number(orderId) } });
    if (!order) return { error: 'Order matching specified ID was not found.' };
    if (!this.isAdmin(role) && Number(order.userId) !== Number(userId)) {
      return { error: 'Order matching specified ID was not found.' };
    }

    return {
      id: order.id,
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    };
  }
}
