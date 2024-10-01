import { Heading } from '@/components/heading';
import { IntegrationBlock } from '@/components/integration-block';
import { getAllSecrets } from '@/lib/secrets';
import { checkSubscription } from '@/lib/subscription';
import { Settings } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { fetchIntegrations } from '@/lib/integrations';
import { authConfig } from '@/lib/auth';
import SecretsManager from '@/components/secret-manager';

const confluenceRedirectUri = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/confluence';
const slackRedirectUri = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/slack';

const confluence_scopes = [
  'read:me',
  'offline_access',
  'read:confluence-props',
  'read:confluence-content.all',
  'read:confluence-space.summary',
  'search:confluence',
  'read:confluence-content.permission',
];

const integrations = [
  {
    name: 'Google Drive',
    providerId: 'drive',
    description: 'A cloud-based file storage service',
    iconURL: '/integrations/GDrive.png',
  },
  {
    name: 'Slack',
    providerId: 'slack',
    description: 'Messaging app for business',
    iconURL: '/integrations/Slack.png',
    href: `https://rapidy-workspace.slack.com/oauth?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}&scope=groups:history%20im:history%20mpim:history%20channels:history%20channels:read&user_scope=&redirect_uri=${slackRedirectUri}&state=&granular_bot_scope=1&single_channel=0&install_redirect=&tracked=1&team=1`,
  },
  {
    name: 'Confluence',
    providerId: 'confluence',
    description: 'A web-based corporate wiki',
    iconURL: '/integrations/Confluence.png',
    href: `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${
      process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID
    }&scope=${encodeURIComponent(
      confluence_scopes.join(' ')
    )}&redirect_uri=${confluenceRedirectUri}&response_type=code&prompt=consent`,
  },
  {
    name: 'Notion',
    providerId: 'notion',
    description: 'All-in-one workspace for notes, tasks, wikis, and databases',
    iconURL: '/integrations/Notion.png',
  },
  // {
  //   name: "Dropbox",
  //   providerId: 'dropbox',
  //   description: "A cloud-based file storage service",
  //   iconURL: "/integrations/Dropbox.png"
  // }
];

const SettingsPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return <div>Not logged in</div>;
  }
  const secrets = (await getAllSecrets()) as any[];
  const isPro = await checkSubscription();
  const integrationStatuses = await fetchIntegrations(session.user.id);
  return (
    <div className='min-h-screen w-full bg-gradient-to-r from-blue-100 to-purple-100'>
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}
        iconColor="text-gray-700"
        bgColor="bg-gray-700/10"
      />
      <div className="px-4 lg:px-8 space-y-4">
        {/* <h1 className="text-xl">Plan</h1>
        <div className="text-muted-foreground -text-sm">
          {isPro ? 'You are currently on a pro plan.' : 'You are currently on a free plan.'}
        </div>
        <SubscriptionButton isPro={isPro} /> */}

        <h1 className="text-xl">Secrets</h1>
        <div className="text-muted-foreground -text-sm">
          Add your own OpenAI key to use for unlimited use!
        </div>
        <SecretsManager secrets={secrets} />

        <h1 className="text-xl">Integrations</h1>
        <div className="text-muted-foreground -text-sm">
          Add integrations of your apps to use with Rapidy
        </div>

        <div className="w-full border border-gray-200 rounded-lg pl-4 pr-4">
          {integrations.map((integration, index) => (
            <IntegrationBlock
              key={index}
              name={integration.name}
              providerId={integration.providerId}
              description={integration.description}
              iconURL={integration.iconURL}
              isConnected={!!integrationStatuses.find((i) => i.provider === integration.providerId)}
              isLastBlock={index === integrations.length - 1}
              href={integration.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
