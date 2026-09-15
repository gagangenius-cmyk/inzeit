'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, Facebook, Instagram, Linkedin, Settings, CheckCircle, AlertCircle,
  Copy, ExternalLink, Key, Webhook, RefreshCw, Eye, EyeOff
} from 'lucide-react';

interface WebhookConfig {
  platform: string;
  enabled: boolean;
  endpoint: string;
  secret: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'error';
  events: string[];
}

export default function WebhookIntegrations() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      platform: 'Facebook Lead Ads',
      enabled: true,
      endpoint: 'https://your-domain.com/api/lead-intake',
      secret: 'fb_webhook_secret_123',
      lastActivity: '2025-01-13 14:30:00',
      status: 'active',
      events: ['leadgen', 'leadgen_response']
    },
    {
      platform: 'Instagram',
      enabled: true,
      endpoint: 'https://your-domain.com/api/lead-intake',
      secret: 'ig_webhook_secret_456',
      lastActivity: '2025-01-13 12:15:00',
      status: 'active',
      events: ['messages', 'story_insights']
    },
    {
      platform: 'LinkedIn',
      enabled: false,
      endpoint: 'https://your-domain.com/api/lead-intake',
      secret: 'li_webhook_secret_789',
      lastActivity: '2025-01-10 09:45:00',
      status: 'inactive',
      events: ['lead_form_submission']
    },
    {
      platform: 'Website Form',
      enabled: true,
      endpoint: 'https://your-domain.com/api/lead-intake',
      secret: 'web_form_secret_012',
      lastActivity: '2025-01-13 15:22:00',
      status: 'active',
      events: ['form_submission']
    }
  ]);

  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [testing, setTesting] = useState<string | null>(null);

  const toggleWebhook = (platform: string) => {
    setWebhooks(prev => prev.map(w => 
      w.platform === platform 
        ? { ...w, enabled: !w.enabled, status: !w.enabled ? 'active' : 'inactive' }
        : w
    ));
  };

  const toggleSecret = (platform: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testWebhook = async (platform: string) => {
    setTesting(platform);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWebhooks(prev => prev.map(w => 
        w.platform === platform 
          ? { ...w, lastActivity: new Date().toISOString(), status: 'active' }
          : w
      ));
      
      window.toast.success(`Webhook test for ${platform} successful!`);
    } catch (error) {
      console.error('Webhook test failed:', error);
      window.toast.error(`Webhook test for ${platform} failed!`);
    } finally {
      setTesting(null);
    }
  };

  const regenerateSecret = (platform: string) => {
    const newSecret = `${platform.toLowerCase().replace(/\s+/g, '_')}_secret_${Date.now()}`;
    setWebhooks(prev => prev.map(w => 
      w.platform === platform 
        ? { ...w, secret: newSecret }
        : w
    ));
  };

  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('facebook')) {
      return <Facebook className="w-5 h-5 text-blue-600" />;
    }
    if (platform.toLowerCase().includes('instagram')) {
      return <Instagram className="w-5 h-5 text-pink-600" />;
    }
    if (platform.toLowerCase().includes('linkedin')) {
      return <Linkedin className="w-5 h-5 text-blue-700" />;
    }
    return <Globe className="w-5 h-5 text-gray-600" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Webhook Integrations</h2>
            <p className="text-gray-600 mt-1">Configure webhooks for automatic lead intake from external platforms</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Test All
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {webhooks.map((webhook) => (
          <div key={webhook.platform} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getPlatformIcon(webhook.platform)}
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">{webhook.platform}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(webhook.status)}
                  <button
                    onClick={() => toggleWebhook(webhook.platform)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      webhook.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        webhook.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    webhook.status === 'active' ? 'text-green-600' : 
                    webhook.status === 'error' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {webhook.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Last Activity:</span>
                  <span className="text-gray-900">
                    {new Date(webhook.lastActivity).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={webhook.endpoint}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(webhook.endpoint)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copy endpoint"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type={showSecrets[webhook.platform] ? 'text' : 'password'}
                      value={webhook.secret}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => toggleSecret(webhook.platform)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title={showSecrets[webhook.platform] ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecrets[webhook.platform] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(webhook.secret)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copy secret"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => regenerateSecret(webhook.platform)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Regenerate secret"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => testWebhook(webhook.platform)}
                  disabled={testing === webhook.platform}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {testing === webhook.platform ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Webhook className="w-4 h-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Facebook Lead Ads</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Go to Facebook Business Manager → Lead Forms</li>
              <li>Select your lead form and click "Settings"</li>
              <li>Under "Webhook Notifications", add your endpoint URL</li>
              <li>Use the provided secret key for verification</li>
              <li>Enable events: "leadgen" and "leadgen_response"</li>
            </ol>
          </div>

          <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <h4 className="font-medium text-pink-900 mb-2">Instagram</h4>
            <ol className="list-decimal list-inside text-sm text-pink-800 space-y-1">
              <li>Go to Instagram Creator Studio → Settings</li>
              <li>Connect your Facebook Page</li>
              <li>Set up webhook for message events</li>
              <li>Use the provided endpoint URL and secret</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-700 border border-blue-800 rounded-lg">
            <h4 className="font-medium text-white mb-2">LinkedIn</h4>
            <ol className="list-decimal list-inside text-sm text-blue-100 space-y-1">
              <li>Go to LinkedIn Campaign Manager</li>
              <li>Create a Lead Gen Form</li>
              <li>Configure webhook integration</li>
              <li>Use the provided endpoint URL and secret</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
