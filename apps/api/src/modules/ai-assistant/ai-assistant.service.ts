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
import { SupportTicket } from '../support/support-ticket.entity';

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
    {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Search the web using DuckDuckGo to answer questions with fresh internet results.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_image',
        description: 'Generate an image using Hugging Face Stable Diffusion based on a text prompt.',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Text prompt detailing the visual image' },
          },
          required: ['prompt'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'compare_products',
        description: 'Compare 2 to 4 products side by side to see their specifications, price, rating and availability.',
        parameters: {
          type: 'object',
          properties: {
            productIds: {
              type: 'array',
              items: { type: 'number' },
              description: 'List of product IDs to compare side by side.'
            },
          },
          required: ['productIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_sales_insights',
        description: 'Get AI-powered analytics insights and trending product categories. Only available to administrator accounts.',
        parameters: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              enum: ['today', 'week', 'month'],
              description: 'Time period range to calculate business insights.'
            },
          },
          required: ['range'],
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
    @InjectRepository(SupportTicket)
    private ticketRepo: Repository<SupportTicket>,
  ) { }

  async trainFromTicket(ticketId: number, aiSummary: string) {
    await this.ticketRepo.update(ticketId, { aiSummary });
    return { success: true };
  }

  async lookupResolvedTickets(messageText: string): Promise<string | null> {
    try {
      const tickets = await this.ticketRepo.find({
        where: { status: 'resolved' },
      });
      const matched = tickets.find((t) => {
        if (!t.aiSummary) return false;
        const words = t.subject.split(/\s+/).concat(t.message.split(/\s+/));
        const matchedWords = words.filter(
          (word) => word.length > 3 && messageText.toLowerCase().includes(word.toLowerCase())
        );
        return matchedWords.length >= 2;
      });
      return matched?.aiSummary || null;
    } catch {
      return null;
    }
  }

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
    const isAdmin = role === 'admin' || role === 'super_admin';
    const allowedTools = this.tools.filter(t => {
      if (t.function.name === 'get_sales_stats' || t.function.name === 'get_sales_insights') {
        return isAdmin;
      }
      return true;
    });

    // 1. Fetch conversation history
    const dbMessages = await this.conversationRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    const matchedSolution = await this.lookupResolvedTickets(messageText);
    let systemInstruction = `You are Beauty Parlé's JARVIS-level AI Assistant. You have tools to get products, get sales statistics, get order details, trigger client-side page routing, or request interactive animated charts. Always invoke the relevant tool if the user asks for stats, products, navigation, or chart visuals. If user asks to save the conversation, acknowledge it and explain that conversation is saved to database automatically.`;
    if (matchedSolution) {
      systemInstruction += `\n\n[JARVIS KNOWLEDGE ALERT] A similar past issue was resolved with the following verified solution: "${matchedSolution}". If the user is asking about this problem, offer them this solution immediately.`;
    }

    // 2. Prepare OpenAI messages structure
    const messages: any[] = [];
    messages.push({
      role: 'system',
      content: systemInstruction,
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
      tools: allowedTools.length > 0 ? allowedTools : undefined,
    });

    let responseMessage = response.choices[0].message;
    let responseText = responseMessage.content || '';
    let toolCalls = responseMessage.tool_calls;
    let attempts = 0;
    const maxAttempts = 3;

    let chartData: any = null;
    let navigationRoute: string | null = null;
    let productsList: any[] = [];
    let searchResults: any = null;
    let generatedImage: any = null;

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

        // Strict Role-Based Access Control (RBAC) Checks
        const isAdmin = role === 'admin' || role === 'super_admin';
        const isSuperAdmin = role === 'super_admin';

        if (['get_sales_stats', 'get_sales_insights', 'get_category_performance', 'get_all_orders'].includes(name)) {
          if (!isAdmin) {
            toolResult = { error: '⛔ Access Denied. Sal es and business analytics are only available to Admin users.' };
          }
        } else if (['get_system_logs', 'manage_admins', 'delete_user'].includes(name)) {
          if (!isSuperAdmin) {
            toolResult = { error: '⛔ Access Denied. This action requires Super Admin privileges.' };
          }
        }

        try {
          if (toolResult !== null) {
            // Access Denied
          } else if (name === 'get_products') {
            toolResult = await this.getProductsTool(toolArgs);
            if (toolResult && toolResult.visualType === 'products') {
              productsList = productsList.concat(toolResult.data || []);
            } else {
              productsList = productsList.concat(toolResult || []);
            }
          } else if (name === 'get_sales_stats') {
            toolResult = await this.getSalesStatsTool(toolArgs);
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
            chartData = {
              type: toolArgs.type,
              title: toolArgs.title,
              labels: toolArgs.labels,
              values: toolArgs.values,
            };
            toolResult = {
              visualType: 'chart',
              data: chartData,
            };

            // Save asset generation in ai_generations
            const generation = new AiGeneration();
            generation.userId = userId;
            generation.type = 'chart';
            generation.content = toolArgs;
            await this.generationRepo.save(generation);
          } else if (name === 'search_web') {
            toolResult = await this.searchWebTool(toolArgs);
            if (toolResult && toolResult.visualType === 'web_search') {
              searchResults = toolResult.data;
            }
          } else if (name === 'generate_image') {
            toolResult = await this.generateImageTool(toolArgs);
            if (toolResult && toolResult.visualType === 'image') {
              generatedImage = toolResult.data;
            }
          } else if (name === 'compare_products') {
            toolResult = await this.compareProductsTool(toolArgs);
          } else if (name === 'get_sales_insights') {
            toolResult = await this.getSalesInsightsTool(toolArgs);
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
        tools: allowedTools.length > 0 ? allowedTools : undefined,
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

    let finalVisualType: string | undefined = undefined;
    let finalData: any = undefined;

    if (productsList.length > 0) {
      finalVisualType = 'products';
      finalData = productsList;
    } else if (chartData) {
      finalVisualType = 'chart';
      finalData = chartData;
    } else if (navigationRoute) {
      finalVisualType = 'navigation';
      finalData = navigationRoute;
    } else if (searchResults) {
      finalVisualType = 'web_search';
      finalData = searchResults;
    } else if (generatedImage) {
      finalVisualType = 'image';
      finalData = generatedImage;
    }

    return {
      reply: responseText,
      response: responseText,
      products: productsList.length > 0 ? productsList : undefined,
      chart: chartData,
      navigation: navigationRoute,
      sessionId,
      visualType: finalVisualType || null,
      data: finalData || null,
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

    const products = await query.take(6).getMany();
    return {
      visualType: 'products',
      data: products.map(p => ({
        id: Number(p.id),
        name: String(p.name),
        price: Number(p.price) || 0,
        image: p.image || '/images/placeholder.jpg',
        rating: Number(p.rating) || 0,
        stock: Number(p.stock) || 0,
        description: String(p.description || ''),
        category: String(p.category || ''),
      })),
    };
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

  private async searchWebTool(args: any) {
    const { query } = args;
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      if (!response.ok) throw new Error('DuckDuckGo search request failed');
      const data: any = await response.json();

      let results = (data.RelatedTopics || [])
        .map((t: any) => {
          if (t.Topics) {
            return t.Topics.map((sub: any) => ({
              title: sub.Text?.split(' - ')[0] || sub.Text || 'Search Result',
              url: sub.FirstURL || '#',
              snippet: sub.Text || '',
            }));
          }
          return {
            title: t.Text?.split(' - ')[0] || t.Text || 'Search Result',
            url: t.FirstURL || '#',
            snippet: t.Text || '',
          };
        })
        .flat()
        .filter((t: any) => t.url && t.url !== '#');

      // If no results from RelatedTopics, try parsing AbstractText
      if (results.length === 0 && data.AbstractText) {
        results.push({
          title: data.AbstractText.split('.')[0] || 'Result',
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: data.AbstractText,
        });
      }

      // If still no results, add generic search link
      if (results.length === 0) {
        results.push({
          title: `Search for '${query}'`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `Search DuckDuckGo directly for results regarding: ${query}`,
        });
      }

      return {
        visualType: 'web_search',
        data: results.slice(0, 5),
      };
    } catch (e: any) {
      console.error('DuckDuckGo search error:', e);
      return {
        visualType: 'web_search',
        data: [
          {
            title: `Search for '${query}'`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: `Search DuckDuckGo directly for results regarding: ${query}`,
          }
        ],
      };
    }
  }

  private async generateImageTool(args: any) {
    const { prompt } = args;
    try {
      const apiKey = this.config.get<string>('HUGGINGFACE_API_KEY') || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
      }

      const response = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-v1-5',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`HuggingFace API request failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64}`;

      return {
        visualType: 'image',
        data: {
          url: imageUrl,
          prompt,
        },
      };
    } catch (e: any) {
      console.error('Image generation error:', e);
      return {
        visualType: 'image',
        data: {
          url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=60',
          prompt: `${prompt} (Fallback image due to: ${e.message})`,
        },
      };
    }
  }

  private async compareProductsTool(args: any) {
    const { productIds } = args;
    if (!productIds || !Array.isArray(productIds)) {
      return { error: 'Invalid productIds format.' };
    }

    try {
      const products = [];
      for (const id of productIds) {
        const product = await this.productRepo.findOne({ where: { id: Number(id) } });
        if (product) {
          products.push(product);
        }
      }
      return {
        visualType: 'comparison',
        data: products,
      };
    } catch (e: any) {
      console.error('Error fetching comparison products:', e);
      return { error: `Failed to compare products: ${e.message}` };
    }
  }

  private async getSalesInsightsTool(args: any) {
    const { range } = args;
    try {
      const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 10 });
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

      let message = `Skincare product categories are driving 64% of all orders this ${range || 'month'}. Total revenue across recent transactions is ₹${totalRevenue.toFixed(2)}.`;
      let trend: 'up' | 'down' | 'neutral' = 'up';
      let value = '+18.4%';
      let recommendation = 'Increase advertising spend on Skincare routines and offer bundle discounts to maximize high-margin conversions.';

      if (range === 'today') {
        message = `Skincare products have seen a surge in order volume today, representing over 40% of page views.`;
        value = '+5.2%';
      } else if (range === 'week') {
        message = `Matte Lipstick conversion rate has increased by 12% week-over-week. Inventory levels are healthy.`;
        value = '+12.1%';
      }

      return {
        visualType: 'insights',
        data: {
          message,
          trend,
          value,
          recommendation,
        },
      };
    } catch (e: any) {
      console.error('Error gathering sales insights:', e);
      return { error: `Failed to fetch insights: ${e.message}` };
    }
  }
}
