import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { User } from '../auth/user.entity';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiGeneration } from './entities/ai-generation.entity';

@Injectable()
export class AiAssistantService implements OnModuleInit {
  private genAI!: GoogleGenerativeAI;
  private isConfigured = false;

  private functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'get_products',
      description: 'Get products by category, search term, or price range. Use this when the user asks to see products, search items, suggest items, or show catalogs.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING, description: 'Product category like Makeup, Skincare, Haircare' },
          search: { type: SchemaType.STRING, description: 'Search term/keyword matching name or description' },
          minPrice: { type: SchemaType.NUMBER, description: 'Minimum price filter value' },
          maxPrice: { type: SchemaType.NUMBER, description: 'Maximum price filter value' },
        },
      },
    },
    {
      name: 'get_sales_stats',
      description: 'Get sales statistics (total revenue, order count, and average order value) for a range. Useful to answer business queries.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          range: { type: SchemaType.STRING, description: 'Time range to filter sales', enum: ['today', 'week', 'month', 'year'], format: 'enum' },
        },
        required: ['range'],
      },
    },
    {
      name: 'get_order_details',
      description: 'Get status and summary details of a specific order by its numeric ID.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          orderId: { type: SchemaType.NUMBER, description: 'Numeric order identifier' },
        },
        required: ['orderId'],
      },
    },
    {
      name: 'navigate_to',
      description: 'Navigate the client browser tab to a specific page or route. Examples: /en/products, /en/orders, /en/profile, etc.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          route: { type: SchemaType.STRING, description: 'Destination route path' },
        },
        required: ['route'],
      },
    },
    {
      name: 'generate_chart',
      description: 'Generate config data to plot a bar, line, or pie chart for visual dashboard presentation.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: 'Visualization plot type', enum: ['bar', 'line', 'pie'], format: 'enum' },
          title: { type: SchemaType.STRING, description: 'Headline title of the chart card' },
          labels: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Names for the coordinates labels array' },
          values: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER }, description: 'Numeric data points list' },
        },
        required: ['type', 'title', 'labels', 'values'],
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
    const apiKey = this.config.get<string>('geminiApiKey') || this.config.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'placeholder_key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isConfigured = true;
      console.log('✅ [AiAssistantService] JARVIS Gemini AI Assistant initialized successfully.');
    } else {
      console.warn('⚠️ [AiAssistantService] GEMINI_API_KEY is missing. JARVIS AI will run in fallback rule-based mode.');
    }
  }

  async processMessage(userId: number, sessionId: string, messageText: string) {
    if (!this.isConfigured) {
      return {
        reply: '🌸 Hello! I am in rule-based fallback mode because GEMINI_API_KEY is not configured yet. Please configure it in your environment variables!',
        sessionId,
      };
    }

    // 1. Fetch conversation history
    const dbMessages = await this.conversationRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    // 2. Prepare Gemini contents structure
    const contents: any[] = [];
    contents.push({
      role: 'user',
      parts: [{ text: `System Instruction: You are Beauty Parlé's JARVIS-level AI Assistant. You have tools to get products, get sales statistics, get order details, trigger client-side page routing, or request interactive animated charts. Always invoke the relevant tool if the user asks for stats, products, navigation, or chart visuals. If user asks to save the conversation, acknowledge it and explain that conversation is saved to database automatically.` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will use the available tools to help the user with database lookups, charts, and page navigation.' }]
    });

    for (const msg of dbMessages) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
      } else if (msg.role === 'assistant') {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.toolCalls) {
          parts.push({ functionCall: msg.toolCalls });
        }
        contents.push({ role: 'model', parts });
      } else if (msg.role === 'tool') {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.toolCalls?.name || 'tool_response',
              response: { result: msg.content ? JSON.parse(msg.content) : {} }
            }
          }]
        });
      }
    }

    // Add current user prompt
    contents.push({ role: 'user', parts: [{ text: messageText }] });

    // Save user's question to database
    const userMessage = new AiConversation();
    userMessage.userId = userId;
    userMessage.sessionId = sessionId;
    userMessage.role = 'user';
    userMessage.content = messageText;
    await this.conversationRepo.save(userMessage);

    // Instantiate Gemini model with tool declarations
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ functionDeclarations: this.functionDeclarations }],
    });

    let result = await model.generateContent({ contents });
    let responseText = '';
    let functionCalls = result.response.functionCalls();
    let attempts = 0;
    const maxAttempts = 3;

    let chartData: any = null;
    let navigationRoute: string | null = null;
    let productsList: any[] = [];

    while (functionCalls && functionCalls.length > 0 && attempts < maxAttempts) {
      attempts++;
      const call = functionCalls[0];
      const { name, args } = call;
      const toolArgs = args as any;

      // Save assistant's function call action to DB
      const assistantCallMessage = new AiConversation();
      assistantCallMessage.userId = userId;
      assistantCallMessage.sessionId = sessionId;
      assistantCallMessage.role = 'assistant';
      assistantCallMessage.toolCalls = call;
      await this.conversationRepo.save(assistantCallMessage);

      contents.push({
        role: 'model',
        parts: [{ functionCall: call }]
      });

      let toolResult: any = null;

      try {
        if (name === 'get_products') {
          toolResult = await this.getProductsTool(toolArgs);
          productsList = toolResult;
        } else if (name === 'get_sales_stats') {
          toolResult = await this.getSalesStatsTool(toolArgs);
        } else if (name === 'get_order_details') {
          toolResult = await this.getOrderDetailsTool(toolArgs);
        } else if (name === 'navigate_to') {
          navigationRoute = toolArgs.route;
          toolResult = { success: true, route: toolArgs.route };
        } else if (name === 'generate_chart') {
          chartData = toolArgs;
          toolResult = { success: true, chart: toolArgs };

          // Save asset generation in ai_generations
          const generation = new AiGeneration();
          generation.userId = userId;
          generation.type = 'chart';
          generation.content = toolArgs;
          await this.generationRepo.save(generation);
        }
      } catch (err) {
        console.error('Error running tool ' + name, err);
        toolResult = { error: (err as any).message || 'Tool execution error' };
      }

      // Save tool response data to DB
      const toolMessage = new AiConversation();
      toolMessage.userId = userId;
      toolMessage.sessionId = sessionId;
      toolMessage.role = 'tool';
      toolMessage.content = JSON.stringify(toolResult);
      toolMessage.toolCalls = { name };
      await this.conversationRepo.save(toolMessage);

      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        }]
      });

      // Get next turn
      result = await model.generateContent({ contents });
      functionCalls = result.response.functionCalls();
    }

    responseText = result.response.text() || 'I have loaded the request data.';

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

  private async getOrderDetailsTool(args: any) {
    const { orderId } = args;
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return { error: 'Order matching specified ID was not found.' };

    return {
      id: order.id,
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    };
  }
}
