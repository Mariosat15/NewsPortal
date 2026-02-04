import { AgentConfig, AgentRunLog, GatheredTopic, DraftArticle, EditedArticle, PublishedArticle, AIModelConfig, ArticleStyle } from './types';
import { gatherTopics } from './gatherer';
import { createDrafts } from './drafter';
import { editDrafts } from './editor';
import { publishArticles, isDuplicate } from './publisher';
import { getBrandConfig } from '@/lib/brand/config';
import { getCollection } from '@/lib/db/mongodb';

// Default configurations
const defaultAIConfig: AIModelConfig = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
};

const defaultArticleStyle: ArticleStyle = {
  types: ['news'],
  tone: 'engaging',
  depth: 'standard',
  includeImages: true,
  includeQuotes: true,
  includeSources: true,
};

// Main orchestrator that runs all agents in sequence
export async function runAgentPipeline(brandId: string, customSettings?: Partial<AgentConfig>): Promise<AgentRunLog> {
  const startTime = new Date();
  const log: AgentRunLog = {
    agentName: 'ContentPipeline',
    brandId,
    startedAt: startTime,
    status: 'running',
    itemsProcessed: 0,
    itemsSuccessful: 0,
    itemsFailed: 0,
    errors: [],
    metadata: {},
  };

  try {
    // Get brand config for agent settings
    const brandConfig = getBrandConfig(brandId);
    let agentConfig: AgentConfig = {
      enabled: brandConfig.agentConfig.enabled,
      topics: brandConfig.agentConfig.topics,
      defaultLanguage: brandConfig.agentConfig.defaultLanguage,
      maxArticlesPerRun: brandConfig.agentConfig.maxArticlesPerRun,
      cronSchedule: brandConfig.agentConfig.cronSchedule,
      rssFeeds: brandConfig.agentConfig.rssFeeds || [],
      useRSSFeeds: brandConfig.agentConfig.useRSSFeeds ?? true,
      aiModel: brandConfig.agentConfig.aiModel || defaultAIConfig,
      articleStyle: defaultArticleStyle,
      minWordCount: brandConfig.agentConfig.minWordCount || 500,
      maxWordCount: brandConfig.agentConfig.maxWordCount || 1200,
      minQualityScore: brandConfig.agentConfig.minQualityScore || 7,
      distributeEvenly: brandConfig.agentConfig.distributeEvenly ?? true,
    };

    // Try to load settings from database
    try {
      const settingsCollection = await getCollection(brandId, 'settings');
      const savedConfig = await settingsCollection.findOne({ key: 'agentConfig' });
      if (savedConfig?.value) {
        agentConfig = { ...agentConfig, ...(savedConfig.value as Partial<AgentConfig>) };
      }
    } catch (e) {
      console.log('Using default agent config');
    }

    // Apply custom settings if provided
    if (customSettings) {
      agentConfig = { ...agentConfig, ...customSettings };
    }

    if (!agentConfig.enabled) {
      log.status = 'completed';
      log.completedAt = new Date();
      log.metadata = { message: 'Agents disabled for this brand' };
      return log;
    }

    console.log(`Starting agent pipeline for brand: ${brandId}`);
    console.log(`Topics: ${agentConfig.topics.join(', ')}`);
    console.log(`Max articles: ${agentConfig.maxArticlesPerRun}`);

    // Step 1: Gather topics
    console.log('Step 1: Gathering topics...');
    const gatherResult = await gatherTopics(agentConfig);
    
    if (!gatherResult.success || !gatherResult.data) {
      throw new Error(`Topic gathering failed: ${gatherResult.error}`);
    }

    const gatheredTopics = gatherResult.data;
    log.metadata!.topicsGathered = gatheredTopics.length;
    console.log(`Gathered ${gatheredTopics.length} topics`);

    // Step 2: Create drafts with AI config and article style
    console.log('Step 2: Creating drafts...');
    const aiConfig = agentConfig.aiModel || defaultAIConfig;
    const articleStyle = agentConfig.articleStyle || agentConfig.defaultArticleStyle || defaultArticleStyle;
    
    console.log(`Using AI model: ${aiConfig.model}, Types: ${articleStyle.types?.join(', ') || 'news'}, Tone: ${articleStyle.tone}`);
    
    const draftResult = await createDrafts(
      gatheredTopics,
      agentConfig.defaultLanguage,
      agentConfig.maxArticlesPerRun,
      aiConfig,
      articleStyle
    );

    if (!draftResult.success || !draftResult.data) {
      throw new Error(`Draft creation failed: ${draftResult.error}`);
    }

    const drafts = draftResult.data;
    log.metadata!.draftsCreated = drafts.length;
    console.log(`Created ${drafts.length} drafts`);

    // Step 3: Edit drafts
    console.log('Step 3: Editing drafts...');
    const editResult = await editDrafts(drafts);

    if (!editResult.success || !editResult.data) {
      throw new Error(`Draft editing failed: ${editResult.error}`);
    }

    const editedArticles = editResult.data;
    log.metadata!.articlesEdited = editedArticles.length;
    console.log(`Edited ${editedArticles.length} articles`);

    // Filter out duplicates
    const uniqueArticles: EditedArticle[] = [];
    for (const article of editedArticles) {
      const duplicate = await isDuplicate(article.title, brandId);
      if (!duplicate) {
        uniqueArticles.push(article);
      } else {
        console.log(`Skipping duplicate: "${article.title}"`);
      }
    }

    // Step 4: Publish articles
    console.log('Step 4: Publishing articles...');
    const publishResult = await publishArticles(uniqueArticles, brandId);

    if (!publishResult.success) {
      log.errors.push(`Publishing error: ${publishResult.error}`);
    }

    const publishedArticles = publishResult.data || [];
    log.metadata!.articlesPublished = publishedArticles.length;
    console.log(`Published ${publishedArticles.length} articles`);

    // Update log stats
    log.itemsProcessed = gatheredTopics.length;
    log.itemsSuccessful = publishedArticles.length;
    log.itemsFailed = gatheredTopics.length - publishedArticles.length;
    log.status = 'completed';
    log.completedAt = new Date();

    console.log(`Pipeline completed: ${log.itemsSuccessful}/${log.itemsProcessed} articles published`);

    return log;
  } catch (error) {
    log.status = 'failed';
    log.completedAt = new Date();
    log.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('Agent pipeline failed:', error);
    return log;
  }
}

// Run pipeline for all brands with agents enabled
export async function runAllBrandPipelines(): Promise<AgentRunLog[]> {
  // In a real implementation, this would fetch all brand IDs from a database
  // For now, we just run for the default brand
  const brandIds = [process.env.BRAND_ID || 'default'];
  const logs: AgentRunLog[] = [];

  for (const brandId of brandIds) {
    try {
      const log = await runAgentPipeline(brandId);
      logs.push(log);
    } catch (error) {
      console.error(`Pipeline failed for brand ${brandId}:`, error);
    }
  }

  return logs;
}

export { gatherTopics, createDrafts, editDrafts, publishArticles };
