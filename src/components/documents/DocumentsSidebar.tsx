'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { 
  Plus, 
  FileText, 
  FolderOpen, 
  Settings, 
  Archive,
  Download,
  Upload,
  Users,
  Building2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface DocumentsSidebarProps {
  className?: string;
}

export default function DocumentsSidebar({ className = "" }: DocumentsSidebarProps) {
  const quickActions = [
    {
      label: 'Create Document',
      href: '/documents/create',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      label: 'Browse Templates',
      href: '/documents/templates',
      icon: FolderOpen,
      color: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    {
      label: 'Document Settings',
      href: '/documents/settings',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600 text-white'
    }
  ];

  const documentTypes = [
    {
      label: 'Listing Agreements',
      count: 12,
      icon: FileText,
      filter: 'listing_agreement'
    },
    {
      label: 'Purchase Agreements',
      count: 8,
      icon: FileText,
      filter: 'purchase_agreement'
    },
    {
      label: 'Lease Agreements',
      count: 6,
      icon: FileText,
      filter: 'lease_agreement'
    },
    {
      label: 'Disclosures',
      count: 4,
      icon: FileText,
      filter: 'disclosure'
    }
  ];

  const recentActivity = [
    {
      action: 'Document signed',
      document: 'Listing Agreement - 123 Main St',
      time: '2 hours ago',
      icon: FileText
    },
    {
      action: 'PDF generated',
      document: 'Lease Agreement - Oak Ave',
      time: '4 hours ago',
      icon: Download
    },
    {
      action: 'Document created',
      document: 'Purchase Agreement - Elm St',
      time: '1 day ago',
      icon: Plus
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button 
                  variant="outline" 
                  className={`w-full justify-start ${action.color}`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Document Types</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {documentTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <button
                key={index}
                className="group w-full flex items-center justify-between p-2 text-sm hover:bg-blue-50 hover:text-blue-600 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-sm"
              >
                <div className="flex items-center">
                  <IconComponent className="w-4 h-4 mr-2 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                  {type.label}
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {type.count}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <IconComponent className="w-4 h-4 text-gray-500 mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.document}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Shortcuts</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/clients">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              View Clients
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Building2 className="w-4 h-4 mr-2" />
              View Properties
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              View Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}