import { AgentConfig, AgentRunLog, GatheredTopic, DraftArticle, EditedArticle, PublishedArticle } from './types';
import { gatherTopics } from './gatherer';
import { createDrafts } from './drafter';
import { editDrafts } from './editor';
import { publishArticles, isDuplicate } from './publisher';
import { getBrandConfig } from '@/lib/brand/config';

// Main orchestrator that runs all agents in sequence
export async function runAgentPipeline(brandId: string): Promise<AgentRunLog> {
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
    const agentConfig: AgentConfig = brandConfig.agentConfig;

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

    // Step 2: Create drafts
    console.log('Step 2: Creating drafts...');
    const draftResult = await createDrafts(
      gatheredTopics,
      agentConfig.defaultLanguage,
      agentConfig.maxArticlesPerRun
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
